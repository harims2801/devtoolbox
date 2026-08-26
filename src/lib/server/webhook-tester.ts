import { request as httpsRequest } from "node:https";
import type { LookupFunction } from "node:net";
import type {
  WebhookHeader,
  WebhookMethod,
  WebhookReport,
} from "@/lib/webhook-shared";
import {
  type HostLookup,
  SafeNetworkError,
  defaultHostLookup,
  resolvePublicHostname,
  withTimeout,
} from "@/lib/server/network-security";

const MAX_PAYLOAD_BYTES = 32 * 1024,
  MAX_RESPONSE_BYTES = 64 * 1024,
  MAX_PREVIEW_BYTES = 16 * 1024,
  MAX_HEADER_BYTES = 16 * 1024,
  MAX_REDIRECTS = 3,
  REQUEST_TIMEOUT_MS = 5_000,
  USER_AGENT = "DevToolbox-Webhook-Tester/1.0";

const allowedMethods = new Set<WebhookMethod>(["POST", "PUT", "PATCH"]),
  allowedExactHeaders = new Set([
    "accept",
    "idempotency-key",
    "traceparent",
    "tracestate",
    "baggage",
  ]),
  forbiddenHeaders = new Set([
    "authorization",
    "connection",
    "content-encoding",
    "content-length",
    "content-type",
    "cookie",
    "expect",
    "forwarded",
    "host",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "set-cookie",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "via",
    "x-http-method-override",
    "x-original-url",
    "x-real-ip",
    "x-rewrite-url",
  ]),
  proxyControlName =
    /(?:^|-)(?:forwarded|proxy|host|url|uri|method|scheme|proto|client-ip|real-ip|remote-addr)(?:-|$)/;

export interface RawWebhookResponse {
  status: number;
  statusText: string;
  headers: Array<[string, string]>;
  body: Uint8Array;
  bytesRead: number;
  truncated: boolean;
}

export type WebhookTransport = (
  url: URL,
  address: string,
  family: number,
  method: WebhookMethod,
  headers: WebhookHeader[],
  payload: string,
) => Promise<RawWebhookResponse>;

export function parsePublicWebhookUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new SafeNetworkError(
      "INVALID_INPUT",
      "Enter a valid public HTTPS endpoint.",
    );
  }
  if (url.protocol !== "https:")
    throw new SafeNetworkError(
      "BLOCKED_TARGET",
      "Webhook endpoints must use HTTPS.",
    );
  if (url.username || url.password)
    throw new SafeNetworkError(
      "BLOCKED_TARGET",
      "Webhook endpoint credentials are not allowed.",
    );
  if (url.hash)
    throw new SafeNetworkError(
      "BLOCKED_TARGET",
      "Webhook endpoint fragments are not allowed.",
    );
  if (url.port && url.port !== "443")
    throw new SafeNetworkError(
      "BLOCKED_TARGET",
      "Only the standard HTTPS port is allowed.",
    );
  return url;
}

