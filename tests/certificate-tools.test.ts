import { describe, expect, it, vi } from "vitest";
import {
  inspectCertificate,
  isBlockedAddress,
  validateCertificateHostname,
} from "@/lib/certificate-tools";
const cert = {
  subject: { CN: "example.com" },
  issuer: { CN: "Example CA" },
  subjectaltname: "DNS:example.com, DNS:www.example.com",
  valid_from: "Jan  1 00:00:00 2026 GMT",
  valid_to: "Jan  1 00:00:00 2027 GMT",
  serialNumber: "01",
  sigalg: "RSA-SHA256",
  fingerprint256: "AA",
};
const deps = (valid_to?: string) => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
  connect: vi.fn(async () => ({
    certificate: {
      ...cert,
      ...(valid_to ? { valid_to } : {}),
      issuerCertificate: undefined,
    },
    protocol: "TLSv1.3",
    remoteAddress: "93.184.216.34",
  })),
  now: () => new Date("2026-06-01T00:00:00Z"),
});
describe("certificate tools", () => {
  it("validates hostnames", () => {
    expect(validateCertificateHostname("Example.COM.")).toBe("example.com");
    for (const value of [
      "localhost",
      "https://example.com",
      "user@example.com",
      "example.com/path",
      "127.0.0.1",
    ])
      expect(() => validateCertificateHostname(value)).toThrow();
  });
  it("blocks SSRF address ranges", () => {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "192.168.1.1",
      "169.254.169.254",
      "::1",
      "fd00::1",
      "fe80::1",
    ])
      expect(isBlockedAddress(ip)).toBe(true);
    expect(isBlockedAddress("93.184.216.34")).toBe(false);
  });
  it("returns a valid certificate result", async () => {
    const result = await inspectCertificate(
      "example.com",
      443,
      deps() as never,
    );
    expect(result.hostnameMatch).toBe(true);
    expect(result.expired).toBe(false);
    expect(result.protocol).toBe("TLSv1.3");
  });
  it("detects expired certificates", async () =>
    expect(
      (
        await inspectCertificate(
          "example.com",
          443,
          deps("Jan  1 00:00:00 2026 GMT") as never,
        )
      ).expired,
    ).toBe(true));
  it("blocks private DNS and rebound connections", async () => {
    const privateDeps = deps();
    privateDeps.lookup = vi.fn(async () => [
      { address: "10.0.0.1", family: 4 },
    ]);
    await expect(
      inspectCertificate("example.com", 443, privateDeps as never),
    ).rejects.toThrow(/blocked/);
    await expect(
      inspectCertificate("example.com", 443, {
        ...deps(),
        connect: vi.fn(async () => ({
          certificate: cert,
          remoteAddress: "127.0.0.1",
        })),
      } as never),
    ).rejects.toThrow(/blocked/);
  });
  it("returns safe timeout errors", async () => {
    const timeout = deps();
    timeout.connect = vi.fn(async () => {
      throw new Error("ECONNREFUSED secret");
    });
    await expect(
      inspectCertificate("example.com", 443, timeout as never),
    ).rejects.toThrow("Could not complete the TLS check");
  });
});
