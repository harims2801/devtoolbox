export const MAX_URL_INPUT_LENGTH = 8_192;

export type UrlReferenceKind =
  | "absolute"
  | "protocol-relative"
  | "root-relative"
  | "path-relative"
  | "query-relative"
  | "fragment-relative";

export interface UrlParserReport {
  reference: { kind: UrlReferenceKind; relative: boolean; base?: string };
  canonicalUrl: string;
  scheme: string;
  credentials: { usernamePresent: boolean; passwordPresent: boolean };
  host: string;
  hostname: {
    ascii: string;
    unicode: string;
    punycode: boolean;
    mixedScript: boolean;
  };
  port: string;
  origin: string;
  pathname: string;
  pathSegments: Array<{ raw: string; decoded: string }>;
  query: { raw: string; pairs: Array<{ key: string; value: string }> };
  fragment: { raw: string; decoded: string };
  risks: Array<{ code: string; message: string }>;
}

function decodeDigit(codePoint: number) {
  if (codePoint >= 48 && codePoint <= 57) return codePoint - 22;
  if (codePoint >= 65 && codePoint <= 90) return codePoint - 65;
  if (codePoint >= 97 && codePoint <= 122) return codePoint - 97;
  throw new Error("Invalid punycode label.");
}

function adaptBias(delta: number, points: number, firstTime: boolean) {
  delta = firstTime ? Math.floor(delta / 700) : Math.floor(delta / 2);
  delta += Math.floor(delta / points);
  let offset = 0;
  while (delta > 455) {
    delta = Math.floor(delta / 35);
    offset += 36;
  }
  return offset + Math.floor((36 * delta) / (delta + 38));
}

export function decodePunycodeLabel(label: string) {
  if (!label.toLowerCase().startsWith("xn--")) return label;
  const input = label.slice(4),
    output: number[] = [];
  let index = 0,
    codePoint = 128,
    bias = 72,
    delta = 0;
  const delimiter = input.lastIndexOf("-");
  if (delimiter >= 0) {
    for (const character of input.slice(0, delimiter)) {
      if (character.codePointAt(0)! >= 128)
        throw new Error("Invalid punycode label.");
      output.push(character.codePointAt(0)!);
    }
    index = delimiter + 1;
  }
  while (index < input.length) {
    const oldDelta = delta;
    let weight = 1;
    for (let thresholdIndex = 36; ; thresholdIndex += 36) {
      if (index >= input.length) throw new Error("Invalid punycode label.");
      const digit = decodeDigit(input.charCodeAt(index++));
      delta += digit * weight;
      const threshold =
        thresholdIndex <= bias + 1
          ? 1
          : thresholdIndex >= bias + 26
            ? 26
            : thresholdIndex - bias;
      if (digit < threshold) break;
      weight *= 36 - threshold;
    }
    const points = output.length + 1;
    bias = adaptBias(delta - oldDelta, points, oldDelta === 0);
    codePoint += Math.floor(delta / points);
    if (codePoint > 0x10ffff) throw new Error("Invalid punycode label.");
    delta %= points;
    output.splice(delta, 0, codePoint);
    delta += 1;
  }
  return String.fromCodePoint(...output);
}

export function toUnicodeHostname(hostname: string) {
  if (hostname.startsWith("[") && hostname.endsWith("]")) return hostname;
  try {
    return hostname
      .split(".")
      .map((label) => decodePunycodeLabel(label))
      .join(".");
  } catch {
    return hostname;
  }
}