export function validateWebhookHeaders(headers: WebhookHeader[]) {
  if (headers.length > 20)
    throw new SafeNetworkError(
      "TOO_LARGE",
      "Use no more than 20 custom headers.",
    );
  const seen = new Set<string>();
  return headers.map(({ name: rawName, value: rawValue }) => {
    const name = rawName.trim().toLowerCase(),
      value = rawValue.trim();
    if (!/^[a-z0-9!#$%&'*+.^_`|~-]+$/.test(name))
      throw new SafeNetworkError(
        "INVALID_INPUT",
        "A custom header name is invalid.",
      );
    if (
      forbiddenHeaders.has(name) ||
      proxyControlName.test(name) ||
      name.startsWith("proxy-") ||
      name.startsWith("x-forwarded-") ||
      name.startsWith("sec-") ||
      (!name.startsWith("x-") && !allowedExactHeaders.has(name))
    )
      throw new SafeNetworkError(
        "BLOCKED_TARGET",
        `The ${name} header is not allowed.`,
      );
    if (seen.has(name))
      throw new SafeNetworkError(
        "INVALID_INPUT",
        `Duplicate ${name} headers are not allowed.`,
      );
    if (/\r|\n/.test(value) || value.length > 1_024)
      throw new SafeNetworkError(
        "INVALID_INPUT",
        `The ${name} header value is invalid or too long.`,
      );
    seen.add(name);
    return { name, value };
  });
}

export const nodeWebhookTransport: WebhookTransport = (
  url,
  address,
  family,
  method,
  headers,
  payload,
) =>
  new Promise((resolve, reject) => {
    const pinnedLookup = ((
        _hostname: string,
        options: { all?: boolean },
        callback: (...args: unknown[]) => void,
      ) => {
        if (options?.all) callback(null, [{ address, family }]);
        else callback(null, address, family);
      }) as LookupFunction,
      request = httpsRequest(
        url,
        {
          method,
          headers: {
            Accept: "application/json, text/plain;q=0.9, */*;q=0.1",
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": Buffer.byteLength(payload),
            "User-Agent": USER_AGENT,
            ...Object.fromEntries(
              headers.map((header) => [header.name, header.value]),
            ),
          },
          lookup: pinnedLookup,
          maxHeaderSize: MAX_HEADER_BYTES,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS + 500),
        },
        (response) => {
          const rawHeaders: Array<[string, string]> = [];
          for (let index = 0; index < response.rawHeaders.length; index += 2)
            rawHeaders.push([
              response.rawHeaders[index] ?? "",
              response.rawHeaders[index + 1] ?? "",
            ]);
          const chunks: Buffer[] = [];
          let bytesRead = 0,
            previewBytes = 0,
            truncated = false,
            settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            resolve({
              status: response.statusCode ?? 0,
              statusText: response.statusMessage ?? "",
              headers: rawHeaders,
              body: Buffer.concat(chunks),
              bytesRead,
              truncated,
            });
          };
          response.on("data", (chunk: Buffer) => {
            bytesRead += chunk.length;
            if (previewBytes < MAX_PREVIEW_BYTES) {
              const retained = chunk.subarray(
                0,
                Math.min(chunk.length, MAX_PREVIEW_BYTES - previewBytes),
              );
              chunks.push(retained);
              previewBytes += retained.length;
            }
            if (bytesRead > MAX_RESPONSE_BYTES) {
              truncated = true;
              response.destroy();
              finish();
            }
          });
          response.on("end", finish);
          response.on("error", (error) =>
            truncated ? finish() : reject(error),
          );
        },
      );
    request.on("error", reject);
    request.end(payload);
  });

function headerValues(headers: Array<[string, string]>, name: string) {
  return headers
    .filter(([key]) => key.toLowerCase() === name)
    .map(([, value]) => value);
}

function validateResponseHeaders(headers: Array<[string, string]>) {
  const bytes = headers.reduce(
    (total, [name, value]) =>
      total + Buffer.byteLength(name) + Buffer.byteLength(value) + 4,
    0,
  );
  if (bytes > MAX_HEADER_BYTES)
    throw new SafeNetworkError(
      "TOO_LARGE",
      "The webhook response headers are too large.",
      502,
    );
}

function selectedResponseHeaders(headers: Array<[string, string]>) {
  const allowed = new Set([
    "cache-control",
    "content-length",
    "content-type",
    "location",
    "retry-after",
    "traceparent",
    "x-correlation-id",
    "x-request-id",
  ]);
  return headers
    .filter(([name]) => allowed.has(name.toLowerCase()))
    .map(([name, value]) => ({
      name: name.toLowerCase(),
      value: value.replace(/[\r\n]+/g, " ").trim(),
    }));
}

