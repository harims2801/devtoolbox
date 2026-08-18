export type HtmlEntityFormat = "named" | "decimal" | "hexadecimal";

export interface HtmlEntityEncodeOptions {
  format: HtmlEntityFormat;
  encodeQuotes?: boolean;
  encodeNonAscii?: boolean;
}

const namedEntities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  copy: "©",
  reg: "®",
  trade: "™",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  bull: "•",
  middot: "·",
  times: "×",
  divide: "÷",
};

const entityNamesByCharacter = new Map(
  Object.entries(namedEntities).map(([name, character]) => [character, name]),
);

function shouldEncode(character: string, options: HtmlEntityEncodeOptions) {
  if (["&", "<", ">"].includes(character)) return true;
  if (options.encodeQuotes && ['"', "'"].includes(character)) return true;
  return Boolean(
    options.encodeNonAscii && (character.codePointAt(0) ?? 0) > 0x7f,
  );
}

function encodeCharacter(character: string, format: HtmlEntityFormat) {
  const codePoint = character.codePointAt(0)!;
  if (format === "decimal") return `&#${codePoint};`;
  if (format === "hexadecimal")
    return `&#x${codePoint.toString(16).toUpperCase()};`;
  const name = entityNamesByCharacter.get(character);
  return name ? `&${name};` : `&#${codePoint};`;
}

export function encodeHtmlEntities(
  input: string,
  options: HtmlEntityEncodeOptions,
) {
  return Array.from(input, (character) =>
    shouldEncode(character, options)
      ? encodeCharacter(character, options.format)
      : character,
  ).join("");
}

function decodeNumericEntity(
  entity: string,
  value: string,
  hexadecimal: boolean,
) {
  const codePoint = Number.parseInt(value, hexadecimal ? 16 : 10);
  if (
    !Number.isInteger(codePoint) ||
    codePoint <= 0 ||
    codePoint > 0x10ffff ||
    (codePoint >= 0xd800 && codePoint <= 0xdfff)
  ) {
    return entity;
  }
  return String.fromCodePoint(codePoint);
}

export function decodeHtmlEntities(input: string) {
  return input.replace(
    /&(?:#([0-9]+)|#x([0-9a-f]+)|([a-z][a-z0-9]+));/gi,
    (
      entity,
      decimal: string | undefined,
      hexadecimal: string | undefined,
      name: string | undefined,
    ) => {
      if (decimal) return decodeNumericEntity(entity, decimal, false);
      if (hexadecimal) return decodeNumericEntity(entity, hexadecimal, true);
      return namedEntities[name?.toLowerCase() ?? ""] ?? entity;
    },
  );
}
