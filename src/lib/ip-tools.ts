export interface IPv4Calculation {
  input: string;
  address: string;
  prefix: number;
  network: string;
  broadcast: string;
  subnetMask: string;
  wildcardMask: string;
  firstUsable: string;
  lastUsable: string;
  totalAddresses: bigint;
  usableHosts: bigint;
  binary: string;
  pointToPoint: boolean;
}
function parts(address: string) {
  const values = address.split(".");
  if (
    values.length !== 4 ||
    values.some((x) => !/^\d{1,3}$/.test(x) || Number(x) > 255)
  )
    throw new Error("Enter a valid IPv4 address.");
  return values.map(Number);
}
export function ipv4ToBigInt(address: string) {
  return parts(address).reduce(
    (value, part) => (value << 8n) | BigInt(part),
    0n,
  );
}
export function bigIntToIPv4(value: bigint) {
  return [24n, 16n, 8n, 0n]
    .map((shift) => Number((value >> shift) & 255n))
    .join(".");
}
export function prefixToMask(prefix: number) {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32)
    throw new Error("IPv4 prefix must be between 0 and 32.");
  return prefix === 0
    ? 0n
    : ((1n << BigInt(prefix)) - 1n) << BigInt(32 - prefix);
}
export function maskToPrefix(mask: string) {
  const value = ipv4ToBigInt(mask),
    binary = value.toString(2).padStart(32, "0");
  if (!/^1*0*$/.test(binary))
    throw new Error("Subnet mask bits must be contiguous.");
  return binary.indexOf("0") === -1 ? 32 : binary.indexOf("0");
}
export function calculateIPv4(input: string): IPv4Calculation {
  const match = /^([^/]+)\/(\d{1,2})$/.exec(input.trim());
  if (!match)
    throw new Error(
      "Enter IPv4 in address/prefix form, such as 192.168.1.10/24.",
    );
  const address = bigIntToIPv4(ipv4ToBigInt(match[1]!)),
    prefix = Number(match[2]),
    mask = prefixToMask(prefix),
    wildcard = ((1n << 32n) - 1n) ^ mask,
    value = ipv4ToBigInt(address),
    network = value & mask,
    broadcast = network | wildcard,
    total = 1n << BigInt(32 - prefix),
    pointToPoint = prefix === 31;
  return {
    input,
    address,
    prefix,
    network: bigIntToIPv4(network),
    broadcast: bigIntToIPv4(broadcast),
    subnetMask: bigIntToIPv4(mask),
    wildcardMask: bigIntToIPv4(wildcard),
    firstUsable: bigIntToIPv4(prefix >= 31 ? network : network + 1n),
    lastUsable: bigIntToIPv4(
      prefix === 32 ? network : prefix === 31 ? broadcast : broadcast - 1n,
    ),
    totalAddresses: total,
    usableHosts: prefix === 32 ? 1n : prefix === 31 ? 2n : total - 2n,
    binary: parts(address)
      .map((x) => x.toString(2).padStart(8, "0"))
      .join("."),
    pointToPoint,
  };
}
export function containsIPv4(cidr: string, address: string) {
  const calc = calculateIPv4(cidr),
    value = ipv4ToBigInt(address);
  return (
    value >= ipv4ToBigInt(calc.network) && value <= ipv4ToBigInt(calc.broadcast)
  );
}
export function cidrOverlap(first: string, second: string) {
  const a = calculateIPv4(first),
    b = calculateIPv4(second);
  return (
    ipv4ToBigInt(a.network) <= ipv4ToBigInt(b.broadcast) &&
    ipv4ToBigInt(b.network) <= ipv4ToBigInt(a.broadcast)
  );
}
export function subnetIPv4(
  cidr: string,
  newPrefix: number,
  offset = 0,
  limit = 50,
) {
  const base = calculateIPv4(cidr);
  if (newPrefix < base.prefix || newPrefix > 32)
    throw new Error(`New prefix must be between ${base.prefix} and 32.`);
  const count = 1n << BigInt(newPrefix - base.prefix),
    size = 1n << BigInt(32 - newPrefix),
    start = Math.max(0, offset),
    items: string[] = [];
  for (
    let index = BigInt(start);
    index < count && items.length < limit;
    index++
  )
    items.push(
      `${bigIntToIPv4(ipv4ToBigInt(base.network) + index * size)}/${newPrefix}`,
    );
  return {
    items,
    total: count,
    next: start + items.length < Number(count) ? start + items.length : null,
  };
}
function parseIPv6Groups(address: string) {
  let text = address.toLowerCase();
  if (text.includes(".")) {
    const last = text.slice(text.lastIndexOf(":") + 1),
      v = ipv4ToBigInt(last);
    text =
      text.slice(0, text.lastIndexOf(":")) +
      ":" +
      ((v >> 16n) & 65535n).toString(16) +
      ":" +
      (v & 65535n).toString(16);
  }
  if ((text.match(/::/g) ?? []).length > 1)
    throw new Error("Enter a valid IPv6 address.");
  const [left, right] = text.split("::"),
    a = left ? left.split(":") : [],
    b = right ? right.split(":") : [],
    missing = 8 - a.length - b.length;
  if (
    (text.includes("::") && missing < 1) ||
    (!text.includes("::") && missing !== 0)
  )
    throw new Error("Enter a valid IPv6 address.");
  const groups = [...a, ...Array(missing).fill("0"), ...b];
  if (
    groups.length !== 8 ||
    groups.some((x) => !x || !/^[0-9a-f]{1,4}$/.test(x))
  )
    throw new Error("Enter a valid IPv6 address.");
  return groups.map((x) => parseInt(x, 16));
}
export function expandIPv6(input: string) {
  const [address, prefixText] = input.trim().split("/"),
    prefix = prefixText === undefined ? 128 : Number(prefixText);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 128)
    throw new Error("IPv6 prefix must be between 0 and 128.");
  const groups = parseIPv6Groups(address!);
  return {
    expanded: groups.map((x) => x.toString(16).padStart(4, "0")).join(":"),
    compressed: compressGroups(groups),
    prefix,
    type: ipv6Type(groups),
  };
}
function compressGroups(groups: number[]) {
  const values = groups.map((x) => x.toString(16));
  let bestStart = -1,
    bestLength = 0,
    start = -1;
  for (let i = 0; i <= groups.length; i++) {
    if (i < groups.length && groups[i] === 0) {
      if (start < 0) start = i;
    } else if (start >= 0) {
      if (i - start > bestLength) {
        bestStart = start;
        bestLength = i - start;
      }
      start = -1;
    }
  }
  if (bestLength < 2) return values.join(":");
  const left = values.slice(0, bestStart).join(":"),
    right = values.slice(bestStart + bestLength).join(":");
  return `${left}::${right}`;
}
function ipv6Type(groups: number[]) {
  if (groups.every((x) => x === 0)) return "unspecified";
  if (groups.slice(0, 7).every((x) => x === 0) && groups[7] === 1)
    return "loopback";
  if ((groups[0]! & 0xffc0) === 0xfe80) return "link-local";
  if ((groups[0]! & 0xfe00) === 0xfc00) return "unique local";
  if ((groups[0]! & 0xff00) === 0xff00) return "multicast";
  return "global unicast";
}