function previewResponse(response: RawWebhookResponse) {
  const contentType = headerValues(
      response.headers,
      "content-type",
    )[0]?.toLowerCase(),
    textual =
      !contentType ||
      contentType.startsWith("text/") ||
      /(?:json|xml|javascript|x-www-form-urlencoded)/.test(contentType);
  if (!textual)
    return {
      kind: "omitted" as const,
      content: "Binary response preview omitted.",
      truncated: response.truncated,
      bytesRead: response.bytesRead,
    };
  const text = new TextDecoder("utf-8", { fatal: false }).decode(response.body);
  if (!response.truncated && /(?:^|[+/])json(?:;|$)/.test(contentType ?? "")) {
    try {
      return {
        kind: "json" as const,
        content: JSON.stringify(JSON.parse(text), null, 2),
        truncated: false,
        bytesRead: response.bytesRead,
      };
    } catch {
      // Invalid JSON is returned as inert text instead of being trusted.
    }
  }
  return {
    kind: "text" as const,
    content: text,
    truncated:
      response.truncated || response.bytesRead > response.body.byteLength,
    bytesRead: response.bytesRead,
  };
}

export class WebhookTester {
  constructor(
    private readonly lookup: HostLookup = defaultHostLookup,
    private readonly transport: WebhookTransport = nodeWebhookTransport,
    private readonly timeoutMilliseconds = REQUEST_TIMEOUT_MS,
    private readonly now: () => number = Date.now,
  ) {}

  async send(
    endpoint: string,
    method: WebhookMethod,
    payload: unknown,
    customHeaders: WebhookHeader[],
  ): Promise<WebhookReport> {
    if (!allowedMethods.has(method))
      throw new SafeNetworkError("INVALID_INPUT", "Use POST, PUT, or PATCH.");
    const serialized = JSON.stringify(payload);
    if (serialized === undefined)
      throw new SafeNetworkError(
        "INVALID_INPUT",
        "Enter a valid JSON payload.",
      );
    if (Buffer.byteLength(serialized) > MAX_PAYLOAD_BYTES)
      throw new SafeNetworkError(
        "TOO_LARGE",
        "The JSON payload exceeds the 32 KiB limit.",
        413,
      );
    const headers = validateWebhookHeaders(customHeaders),
      startedAt = this.now(),
      requested = parsePublicWebhookUrl(endpoint),
      redirects: WebhookReport["redirects"] = [];
    let current = requested,
      response: RawWebhookResponse | undefined;
    try {
      for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const resolved = await resolvePublicHostname(
            current.hostname,
            this.lookup,
          ),
          selected = resolved.addresses[0]!;
        response = await withTimeout(
          this.transport(
            current,
            selected.address,
            selected.family,
            method,
            headers,
            serialized,
          ),
          this.timeoutMilliseconds,
          "The webhook request timed out.",
        );
        validateResponseHeaders(response.headers);
        const location = headerValues(response.headers, "location")[0];
        if (!location || ![307, 308].includes(response.status)) break;
        if (hop === MAX_REDIRECTS)
          throw new SafeNetworkError(
            "TOO_LARGE",
            "The webhook exceeded the redirect limit.",
            502,
          );
        const next = parsePublicWebhookUrl(new URL(location, current).href);
        redirects.push({
          url: current.href,
          status: response.status,
          location: next.href,
        });
        current = next;
      }
    } catch (caught) {
      if (caught instanceof SafeNetworkError) throw caught;
      throw new SafeNetworkError(
        "UPSTREAM_FAILURE",
        "The webhook request could not be completed safely.",
        502,
      );
    }
    if (!response)
      throw new SafeNetworkError(
        "UPSTREAM_FAILURE",
        "The webhook returned no usable response.",
        502,
      );
    const responseHeaders = selectedResponseHeaders(response.headers),
      contentType = responseHeaders.find(
        (header) => header.name === "content-type",
      )?.value;
    return {
      endpoint: current.href,
      method,
      status: response.status,
      statusText: response.statusText,
      timingMilliseconds: Math.max(0, this.now() - startedAt),
      redirects,
      responseHeaders,
      contentType,
      preview: previewResponse(response),
    };
  }
}
