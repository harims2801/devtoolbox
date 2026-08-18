export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
export interface HashResult {
  algorithm: HashAlgorithm;
  hexLower: string;
  hexUpper: string;
  base64: string;
}

export async function hashBytes(
  bytes: BufferSource,
  algorithm: HashAlgorithm,
): Promise<HashResult> {
  const digest = await crypto.subtle.digest(algorithm, bytes);
  const data = new Uint8Array(digest);
  const hexLower = Array.from(data, (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return {
    algorithm,
    hexLower,
    hexUpper: hexLower.toUpperCase(),
    base64: btoa(binary),
  };
}
export function hashText(text: string, algorithm: HashAlgorithm) {
  return hashBytes(new TextEncoder().encode(text), algorithm);
}
export function normalizeExpectedHash(value: string) {
  return value.trim().replace(/^0x/i, "").replace(/\s+/g, "");
}
export function compareHash(result: HashResult, expected: string) {
  const normalized = normalizeExpectedHash(expected);
  if (!normalized) return undefined;
  if (/^[0-9a-f]+$/i.test(normalized)) {
    if (normalized.length !== result.hexLower.length)
      throw new Error(
        `Expected hexadecimal hash must contain ${result.hexLower.length} characters.`,
      );
    return normalized.toLowerCase() === result.hexLower;
  }
  try {
    return atob(normalized) === atob(result.base64);
  } catch {
    throw new Error("Expected hash must be valid hexadecimal or Base64.");
  }
}
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
