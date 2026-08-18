import { describe, expect, it, vi } from "vitest";
import {
  DnsLookupService,
  type DnsResolverAdapter,
} from "@/lib/server/dns-lookup";
import { TtlCache } from "@/lib/server/network-security";
import type { DnsLookupResponse } from "@/lib/dns-shared";

function resolver(
  overrides: Partial<DnsResolverAdapter> = {},
): DnsResolverAdapter {
  const missing = async () => [];
  return {
    resolve4: async () => [{ address: "93.184.216.34", ttl: 120 }],
    resolve6: missing,
    resolveCname: missing,
    resolveMx: missing,
    resolveTxt: missing,
    resolveNs: missing,
    resolveSoa: async () => ({}),
    resolveCaa: missing,
    reverse: async () => ["dns.google"],
    ...overrides,
  };
}

const publicLookup = async () => [{ address: "93.184.216.34", family: 4 }];

describe("DNS lookup service", () => {
  it("normalizes Unicode names and returns bounded record metadata", async () => {
    const resolve4 = vi.fn(async () => [{ address: "93.184.216.34", ttl: 60 }]),
      service = new DnsLookupService(resolver({ resolve4 }), publicLookup);
    const result = await service.lookupRecords("BÜCHER.example", ["A"]);
    expect(resolve4).toHaveBeenCalledWith("xn--bcher-kva.example");
    expect(result).toMatchObject({
      normalizedName: "xn--bcher-kva.example",
      cached: false,
      resolver: { kind: "recursive", authoritative: false },
      records: [{ type: "A", value: "93.184.216.34", ttl: 60 }],
    });
  });

  it("supports PTR only for public IP inputs", async () => {
    const service = new DnsLookupService(resolver(), publicLookup);
    await expect(
      service.lookupRecords("8.8.8.8", ["PTR"]),
    ).resolves.toMatchObject({
      records: [{ type: "PTR", value: "dns.google" }],
    });
    await expect(service.lookupRecords("8.8.8.8", ["A"])).rejects.toThrow(
      /PTR/,
    );
    await expect(service.lookupRecords("example.com", ["PTR"])).rejects.toThrow(
      /requires/,
    );
    await expect(
      service.lookupRecords("127.0.0.1", ["PTR"]),
    ).rejects.toMatchObject({ code: "BLOCKED_TARGET" });
  });

  it("returns stable no-data, timeout, and provider errors", async () => {
    const notFound = Object.assign(new Error("provider detail"), {
        code: "ENOTFOUND",
      }),
      failed = Object.assign(new Error("provider secret"), {
        code: "ESERVFAIL",
      });
    await expect(
      new DnsLookupService(
        resolver({
          resolve4: async () => {
            throw notFound;
          },
        }),
        publicLookup,
      ).lookupRecords("example.com", ["A"]),
    ).rejects.toMatchObject({
      status: 404,
      message: expect.stringContaining("NXDOMAIN"),
    });
    await expect(
      new DnsLookupService(
        resolver({
          resolve4: async () => {
            throw failed;
          },
        }),
        publicLookup,
      ).lookupRecords("example.com", ["A"]),
    ).rejects.toMatchObject({
      status: 502,
      message: expect.not.stringContaining("secret"),
    });
    await expect(
      new DnsLookupService(
        resolver({ resolve4: () => new Promise(() => {}) }),
        publicLookup,
        undefined,
        Date.now,
        10,
      ).lookupRecords("example.com", ["A"]),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  it("blocks private answers and malformed names/types", async () => {
    await expect(
      new DnsLookupService(
        resolver({ resolve4: async () => [{ address: "10.0.0.2", ttl: 60 }] }),
        publicLookup,
      ).lookupRecords("example.com", ["A"]),
    ).rejects.toMatchObject({ code: "BLOCKED_TARGET" });
    const service = new DnsLookupService(resolver(), publicLookup);
    await expect(
      service.lookupRecords("bad_label.example", ["A"]),
    ).rejects.toThrow(/valid public/);
    await expect(
      service.lookupRecords("example.com", ["BOGUS"]),
    ).rejects.toThrow(/invalid/);
    await expect(
      service.lookupRecords("example.com", ["A", "A"]),
    ).rejects.toThrow(/invalid/);
  });

  it("uses TTL caching without calling the resolver again", async () => {
    let now = 1_700_000_000_000;
    const resolve4 = vi.fn(async () => [{ address: "93.184.216.34", ttl: 60 }]),
      cache = new TtlCache<Omit<DnsLookupResponse, "cached">>(5, () => now),
      service = new DnsLookupService(
        resolver({ resolve4 }),
        publicLookup,
        cache,
        () => now,
      );
    expect((await service.lookupRecords("example.com", ["A"])).cached).toBe(
      false,
    );
    expect((await service.lookupRecords("example.com", ["A"])).cached).toBe(
      true,
    );
    expect(resolve4).toHaveBeenCalledTimes(1);
    now += 61_000;
    expect((await service.lookupRecords("example.com", ["A"])).cached).toBe(
      false,
    );
    expect(resolve4).toHaveBeenCalledTimes(2);
  });
});
