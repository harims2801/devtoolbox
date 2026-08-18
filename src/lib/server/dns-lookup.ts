import { Resolver } from "node:dns/promises";
import { isIP } from "node:net";
import {
  DNS_RECORD_TYPES,
  type DnsLookupResponse,
  type DnsRecord,
  type DnsRecordType,
} from "@/lib/dns-shared";
import {
  assertPublicIp,
  normalizeHostname,
  resolvePublicHostname,
  SafeNetworkError,
  TtlCache,
  withTimeout,
  type HostLookup,
} from "@/lib/server/network-security";

export interface DnsResolverAdapter {
  resolve4(hostname: string): Promise<Array<{ address: string; ttl: number }>>;
  resolve6(hostname: string): Promise<Array<{ address: string; ttl: number }>>;
  resolveCname(hostname: string): Promise<string[]>;
  resolveMx(
    hostname: string,
  ): Promise<Array<{ exchange: string; priority: number }>>;
  resolveTxt(hostname: string): Promise<string[][]>;
  resolveNs(hostname: string): Promise<string[]>;
  resolveSoa(hostname: string): Promise<Record<string, string | number>>;
  resolveCaa(hostname: string): Promise<Array<Record<string, string | number>>>;
  reverse(address: string): Promise<string[]>;
}

export class NodeDnsResolver implements DnsResolverAdapter {
  private resolver = new Resolver();
  resolve4(hostname: string) {
    return this.resolver.resolve4(hostname, { ttl: true });
  }
  resolve6(hostname: string) {
    return this.resolver.resolve6(hostname, { ttl: true });
  }
  resolveCname(hostname: string) {
    return this.resolver.resolveCname(hostname);
  }
  resolveMx(hostname: string) {
    return this.resolver.resolveMx(hostname);
  }
  resolveTxt(hostname: string) {
    return this.resolver.resolveTxt(hostname);
  }
  resolveNs(hostname: string) {
    return this.resolver.resolveNs(hostname);
  }
  async resolveSoa(hostname: string) {
    return (await this.resolver.resolveSoa(hostname)) as unknown as Record<
      string,
      string | number
    >;
  }
  async resolveCaa(hostname: string) {
    return (await this.resolver.resolveCaa(hostname)) as unknown as Array<
      Record<string, string | number>
    >;
  }
  reverse(address: string) {
    return this.resolver.reverse(address);
  }
}

function dnsMissing(caught: unknown) {
  const code =
    caught && typeof caught === "object" && "code" in caught
      ? String(caught.code)
      : "";
  return ["ENODATA", "ENOTFOUND", "ENONAME"].includes(code);
}

function ensureRecordTypes(types: readonly string[], ipInput: boolean) {
  if (!types.length || types.length > DNS_RECORD_TYPES.length)
    throw new SafeNetworkError(
      "INVALID_INPUT",
      "Select at least one DNS record type.",
    );
  const unique = Array.from(new Set(types));
  if (
    unique.length !== types.length ||
    unique.some((type) => !DNS_RECORD_TYPES.includes(type as DnsRecordType))
  )
    throw new SafeNetworkError(
      "INVALID_INPUT",
      "One or more DNS record types are invalid.",
    );
  if (ipInput && (unique.length !== 1 || unique[0] !== "PTR"))
    throw new SafeNetworkError(
      "INVALID_INPUT",
      "IP addresses can only be used with PTR reverse lookup.",
    );
  if (!ipInput && unique.includes("PTR"))
    throw new SafeNetworkError(
      "INVALID_INPUT",
      "PTR lookup requires an IPv4 or IPv6 address.",
    );
  return unique as DnsRecordType[];
}

