import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { LookupFunction } from "node:net";
import type {
  CookieMetadata,
  HeaderEntry,
  HeaderRequestMethod,
  HttpHeaderReport,
  SecurityHeaderFinding,
} from "@/lib/http-header-shared";
import {
  type HostLookup,
  SafeNetworkError,
  defaultHostLookup,
  resolvePublicHostname,
  withTimeout,
} from "@/lib/server/network-security";

const MAX_REDIRECTS = 5,
  MAX_HEADER_BYTES = 32 * 1024,
  REQUEST_TIMEOUT_MS = 5_000,
  USER_AGENT = "DevToolbox-Header-Analyzer/1.0";

export interface RawHeaderResponse {
  status: number;
  statusText: string;
  headers: Array<[string, string]>;
}

export type HeaderTransport = (
  url: URL,
  address: string,
  family: number,
  method: HeaderRequestMethod,
) => Promise<RawHeaderResponse>;

export function parsePublicHttpUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new SafeNetworkError("INVALID_INPUT", "Enter a valid public URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new SafeNetworkError(
      "BLOCKED_TARGET",
      "Only public HTTP and HTTPS URLs are allowed.",
    );
  if (url.username || url.password)
    throw new SafeNetworkError(
      "BLOCKED_TARGET",
      "URLs containing credentials are not allowed.",
    );
  const expectedPort = url.protocol === "https:" ? "443" : "80";
  if (url.port && url.port !== expectedPort)
    throw new SafeNetworkError(
      "BLOCKED_TARGET",
      "Only standard HTTP and HTTPS ports are allowed.",
    );
  url.hash = "";
  return url;
}

