export type HeaderRequestMethod = "HEAD" | "GET";

export interface HeaderEntry {
  name: string;
  value: string;
}

export interface CookieMetadata {
  name: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  hasDomain: boolean;
  hasPath: boolean;
  persistent: boolean;
}

export interface SecurityHeaderFinding {
  header: string;
  status: "pass" | "warning";
  message: string;
}

export interface RedirectHop {
  url: string;
  status: number;
  location: string;
}

export interface HttpHeaderReport {
  requestedUrl: string;
  finalUrl: string;
  method: HeaderRequestMethod;
  status: number;
  statusText: string;
  redirects: RedirectHop[];
  headers: HeaderEntry[];
  cacheDirectives: Record<string, string | true>;
  contentType?: string;
  compression?: string;
  cookies: CookieMetadata[];
  security: SecurityHeaderFinding[];
  analyzedAt: string;
}
