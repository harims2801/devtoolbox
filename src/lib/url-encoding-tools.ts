export type UrlEncodingScope = "component" | "full-url";
export type UrlEncodingOperation = "encode" | "decode";

export interface UrlEncodingResult {
  output: string;
  warning?: string;
}

export class UrlEncodingError extends Error {
  constructor(
    message: string,
    readonly index?: number,
  ) {
    super(message);
    this.name = "UrlEncodingError";
  }
}

function malformedPercentIndex(input: string) {
  for (let index = 0; index < input.length; index += 1) {
    if (
      input[index] === "%" &&
      !/^[0-9a-f]{2}$/i.test(input.slice(index + 1, index + 3))
    ) {
      return index;
    }
  }
  return -1;
}

function invalidUtf8PercentIndex(input: string) {
  const runPattern = /(?:%[0-9a-f]{2})+/gi;
  for (const match of input.matchAll(runPattern)) {
    const bytes =
      match[0]
        .match(/%[0-9a-f]{2}/gi)
        ?.map((value) => Number.parseInt(value.slice(1), 16)) ?? [];
    let offset = 0;
    while (offset < bytes.length) {
      const first = bytes[offset]!;
      let continuationCount = 0;
      let secondMinimum = 0x80;
      let secondMaximum = 0xbf;
      if (first <= 0x7f) {
        offset += 1;
        continue;
      } else if (first >= 0xc2 && first <= 0xdf) {
        continuationCount = 1;
      } else if (first >= 0xe0 && first <= 0xef) {
        continuationCount = 2;
        if (first === 0xe0) secondMinimum = 0xa0;
        if (first === 0xed) secondMaximum = 0x9f;
      } else if (first >= 0xf0 && first <= 0xf4) {
        continuationCount = 3;
        if (first === 0xf0) secondMinimum = 0x90;
        if (first === 0xf4) secondMaximum = 0x8f;
      } else {
        return (match.index ?? 0) + offset * 3;
      }

      const second = bytes[offset + 1];
      if (
        second === undefined ||
        second < secondMinimum ||
        second > secondMaximum
      ) {
        return (match.index ?? 0) + offset * 3;
      }
      for (
        let continuation = 2;
        continuation <= continuationCount;
        continuation += 1
      ) {
        const byte = bytes[offset + continuation];
        if (byte === undefined || byte < 0x80 || byte > 0xbf) {
          return (match.index ?? 0) + offset * 3;
        }
      }
      offset += continuationCount + 1;
    }
  }
  return Math.max(input.indexOf("%"), 0);
}

export function validatePercentSequences(input: string) {
  const index = malformedPercentIndex(input);
  if (index >= 0) {
    const found = input.slice(index, index + 3) || "%";
    throw new UrlEncodingError(
      `Malformed percent sequence "${found}" at character ${index + 1}. Expected % followed by two hexadecimal digits.`,
      index,
    );
  }
}

function decode(input: string, scope: UrlEncodingScope) {
  validatePercentSequences(input);
  try {
    return scope === "component" ? decodeURIComponent(input) : decodeURI(input);
  } catch {
    const index = invalidUtf8PercentIndex(input);
    throw new UrlEncodingError(
      `Invalid UTF-8 percent-encoded bytes near character ${index + 1}. The input was not changed.`,
      index,
    );
  }
}

export function processUrlEncoding(
  input: string,
  operation: UrlEncodingOperation,
  scope: UrlEncodingScope,
): UrlEncodingResult {
  if (!input) return { output: "" };

  if (operation === "encode") {
    const output =
      scope === "component" ? encodeURIComponent(input) : encodeURI(input);
    const warning = /%[0-9a-f]{2}/i.test(input)
      ? "Input already contains percent escapes. Encoding again also encodes each % as %25."
      : undefined;
    return { output, warning };
  }

  const output = decode(input, scope);
  const warning = /%[0-9a-f]{2}/i.test(output)
    ? "The result still contains percent escapes and may have been encoded more than once."
    : undefined;
  return { output, warning };
}
