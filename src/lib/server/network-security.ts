import { isIP } from "node:net";
import { domainToASCII } from "node:url";
import { lookup as systemLookup } from "node:dns/promises";

export type NetworkErrorCode =
  | "INVALID_INPUT"
  | "BLOCKED_TARGET"
  | "TIMEOUT"
  | "TOO_LARGE"
  | "RATE_LIMITED"
  | "UPSTREAM_FAILURE";

export class SafeNetworkError extends Error {
  constructor(
    public readonly code: NetworkErrorCode,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export function safeNetworkMessage(caught: unknown) {
  return caught instanceof SafeNetworkError
    ? caught.message
    : "The remote operation could not be completed safely.";
}

const blockedSuffixes = [
  ".localhost",
  ".local",
  ".internal",
  ".home.arpa",
  ".test",
  ".invalid",
  ".onion",
];

export function normalizeHostname(input: string) {
  const trimmed = input
    .trim()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");
  if (isIP(trimmed)) return trimmed.toLowerCase();
  const ascii = domainToASCII(trimmed).toLowerCase();
  if (!ascii || ascii.length > 253)
    throw new SafeNetworkError("INVALID_INPUT", "Enter a valid hostname.");
  if (
    ascii === "localhost" ||
    blockedSuffixes.some((suffix) => ascii.endsWith(suffix))
  )
    throw new SafeNetworkError(
      "BLOCKED_TARGET",
      "Local and special-use hostnames are not allowed.",
    );
  const labels = ascii.split(".");
  if (
    labels.length < 2 ||
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
    )
  )
    throw new SafeNetworkError(
      "INVALID_INPUT",
      "Enter a valid public hostname.",
    );
  return ascii;
}

function ipv4Number(address: string) {
  const parts = address.split(".");
  if (
    parts.length !== 4 ||
    parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)
  )
    return null;
  return parts.reduce((value, part) => value * 256 + Number(part), 0) >>> 0;
}

function inV4(value: number, base: string, prefix: number) {
  const target = ipv4Number(base)!;
  if (prefix === 0) return true;
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return (value & mask) === (target & mask);
}

const specialV4: [string, number, string][] = [
  ["0.0.0.0", 8, "unspecified/current-network"],
  ["10.0.0.0", 8, "private"],
  ["100.64.0.0", 10, "shared address space"],
  ["127.0.0.0", 8, "loopback"],
  ["169.254.0.0", 16, "link-local"],
  ["172.16.0.0", 12, "private"],
  ["192.0.0.0", 24, "special-use"],
  ["192.0.2.0", 24, "documentation"],
  ["192.88.99.0", 24, "deprecated relay"],
  ["192.168.0.0", 16, "private"],
  ["198.18.0.0", 15, "benchmarking"],
  ["198.51.100.0", 24, "documentation"],
  ["203.0.113.0", 24, "documentation"],
  ["224.0.0.0", 4, "multicast"],
  ["240.0.0.0", 4, "reserved"],
];

function parseIpv6(address: string) {
  let value = address.toLowerCase().replace(/^\[|\]$/g, ""),
    embedded: number[] = [];
  if (value.includes(".")) {
    const index = value.lastIndexOf(":"),
      v4 = ipv4Number(value.slice(index + 1));
    if (v4 === null) return null;
    embedded = [(v4 >>> 16) & 0xffff, v4 & 0xffff];
    value = value.slice(0, index);
  }
  if ((value.match(/::/g) ?? []).length > 1) return null;
  const [leftText, rightText] = value.split("::"),
    left = leftText ? leftText.split(":") : [],
    right = rightText ? rightText.split(":") : [],
    missing = 8 - left.length - right.length - embedded.length;
  if (
    (value.includes("::") && missing < 1) ||
    (!value.includes("::") && missing !== 0)
  )
    return null;
  const groups = [...left, ...Array(missing).fill("0"), ...right].map(
    (group) => (/^[0-9a-f]{1,4}$/.test(group) ? parseInt(group, 16) : -1),
  );
  groups.push(...embedded);
  return groups.length === 8 && groups.every((group) => group >= 0)
    ? groups
    : null;
}

export interface IpClassification {
  version: 4 | 6;
  public: boolean;
  reason: string;
}

