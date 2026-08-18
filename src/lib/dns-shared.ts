export const DNS_RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SOA",
  "CAA",
  "PTR",
] as const;

export type DnsRecordType = (typeof DNS_RECORD_TYPES)[number];

export interface DnsRecord {
  type: DnsRecordType;
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
}

export interface DnsLookupResponse {
  query: string;
  normalizedName: string;
  records: DnsRecord[];
  resolver: {
    kind: "recursive";
    name: string;
    authoritative: false;
  };
  cached: boolean;
  queriedAt: string;
}
