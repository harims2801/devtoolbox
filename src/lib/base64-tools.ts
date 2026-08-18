export type Base64Variant = "standard" | "url-safe";

export const BASE64_MAX_FILE_BYTES = 5_000_000;
export const BASE64_WARNING_FILE_BYTES = 1_000_000;
export const SAFE_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export interface Base64Options {
  variant?: Base64Variant;
  padding?: boolean;
}

export interface ParsedDataUrl {
  mimeType: string;
  base64: string;
}

function binaryStringFromBytes(bytes: Uint8Array) {
  const chunkSize = 32_768;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return binary;
}

export function bytesToBase64(
  bytes: Uint8Array,
  { variant = "standard", padding = true }: Base64Options = {},
) {
  let encoded = btoa(binaryStringFromBytes(bytes));
  if (variant === "url-safe") {
    encoded = encoded.replaceAll("+", "-").replaceAll("/", "_");
  }
  return padding ? encoded : encoded.replace(/=+$/, "");
}

export function encodeUtf8ToBase64(value: string, options: Base64Options = {}) {
  return bytesToBase64(new TextEncoder().encode(value), options);
}

function normalizeBase64(value: string, variant: Base64Variant) {
  const compact = value.replace(/\s/g, "");
  const pattern =
    variant === "url-safe"
      ? /^[A-Za-z0-9_-]*={0,2}$/
      : /^[A-Za-z0-9+/]*={0,2}$/;

  if (!pattern.test(compact) || /=/.test(compact.slice(0, -2))) {
    throw new Error(
      variant === "url-safe"
        ? "Input contains characters that are not valid Base64URL."
        : "Input contains characters that are not valid standard Base64.",
    );
  }

  const withoutPadding = compact.replace(/=+$/, "");
  const remainder = withoutPadding.length % 4;
  const paddingLength = compact.length - withoutPadding.length;
  const expectedPadding = remainder === 0 ? 0 : 4 - remainder;

  if (
    remainder === 1 ||
    (paddingLength > 0 &&
      (compact.length % 4 !== 0 || paddingLength !== expectedPadding))
  ) {
    throw new Error("Base64 input has invalid length or padding.");
  }

  const standard =
    variant === "url-safe"
      ? withoutPadding.replaceAll("-", "+").replaceAll("_", "/")
      : withoutPadding;
  return standard.padEnd(Math.ceil(standard.length / 4) * 4, "=");
}

export function base64ToBytes(
  value: string,
  variant: Base64Variant = "standard",
) {
  const normalized = normalizeBase64(value, variant);
  try {
    const binary = atob(normalized);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new Error("Input is not valid Base64.");
  }
}

export function decodeBase64ToUtf8(
  value: string,
  variant: Base64Variant = "standard",
) {
  const bytes = base64ToBytes(value, variant);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Decoded bytes are not valid UTF-8 text.");
  }
}

export function createDataUrl(mimeType: string, base64: string) {
  if (!/^[\w.+-]+\/[\w.+-]+$/.test(mimeType)) {
    throw new Error("The MIME type is invalid.");
  }
  return `data:${mimeType};base64,${base64}`;
}

export function parseDataUrl(value: string): ParsedDataUrl {
  const match = value.match(
    /^data:([\w.+-]+\/[\w.+-]+)(?:;charset=[\w.+-]+)?;base64,([A-Za-z0-9+/_=-]*)$/,
  );
  if (!match) {
    throw new Error("Malformed or unsupported Base64 data URL.");
  }

  return { mimeType: match[1]!, base64: match[2]! };
}

export function decodeDataUrl(value: string) {
  const parsed = parseDataUrl(value);
  const variant: Base64Variant = /[-_]/.test(parsed.base64)
    ? "url-safe"
    : "standard";
  return {
    ...parsed,
    bytes: base64ToBytes(parsed.base64, variant),
  };
}

export function getEncodedByteSize(base64: string) {
  return new TextEncoder().encode(base64).byteLength;
}

export function getBase64FileSizeState(bytes: number) {
  if (bytes > BASE64_MAX_FILE_BYTES) {
    return {
      level: "error" as const,
      message: "File exceeds the 5 MB processing limit.",
    };
  }
  if (bytes > BASE64_WARNING_FILE_BYTES) {
    return {
      level: "warning" as const,
      message: "Large files can temporarily slow this browser tab.",
    };
  }
  return { level: "ok" as const, message: undefined };
}
