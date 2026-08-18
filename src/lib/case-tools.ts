export const caseFormats = [
  "camelCase",
  "PascalCase",
  "snake_case",
  "kebab-case",
  "CONSTANT_CASE",
  "dot.case",
  "path/case",
  "Title Case",
  "sentence case",
  "lower",
  "UPPER",
] as const;

export type CaseFormat = (typeof caseFormats)[number];

export interface CaseConversion {
  format: CaseFormat;
  value: string;
}

export function tokenizeCaseInput(input: string) {
  return input
    .normalize("NFC")
    .replace(/([\p{Lu}\p{Lt}]+)([\p{Lu}\p{Lt}][\p{Ll}])/gu, "$1 $2")
    .replace(/([\p{Ll}\p{Nd}])([\p{Lu}\p{Lt}])/gu, "$1 $2")
    .replace(/([\p{L}])(\p{Nd})/gu, "$1 $2")
    .replace(/(\p{Nd})([\p{L}])/gu, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function lower(value: string) {
  return value.toLowerCase();
}

function upper(value: string) {
  return value.toUpperCase();
}

function capitalize(value: string) {
  const [first = "", ...rest] = Array.from(lower(value));
  return upper(first) + rest.join("");
}

export function convertCase(input: string): CaseConversion[] {
  const words = tokenizeCaseInput(input),
    lowered = words.map(lower),
    pascal = words.map(capitalize).join(""),
    title = words.map(capitalize).join(" "),
    sentence = lowered.length
      ? [capitalize(lowered[0]!), ...lowered.slice(1)].join(" ")
      : "";
  return [
    {
      format: "camelCase",
      value: lowered.length
        ? lowered[0] + words.slice(1).map(capitalize).join("")
        : "",
    },
    { format: "PascalCase", value: pascal },
    { format: "snake_case", value: lowered.join("_") },
    { format: "kebab-case", value: lowered.join("-") },
    { format: "CONSTANT_CASE", value: words.map(upper).join("_") },
    { format: "dot.case", value: lowered.join(".") },
    { format: "path/case", value: lowered.join("/") },
    { format: "Title Case", value: title },
    { format: "sentence case", value: sentence },
    { format: "lower", value: lower(input) },
    { format: "UPPER", value: upper(input) },
  ];
}
