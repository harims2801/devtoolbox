export type SpaceEncoding = "percent" | "plus";

export interface QueryPair {
  key: string;
  value: string | null;
  included: boolean;
}

export const MAX_QUERY_LENGTH = 32_768;
export const MAX_QUERY_ROWS = 500;

function decodePart(value: string, mode: SpaceEncoding, pairIndex: number) {
  try {
    return decodeURIComponent(
      mode === "plus" ? value.replace(/\+/g, " ") : value,
    );
  } catch {
    throw new Error(
      `Pair ${pairIndex + 1} contains malformed percent encoding.`,
    );
  }
}

export function encodeQueryPart(value: string, mode: SpaceEncoding) {
  const encoded = encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return mode === "plus" ? encoded.replace(/%20/g, "+") : encoded;
}

export function parseQueryString(
  input: string,
  mode: SpaceEncoding,
): QueryPair[] {
  const query = input.startsWith("?") ? input.slice(1) : input;
  if (query.length > MAX_QUERY_LENGTH)
    throw new Error("The query string is too long to edit safely.");
  if (!query) return [];
  const segments = query.split("&");
  if (segments.length > MAX_QUERY_ROWS)
    throw new Error(`Query strings are limited to ${MAX_QUERY_ROWS} rows.`);
  return segments.map((segment, index) => {
    const equals = segment.indexOf("="),
      rawKey = equals < 0 ? segment : segment.slice(0, equals),
      rawValue = equals < 0 ? null : segment.slice(equals + 1);
    return {
      key: decodePart(rawKey, mode, index),
      value: rawValue === null ? null : decodePart(rawValue, mode, index),
      included: true,
    };
  });
}

export function buildQueryString(pairs: QueryPair[], mode: SpaceEncoding) {
  if (pairs.length > MAX_QUERY_ROWS)
    throw new Error(`Query strings are limited to ${MAX_QUERY_ROWS} rows.`);
  const query = pairs
    .filter((pair) => pair.included)
    .map((pair) => {
      const key = encodeQueryPart(pair.key, mode);
      return pair.value === null
        ? key
        : `${key}=${encodeQueryPart(pair.value, mode)}`;
    })
    .join("&");
  if (query.length > MAX_QUERY_LENGTH)
    throw new Error("The generated query string is too long.");
  return query;
}

export function pairsToBulkJson(pairs: QueryPair[]) {
  return JSON.stringify(
    pairs.map((pair) => [pair.key, pair.value]),
    null,
    2,
  );
}

export function pairsFromBulkJson(input: string): QueryPair[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("Bulk JSON must be valid JSON.");
  }
  if (!Array.isArray(parsed))
    throw new Error("Bulk JSON must be an array of [key, value] pairs.");
  if (parsed.length > MAX_QUERY_ROWS)
    throw new Error(`Bulk JSON is limited to ${MAX_QUERY_ROWS} pairs.`);
  return parsed.map((pair, index) => {
    if (
      !Array.isArray(pair) ||
      pair.length !== 2 ||
      typeof pair[0] !== "string" ||
      (typeof pair[1] !== "string" && pair[1] !== null)
    )
      throw new Error(
        `Bulk JSON pair ${index + 1} must be [string, string | null].`,
      );
    return { key: pair[0], value: pair[1], included: true };
  });
}

export function buildFullUrl(baseInput: string, query: string) {
  if (!baseInput.trim()) return "";
  let url: URL;
  try {
    url = new URL(baseInput.trim());
  } catch {
    throw new Error("Enter a valid absolute base URL for Copy full URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new Error("The full URL base must use HTTP or HTTPS.");
  if (url.username || url.password)
    throw new Error("The full URL base cannot contain credentials.");
  url.search = query ? `?${query}` : "";
  return url.href;
}