export const nodeHeaderTransport: HeaderTransport = (
  url,
  address,
  family,
  method,
) =>
  new Promise((resolve, reject) => {
    const pinnedLookup = ((
      _hostname: string,
      options: { all?: boolean },
      callback: (...args: unknown[]) => void,
    ) => {
      if (options?.all) callback(null, [{ address, family }]);
      else callback(null, address, family);
    }) as LookupFunction;
    const send = url.protocol === "https:" ? httpsRequest : httpRequest,
      request = send(
        url,
        {
          method,
          headers: { Accept: "*/*", "User-Agent": USER_AGENT },
          lookup: pinnedLookup,
          maxHeaderSize: MAX_HEADER_BYTES,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
        (response) => {
          const headers: Array<[string, string]> = [];
          for (let index = 0; index < response.rawHeaders.length; index += 2)
            headers.push([
              response.rawHeaders[index] ?? "",
              response.rawHeaders[index + 1] ?? "",
            ]);
          response.destroy();
          resolve({
            status: response.statusCode ?? 0,
            statusText: response.statusMessage ?? "",
            headers,
          });
        },
      );
    request.on("error", reject);
    request.end();
  });

function headerValues(headers: Array<[string, string]>, name: string) {
  return headers
    .filter(([key]) => key.toLowerCase() === name)
    .map(([, value]) => value);
}

function normalizeHeaders(headers: Array<[string, string]>): HeaderEntry[] {
  const grouped = new Map<string, string[]>(),
    sensitive = new Set([
      "set-cookie",
      "authorization",
      "proxy-authorization",
      "authentication-info",
      "proxy-authentication-info",
    ]);
  for (const [rawName, rawValue] of headers) {
    const name = rawName.trim().toLowerCase();
    if (!name || sensitive.has(name)) continue;
    const value = rawValue.replace(/[\r\n]+/g, " ").trim();
    grouped.set(name, [...(grouped.get(name) ?? []), value]);
  }
  return [...grouped]
    .map(([name, values]) => ({ name, value: values.join(", ") }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function parseCookies(values: string[]): CookieMetadata[] {
  return values.slice(0, 50).map((value) => {
    const parts = value.split(";").map((part) => part.trim()),
      name = (parts[0]?.split("=", 1)[0] || "unnamed").slice(0, 128),
      attributes = parts.slice(1).map((part) => part.toLowerCase()),
      sameSiteValue = attributes
        .find((part) => part.startsWith("samesite="))
        ?.slice(9);
    const sameSite =
      sameSiteValue === "strict"
        ? "Strict"
        : sameSiteValue === "lax"
          ? "Lax"
          : sameSiteValue === "none"
            ? "None"
            : undefined;
    return {
      name,
      secure: attributes.includes("secure"),
      httpOnly: attributes.includes("httponly"),
      sameSite,
      hasDomain: attributes.some((part) => part.startsWith("domain=")),
      hasPath: attributes.some((part) => part.startsWith("path=")),
      persistent: attributes.some(
        (part) => part.startsWith("expires=") || part.startsWith("max-age="),
      ),
    };
  });
}

function parseCacheDirectives(value?: string) {
  const directives: Record<string, string | true> = {};
  for (const item of value?.split(",") ?? []) {
    const [rawName, ...rest] = item.trim().split("="),
      name = rawName?.toLowerCase();
    if (!name) continue;
    directives[name] = rest.length
      ? rest.join("=").replace(/^"|"$/g, "")
      : true;
  }
  return directives;
}

function securityFindings(headers: HeaderEntry[]): SecurityHeaderFinding[] {
  const map = new Map(headers.map(({ name, value }) => [name, value])),
    checks: Array<[string, boolean, string, string]> = [
      [
        "content-security-policy",
        map.has("content-security-policy"),
        "Content Security Policy is present.",
        "Add a Content Security Policy to constrain loaded resources.",
      ],
      [
        "strict-transport-security",
        map.has("strict-transport-security"),
        "HSTS is present.",
        "Add HSTS on HTTPS responses to enforce secure transport.",
      ],
      [
        "x-content-type-options",
        map.get("x-content-type-options")?.toLowerCase() === "nosniff",
        "MIME sniffing protection is enabled.",
        "Set X-Content-Type-Options to nosniff.",
      ],
      [
        "referrer-policy",
        map.has("referrer-policy"),
        "A referrer policy is present.",
        "Add Referrer-Policy to control referrer disclosure.",
      ],
      [
        "permissions-policy",
        map.has("permissions-policy"),
        "A permissions policy is present.",
        "Add Permissions-Policy for browser capabilities.",
      ],
      [
        "frame-protection",
        map.has("x-frame-options") ||
          /(?:^|;)\s*frame-ancestors\b/i.test(
            map.get("content-security-policy") ?? "",
          ),
        "Frame embedding is constrained.",
        "Add frame-ancestors to CSP or X-Frame-Options.",
      ],
    ];
  return checks.map(([header, passed, success, warning]) => ({
    header,
    status: passed ? "pass" : "warning",
    message: passed ? success : warning,
  }));
}

function validateHeaderSize(headers: Array<[string, string]>) {
  const bytes = headers.reduce(
    (total, [name, value]) =>
      total + Buffer.byteLength(name) + Buffer.byteLength(value) + 4,
    0,
  );
  if (bytes > MAX_HEADER_BYTES)
    throw new SafeNetworkError(
      "TOO_LARGE",
      "The response headers are too large to analyze safely.",
      502,
    );
}

export class HttpHeaderAnalyzer {
  constructor(
    private readonly lookup: HostLookup = defaultHostLookup,
    private readonly transport: HeaderTransport = nodeHeaderTransport,
    private readonly timeoutMilliseconds = REQUEST_TIMEOUT_MS,
  ) {}

  async analyze(
    input: string,
    method: HeaderRequestMethod = "HEAD",
  ): Promise<HttpHeaderReport> {
    const requested = parsePublicHttpUrl(input);
    let current = requested,
      finalResponse: RawHeaderResponse | undefined;
    const redirects: HttpHeaderReport["redirects"] = [];
    try {
      for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const resolved = await resolvePublicHostname(
            current.hostname,
            this.lookup,
          ),
          selected = resolved.addresses[0]!;
        finalResponse = await withTimeout(
          this.transport(current, selected.address, selected.family, method),
          this.timeoutMilliseconds,
          "The HTTP request timed out.",
        );
        validateHeaderSize(finalResponse.headers);
        const location = headerValues(finalResponse.headers, "location")[0];
        if (
          !location ||
          ![301, 302, 303, 307, 308].includes(finalResponse.status)
        )
          break;
        if (hop === MAX_REDIRECTS)
          throw new SafeNetworkError(
            "TOO_LARGE",
            "The response exceeded the redirect limit.",
            502,
          );
        const next = parsePublicHttpUrl(new URL(location, current).href);
        redirects.push({
          url: current.href,
          status: finalResponse.status,
          location: next.href,
        });
        current = next;
      }
    } catch (caught) {
      if (caught instanceof SafeNetworkError) throw caught;
      throw new SafeNetworkError(
        "UPSTREAM_FAILURE",
        "The public URL could not be analyzed safely.",
        502,
      );
    }
    if (!finalResponse)
      throw new SafeNetworkError(
        "UPSTREAM_FAILURE",
        "The public URL returned no usable response.",
        502,
      );
    const headers = normalizeHeaders(finalResponse.headers),
      map = new Map(headers.map(({ name, value }) => [name, value]));
    return {
      requestedUrl: requested.href,
      finalUrl: current.href,
      method,
      status: finalResponse.status,
      statusText: finalResponse.statusText,
      redirects,
      headers,
      cacheDirectives: parseCacheDirectives(map.get("cache-control")),
      contentType: map.get("content-type"),
      compression: map.get("content-encoding"),
      cookies: parseCookies(headerValues(finalResponse.headers, "set-cookie")),
      security: securityFindings(headers),
      analyzedAt: new Date().toISOString(),
    };
  }
}