async function queryType(
  resolver: DnsResolverAdapter,
  name: string,
  type: DnsRecordType,
): Promise<DnsRecord[]> {
  try {
    if (type === "A")
      return (await resolver.resolve4(name)).map((record) => ({
        type,
        name,
        value: record.address,
        ttl: record.ttl,
      }));
    if (type === "AAAA")
      return (await resolver.resolve6(name)).map((record) => ({
        type,
        name,
        value: record.address,
        ttl: record.ttl,
      }));
    if (type === "CNAME")
      return (await resolver.resolveCname(name)).map((value) => ({
        type,
        name,
        value: normalizeHostname(value),
      }));
    if (type === "MX")
      return (await resolver.resolveMx(name)).map((record) => ({
        type,
        name,
        value: normalizeHostname(record.exchange),
        priority: record.priority,
      }));
    if (type === "TXT")
      return (await resolver.resolveTxt(name)).map((parts) => ({
        type,
        name,
        value: parts.join("").slice(0, 2048),
      }));
    if (type === "NS")
      return (await resolver.resolveNs(name)).map((value) => ({
        type,
        name,
        value: normalizeHostname(value),
      }));
    if (type === "SOA") {
      const value = await resolver.resolveSoa(name);
      return [{ type, name, value: JSON.stringify(value) }];
    }
    if (type === "CAA")
      return (await resolver.resolveCaa(name)).map((value) => ({
        type,
        name,
        value: JSON.stringify(value),
      }));
    return (await resolver.reverse(name)).map((value) => ({
      type,
      name,
      value: normalizeHostname(value),
    }));
  } catch (caught) {
    if (caught instanceof SafeNetworkError) throw caught;
    if (dnsMissing(caught)) return [];
    throw new SafeNetworkError(
      "UPSTREAM_FAILURE",
      "The recursive DNS provider could not complete this query.",
      502,
    );
  }
}

export class DnsLookupService {
  constructor(
    private readonly resolver: DnsResolverAdapter = new NodeDnsResolver(),
    private readonly lookup?: HostLookup,
    private readonly cache = new TtlCache<Omit<DnsLookupResponse, "cached">>(
      200,
    ),
    private readonly now: () => number = Date.now,
    private readonly timeoutMilliseconds = 4000,
  ) {}

  async lookupRecords(
    query: string,
    requestedTypes: readonly string[],
  ): Promise<DnsLookupResponse> {
    if (query.length > 253)
      throw new SafeNetworkError("INVALID_INPUT", "The DNS name is too long.");
    const trimmed = query.trim(),
      ipInput = isIP(trimmed) !== 0,
      types = ensureRecordTypes(requestedTypes, ipInput);
    let normalizedName: string;
    if (ipInput) {
      assertPublicIp(trimmed);
      normalizedName = trimmed.toLowerCase();
    } else {
      normalizedName = normalizeHostname(trimmed);
      await withTimeout(
        resolvePublicHostname(normalizedName, this.lookup),
        this.timeoutMilliseconds,
        "DNS safety resolution timed out.",
      );
    }
    const key = `${normalizedName}|${[...types].sort().join(",")}`,
      cached = this.cache.get(key);
    if (cached) return { ...cached, cached: true };
    const records = (
      await withTimeout(
        Promise.all(
          types.map((type) => queryType(this.resolver, normalizedName, type)),
        ),
        this.timeoutMilliseconds,
        "The DNS query timed out.",
      )
    )
      .flat()
      .slice(0, 100);
    for (const record of records)
      if (record.type === "A" || record.type === "AAAA")
        assertPublicIp(record.value);
    if (!records.length)
      throw new SafeNetworkError(
        "UPSTREAM_FAILURE",
        "No records were found for the selected types (NXDOMAIN or no data).",
        404,
      );
    const value: Omit<DnsLookupResponse, "cached"> = {
      query,
      normalizedName,
      records,
      resolver: {
        kind: "recursive",
        name: "Server-configured recursive resolver",
        authoritative: false,
      },
      queriedAt: new Date(this.now()).toISOString(),
    };
    const minimumTtl = Math.min(
      300,
      ...records.map((record) => record.ttl ?? 300),
    );
    this.cache.set(key, value, Math.max(10, minimumTtl) * 1000);
    return { ...value, cached: false };
  }
}