export function classifyIpAddress(address: string): IpClassification {
  const normalized = address.replace(/^\[|\]$/g, ""),
    version = isIP(normalized);
  if (version === 4) {
    const value = ipv4Number(normalized)!;
    const match = specialV4.find(([base, prefix]) => inV4(value, base, prefix));
    return {
      version: 4 as const,
      public: !match,
      reason: match?.[2] ?? "public",
    };
  }
  if (version !== 6)
    throw new SafeNetworkError("INVALID_INPUT", "Enter a valid IP address.");
  const groups = parseIpv6(normalized)!;
  if (
    groups.slice(0, 5).every((group) => group === 0) &&
    groups[5] === 0xffff
  ) {
    const embedded = `${groups[6]! >> 8}.${groups[6]! & 255}.${groups[7]! >> 8}.${groups[7]! & 255}`;
    const result: IpClassification = classifyIpAddress(embedded);
    return {
      version: 6 as const,
      public: result.public,
      reason: `IPv4-mapped ${result.reason}`,
    };
  }
  const first = groups[0]!,
    second = groups[1]!;
  let reason: string | undefined;
  if (groups.every((group) => group === 0)) reason = "unspecified";
  else if (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1)
    reason = "loopback";
  else if ((first & 0xfe00) === 0xfc00) reason = "unique-local";
  else if ((first & 0xffc0) === 0xfe80) reason = "link-local";
  else if ((first & 0xff00) === 0xff00) reason = "multicast";
  else if (first === 0x2001 && second === 0x0db8) reason = "documentation";
  else if (first === 0x0100 && second === 0) reason = "discard-only";
  else if (
    first === 0x2001 &&
    (second === 0 || second === 2 || second === 0x10)
  )
    reason = "transition/special-use";
  else if (first === 0x2002) reason = "6to4 transition";
  return { version: 6 as const, public: !reason, reason: reason ?? "public" };
}

export function assertPublicIp(address: string) {
  const classification = classifyIpAddress(address);
  if (!classification.public)
    throw new SafeNetworkError(
      "BLOCKED_TARGET",
      "Private, local, and special-use network targets are not allowed.",
    );
  return classification;
}

export interface LookupAddress {
  address: string;
  family: number;
}

export type HostLookup = (hostname: string) => Promise<LookupAddress[]>;

export const defaultHostLookup: HostLookup = async (hostname) =>
  systemLookup(hostname, { all: true, verbatim: true });

export async function resolvePublicHostname(
  input: string,
  lookup: HostLookup = defaultHostLookup,
) {
  const hostname = normalizeHostname(input);
  if (isIP(hostname)) {
    assertPublicIp(hostname);
    return {
      hostname,
      addresses: [{ address: hostname, family: isIP(hostname) }],
    };
  }
  let addresses: LookupAddress[];
  try {
    addresses = await lookup(hostname);
  } catch {
    throw new SafeNetworkError(
      "UPSTREAM_FAILURE",
      "The hostname could not be resolved safely.",
      502,
    );
  }
  if (!addresses.length)
    throw new SafeNetworkError(
      "UPSTREAM_FAILURE",
      "The hostname has no usable addresses.",
      502,
    );
  for (const result of addresses) assertPublicIp(result.address);
  return { hostname, addresses };
}

export async function withTimeout<T>(
  operation: Promise<T>,
  milliseconds: number,
  message = "The remote operation timed out.",
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new SafeNetworkError("TIMEOUT", message, 504)),
          milliseconds,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export class TtlCache<T> {
  private values = new Map<string, { expires: number; value: T }>();
  constructor(
    private readonly maxEntries: number,
    private readonly now: () => number = Date.now,
  ) {}
  get(key: string) {
    const item = this.values.get(key);
    if (!item) return undefined;
    if (item.expires <= this.now()) {
      this.values.delete(key);
      return undefined;
    }
    return item.value;
  }
  set(key: string, value: T, ttlMilliseconds: number) {
    if (this.values.size >= this.maxEntries && !this.values.has(key))
      this.values.delete(this.values.keys().next().value!);
    this.values.set(key, { value, expires: this.now() + ttlMilliseconds });
  }
  clear() {
    this.values.clear();
  }
}

export class SlidingWindowRateLimiter {
  private buckets = new Map<string, number[]>();
  constructor(
    private readonly limit: number,
    private readonly windowMilliseconds: number,
    private readonly now: () => number = Date.now,
  ) {}
  check(key: string) {
    const cutoff = this.now() - this.windowMilliseconds,
      recent = (this.buckets.get(key) ?? []).filter((time) => time > cutoff);
    if (recent.length >= this.limit)
      throw new SafeNetworkError(
        "RATE_LIMITED",
        "Too many requests. Please wait and try again.",
        429,
      );
    recent.push(this.now());
    this.buckets.set(key, recent);
  }
  clear() {
    this.buckets.clear();
  }
}
