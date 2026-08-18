export interface CertificateResult {
  hostname: string;
  port: number;
  commonName: string;
  subjectAlternativeNames: string[];
  issuer: string;
  validFrom: string;
  validUntil: string;
  remainingDays: number;
  expired: boolean;
  expiringSoon: boolean;
  serialNumber?: string;
  signatureAlgorithm?: string;
  protocol?: string;
  chain: { commonName: string; issuer: string; validUntil: string }[];
  hostnameMatch: boolean;
  checkedAt: string;
}

const HOST =
  /^(?=.{1,253}$)(?!-)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z](?:[a-z\d-]{0,61}[a-z\d])?$/i;

export function validateCertificateHostname(value: string) {
  const hostname = value.trim().toLowerCase().replace(/\.$/, "");
  if (!HOST.test(hostname))
    throw new Error(
      "Enter a valid public hostname without a URL, path, credentials, query, or fragment.",
    );
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  )
    throw new Error("Local and internal hostnames are not allowed.");
  return hostname;
}
