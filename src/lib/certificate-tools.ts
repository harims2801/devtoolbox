import dns from "node:dns/promises";
import net from "node:net";
import tls, { type DetailedPeerCertificate } from "node:tls";
import {
  validateCertificateHostname,
  type CertificateResult,
} from "@/lib/certificate-shared";
export { validateCertificateHostname } from "@/lib/certificate-shared";

export interface CertificateDependencies {
  lookup: (hostname: string) => Promise<{ address: string; family: number }[]>;
  connect: (options: tls.ConnectionOptions) => Promise<{
    certificate: DetailedPeerCertificate;
    protocol?: string;
    remoteAddress?: string;
  }>;
  now: () => Date;
}
function ipv4Number(address: string) {
  return address.split(".").reduce((n, part) => (n << 8n) + BigInt(part), 0n);
}
function ipv4Range(address: string, start: string, prefix: number) {
  const shift = BigInt(32 - prefix);
  return ipv4Number(address) >> shift === ipv4Number(start) >> shift;
}
export function isBlockedAddress(address: string) {
  const normalized = address.toLowerCase().split("%")[0]!;
  if (net.isIP(normalized) === 4)
    return [
      ["0.0.0.0", 8],
      ["10.0.0.0", 8],
      ["100.64.0.0", 10],
      ["127.0.0.0", 8],
      ["169.254.0.0", 16],
      ["172.16.0.0", 12],
      ["192.0.0.0", 24],
      ["192.0.2.0", 24],
      ["192.168.0.0", 16],
      ["198.18.0.0", 15],
      ["198.51.100.0", 24],
      ["203.0.113.0", 24],
      ["224.0.0.0", 4],
      ["240.0.0.0", 4],
    ].some(([start, prefix]) =>
      ipv4Range(normalized, start as string, prefix as number),
    );
  if (net.isIP(normalized) === 6)
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("ff") ||
      normalized.startsWith("2001:db8:") ||
      normalized.startsWith("::ffff:")
    );
  return true;
}
export async function resolveSafeAddresses(
  hostname: string,
  lookup: CertificateDependencies["lookup"],
) {
  const addresses = await lookup(hostname);
  if (!addresses.length || addresses.some((x) => isBlockedAddress(x.address)))
    throw new Error(
      "This hostname resolves to a blocked or non-public address.",
    );
  return addresses;
}
function defaultConnect(options: tls.ConnectionOptions) {
  return new Promise<{
    certificate: DetailedPeerCertificate;
    protocol?: string;
    remoteAddress?: string;
  }>((resolve, reject) => {
    const socket = tls.connect(options, () => {
      const certificate = socket.getPeerCertificate(true);
      resolve({
        certificate,
        protocol: socket.getProtocol() ?? undefined,
        remoteAddress: socket.remoteAddress,
      });
      socket.end();
    });
    socket.setTimeout(5000, () => socket.destroy(new Error("timeout")));
    socket.once("error", reject);
  });
}
const defaults: CertificateDependencies = {
  lookup: (hostname) => dns.lookup(hostname, { all: true, verbatim: true }),
  connect: defaultConnect,
  now: () => new Date(),
};
function chainOf(cert: DetailedPeerCertificate) {
  const result: CertificateResult["chain"] = [],
    seen = new Set<string>();
  let current: DetailedPeerCertificate | undefined = cert;
  while (current && result.length < 8 && !seen.has(current.fingerprint256)) {
    seen.add(current.fingerprint256);
    result.push({
      commonName: firstValue(current.subject?.CN),
      issuer: firstValue(current.issuer?.CN),
      validUntil: current.valid_to,
    });
    if (current.issuerCertificate === current) break;
    current = current.issuerCertificate;
  }
  return result;
}
function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "Unknown") : (value ?? "Unknown");
}
export async function inspectCertificate(
  hostValue: string,
  port = 443,
  deps: CertificateDependencies = defaults,
): Promise<CertificateResult> {
  const hostname = validateCertificateHostname(hostValue);
  if (port !== 443) throw new Error("Only TLS port 443 is currently allowed.");
  const addresses = await resolveSafeAddresses(hostname, deps.lookup);
  const selected = addresses[0]!;
  let connection;
  try {
    connection = await deps.connect({
      host: selected.address,
      port,
      servername: hostname,
      rejectUnauthorized: false,
      timeout: 5000,
    });
  } catch {
    throw new Error(
      "Could not complete the TLS check. Verify the hostname and try again.",
    );
  }
  if (!connection.remoteAddress || isBlockedAddress(connection.remoteAddress))
    throw new Error("The connection resolved to a blocked address.");
  const certificate = connection.certificate;
  if (!certificate?.valid_to)
    throw new Error("The server did not provide a readable certificate.");
  const now = deps.now(),
    until = new Date(certificate.valid_to),
    remainingDays = Math.ceil((until.getTime() - now.getTime()) / 86400000);
  return {
    hostname,
    port,
    commonName: firstValue(certificate.subject?.CN),
    subjectAlternativeNames: (certificate.subjectaltname ?? "")
      .split(/,\s*/)
      .filter(Boolean)
      .map((x) => x.replace(/^DNS:/, "")),
    issuer: firstValue(certificate.issuer?.CN),
    validFrom: new Date(certificate.valid_from).toISOString(),
    validUntil: until.toISOString(),
    remainingDays,
    expired: remainingDays < 0,
    expiringSoon: remainingDays >= 0 && remainingDays <= 30,
    serialNumber: certificate.serialNumber,
    signatureAlgorithm: (
      certificate as DetailedPeerCertificate & { sigalg?: string }
    ).sigalg,
    protocol: connection.protocol,
    chain: chainOf(certificate),
    hostnameMatch: !tls.checkServerIdentity(hostname, certificate),
    checkedAt: now.toISOString(),
  };
}
