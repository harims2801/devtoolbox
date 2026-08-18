import { decodeBase64ToUtf8, encodeUtf8ToBase64 } from "@/lib/base64-tools";
import type { JsonValue } from "@/lib/json-tools";

export type JwtObject = Record<string, JsonValue>;
export type JwtStatus = "active" | "expired" | "not-active-yet";

export interface JwtInspection {
  header: JwtObject;
  payload: JwtObject;
  signature: string;
  algorithm?: string;
  tokenType?: string;
  status: JwtStatus;
  remainingSeconds?: number;
}

export type JwtInspectionResult =
  { ok: true; value: JwtInspection } | { ok: false; error: string };

function isJwtObject(value: unknown): value is JwtObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseSegment(segment: string, label: string): JwtObject {
  let decoded: string;
  try {
    decoded = decodeBase64ToUtf8(segment, "url-safe");
  } catch (error) {
    throw new Error(
      `${label} is not valid Base64URL: ${
        error instanceof Error ? error.message : "decode failed"
      }`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new Error(`${label} does not contain valid JSON.`);
  }
  if (!isJwtObject(parsed)) {
    throw new Error(`${label} must decode to a JSON object.`);
  }
  return parsed;
}

function numericDate(value: JsonValue | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function inspectJwt(
  token: string,
  nowSeconds = Date.now() / 1000,
): JwtInspectionResult {
  const compact = token.trim();
  const segments = compact.split(".");
  if (segments.length !== 3 || segments.some((segment) => !segment)) {
    return {
      ok: false,
      error: "A JWT must contain three non-empty segments separated by dots.",
    };
  }

  try {
    const header = parseSegment(segments[0]!, "Header");
    const payload = parseSegment(segments[1]!, "Payload");
    const expiration = numericDate(payload.exp);
    const notBefore = numericDate(payload.nbf);
    const status: JwtStatus =
      notBefore !== undefined && nowSeconds < notBefore
        ? "not-active-yet"
        : expiration !== undefined && nowSeconds >= expiration
          ? "expired"
          : "active";

    return {
      ok: true,
      value: {
        header,
        payload,
        signature: segments[2]!,
        algorithm: typeof header.alg === "string" ? header.alg : undefined,
        tokenType: typeof header.typ === "string" ? header.typ : undefined,
        status,
        remainingSeconds:
          expiration === undefined ? undefined : expiration - nowSeconds,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "The JWT could not be decoded.",
    };
  }
}

export function encodeJwtSegment(value: JwtObject) {
  return encodeUtf8ToBase64(JSON.stringify(value), {
    variant: "url-safe",
    padding: false,
  });
}

export function createExampleJwt(nowSeconds = Math.floor(Date.now() / 1000)) {
  const header = encodeJwtSegment({ alg: "HS256", typ: "JWT" });
  const payload = encodeJwtSegment({
    iss: "devtoolbox.example",
    sub: "safe-demo-user",
    aud: ["developer-tools"],
    iat: nowSeconds,
    nbf: nowSeconds - 60,
    exp: nowSeconds + 3600,
    jti: "demo-token-001",
    name: "வணக்கம் 👋",
  });
  return `${header}.${payload}.demo-signature-not-verified`;
}

export function formatJwtTimestamp(value: JsonValue | undefined) {
  const seconds = numericDate(value);
  if (seconds === undefined) return undefined;
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) return undefined;
  return {
    local: date.toLocaleString(),
    utc: date.toUTCString(),
    iso: date.toISOString(),
  };
}

export function formatRemainingLifetime(seconds: number | undefined) {
  if (seconds === undefined) return "No expiration claim";
  const absolute = Math.abs(Math.trunc(seconds));
  const days = Math.floor(absolute / 86_400);
  const hours = Math.floor((absolute % 86_400) / 3_600);
  const minutes = Math.floor((absolute % 3_600) / 60);
  const parts = [
    days ? `${days}d` : "",
    hours ? `${hours}h` : "",
    `${minutes}m`,
  ].filter(Boolean);
  return seconds < 0 ? `Expired ${parts.join(" ")} ago` : parts.join(" ");
}