function scriptsIn(value: string) {
  const scripts = [
    ["Latin", /\p{Script=Latin}/u],
    ["Cyrillic", /\p{Script=Cyrillic}/u],
    ["Greek", /\p{Script=Greek}/u],
    ["Han", /\p{Script=Han}/u],
    ["Hiragana", /\p{Script=Hiragana}/u],
    ["Katakana", /\p{Script=Katakana}/u],
    ["Arabic", /\p{Script=Arabic}/u],
    ["Hebrew", /\p{Script=Hebrew}/u],
    ["Devanagari", /\p{Script=Devanagari}/u],
  ] as const;
  return scripts
    .filter(([, pattern]) => pattern.test(value))
    .map(([name]) => name);
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function referenceKind(input: string): UrlReferenceKind {
  if (/^[a-z][a-z\d+.-]*:/i.test(input)) return "absolute";
  if (input.startsWith("//")) return "protocol-relative";
  if (input.startsWith("/")) return "root-relative";
  if (input.startsWith("?")) return "query-relative";
  if (input.startsWith("#")) return "fragment-relative";
  return "path-relative";
}

export function parseUrlReference(
  input: string,
  baseInput = "",
): UrlParserReport {
  const raw = input.trim(),
    kind = referenceKind(raw),
    relative = kind !== "absolute";
  if (!raw) throw new Error("Enter a URL or URL reference.");
  if (raw.length > MAX_URL_INPUT_LENGTH)
    throw new Error("The URL is too long to parse safely.");
  if (baseInput.length > MAX_URL_INPUT_LENGTH)
    throw new Error("The base URL is too long to parse safely.");
  if (relative && !baseInput.trim())
    throw new Error("Relative references require an explicit base URL.");

  let base: URL | undefined;
  try {
    if (baseInput.trim()) {
      base = new URL(baseInput.trim());
      if (base.username || base.password)
        throw new Error("Base URLs containing credentials are not allowed.");
    }
  } catch (caught) {
    if (caught instanceof Error && caught.message.includes("credentials"))
      throw caught;
    throw new Error("Enter a valid absolute base URL.");
  }

  let url: URL;
  try {
    url = relative ? new URL(raw, base) : new URL(raw);
  } catch {
    throw new Error("The URL is malformed or contains an invalid port.");
  }

  const usernamePresent = Boolean(url.username),
    passwordPresent = Boolean(url.password),
    safeUrl = new URL(url.href);
  safeUrl.username = "";
  safeUrl.password = "";
  const asciiHostname = url.hostname,
    unicodeHostname = toUnicodeHostname(asciiHostname),
    punycode = asciiHostname
      .split(".")
      .some((label) => label.toLowerCase().startsWith("xn--")),
    mixedScript = unicodeHostname
      .split(".")
      .some((label) => scriptsIn(label).length > 1),
    scheme = url.protocol.slice(0, -1),
    risks: UrlParserReport["risks"] = [];

  if (usernamePresent || passwordPresent)
    risks.push({
      code: "embedded-credentials",
      message:
        "Embedded credentials can leak through logs, history, or copied URLs. They were removed from the displayed canonical URL.",
    });
  if (punycode)
    risks.push({
      code: "punycode-host",
      message:
        "This internationalized hostname uses punycode. Verify the Unicode spelling before trusting it.",
    });
  if (mixedScript)
    risks.push({
      code: "mixed-script-host",
      message:
        "The Unicode hostname mixes writing systems and may be visually deceptive.",
    });
  if (
    url.port &&
    !(
      (scheme === "http" && url.port === "80") ||
      (scheme === "https" && url.port === "443")
    )
  )
    risks.push({
      code: "unusual-port",
      message: `Port ${url.port} is not the usual port for this scheme.`,
    });
  if (scheme !== "http" && scheme !== "https")
    risks.push({
      code: "non-http-scheme",
      message: `The ${scheme || "unknown"} scheme is not an HTTP(S) web URL. DevToolbox will not open it.`,
    });
  if (/\p{Cc}/u.test(raw))
    risks.push({
      code: "control-characters",
      message:
        "The input contains control characters that URL parsers may normalize or ignore.",
    });

  return {
    reference: { kind, relative, base: relative ? base?.href : undefined },
    canonicalUrl: safeUrl.href,
    scheme,
    credentials: { usernamePresent, passwordPresent },
    host: url.host,
    hostname: {
      ascii: asciiHostname,
      unicode: unicodeHostname,
      punycode,
      mixedScript,
    },
    port: url.port,
    origin: url.origin,
    pathname: url.pathname,
    pathSegments: url.pathname
      .split("/")
      .map((segment) => ({ raw: segment, decoded: safeDecode(segment) })),
    query: {
      raw: url.search.slice(1),
      pairs: [...url.searchParams].map(([key, value]) => ({ key, value })),
    },
    fragment: {
      raw: url.hash.slice(1),
      decoded: safeDecode(url.hash.slice(1)),
    },
    risks,
  };
}
