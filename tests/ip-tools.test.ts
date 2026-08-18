import { describe, expect, it } from "vitest";
import {
  calculateIPv4,
  cidrOverlap,
  containsIPv4,
  expandIPv6,
  maskToPrefix,
  subnetIPv4,
} from "@/lib/ip-tools";
describe("IP tools", () => {
  it("calculates IPv4 networks", () => {
    const x = calculateIPv4("192.168.1.42/24");
    expect(x.network).toBe("192.168.1.0");
    expect(x.broadcast).toBe("192.168.1.255");
    expect(x.subnetMask).toBe("255.255.255.0");
    expect(x.usableHosts).toBe(254n);
  });
  it("handles /31 and /32", () => {
    expect(calculateIPv4("10.0.0.0/31")).toMatchObject({
      firstUsable: "10.0.0.0",
      lastUsable: "10.0.0.1",
      usableHosts: 2n,
      pointToPoint: true,
    });
    expect(calculateIPv4("10.0.0.7/32")).toMatchObject({
      network: "10.0.0.7",
      broadcast: "10.0.0.7",
      usableHosts: 1n,
    });
  });
  it("handles the full IPv4 range", () => {
    expect(calculateIPv4("203.0.113.9/0")).toMatchObject({
      network: "0.0.0.0",
      broadcast: "255.255.255.255",
      totalAddresses: 4_294_967_296n,
      usableHosts: 4_294_967_294n,
    });
  });
  it("checks membership and overlap", () => {
    expect(containsIPv4("10.0.0.0/24", "10.0.0.255")).toBe(true);
    expect(containsIPv4("10.0.0.0/24", "10.0.1.1")).toBe(false);
    expect(cidrOverlap("10.0.0.0/24", "10.0.0.128/25")).toBe(true);
    expect(cidrOverlap("10.0.0.0/24", "10.0.1.0/24")).toBe(false);
  });
  it("converts masks and paginates subnets", () => {
    expect(maskToPrefix("255.255.254.0")).toBe(23);
    expect(() => maskToPrefix("255.0.255.0")).toThrow(/contiguous/);
    expect(subnetIPv4("10.0.0.0/24", 26, 0, 2)).toEqual({
      items: ["10.0.0.0/26", "10.0.0.64/26"],
      total: 4n,
      next: 2,
    });
  });
  it("expands and compresses IPv6", () => {
    expect(expandIPv6("2001:db8::1/64")).toEqual({
      expanded: "2001:0db8:0000:0000:0000:0000:0000:0001",
      compressed: "2001:db8::1",
      prefix: 64,
      type: "global unicast",
    });
    expect(expandIPv6("::1").type).toBe("loopback");
    expect(expandIPv6("fe80::1").type).toBe("link-local");
    expect(expandIPv6("::ffff:192.0.2.128/128")).toMatchObject({
      compressed: "::ffff:c000:280",
      prefix: 128,
    });
    expect(expandIPv6("::").compressed).toBe("::");
  });
  it("rejects invalid input", () => {
    expect(() => calculateIPv4("999.1.1.1/24")).toThrow();
    expect(() => calculateIPv4("1.1.1.1/33")).toThrow();
    expect(() => expandIPv6("1::2::3")).toThrow();
    expect(() => expandIPv6("gggg::1")).toThrow();
    expect(() => expandIPv6("::1/129")).toThrow();
  });
});
