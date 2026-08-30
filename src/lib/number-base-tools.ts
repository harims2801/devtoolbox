export type NumberBaseInput = "ascii" | "binary" | "decimal" | "hexadecimal";

export interface NumberBaseResult {
  binary: string;
  decimal: string;
  hexadecimal: string;
  ascii: string;
  asciiAvailable: boolean;
  valueCount: number;
}

export const NUMBER_BASE_MAX_INPUT_LENGTH = 10_000;
export const NUMBER_BASE_MAX_VALUES = 2_048;
const MAX_VALUE_BITS = 4_096;

function parseToken(token: string, format: Exclude<NumberBaseInput, "ascii">) {
  const patterns = {
    binary: /^(?:0b)?([01]+)$/i,
    decimal: /^(\d+)$/,
    hexadecimal: /^(?:0x)?([0-9a-f]+)$/i,
  } as const;
  const match = patterns[format].exec(token);
  if (!match?.[1]) {
    throw new Error(`“${token}” is not valid ${format} input.`);
  }

  const digits = match[1];
  const estimatedBits =
    format === "binary"
      ? digits.length
      : format === "hexadecimal"
        ? digits.length * 4
        : Math.ceil(digits.length * Math.log2(10));
  if (estimatedBits > MAX_VALUE_BITS) {
    throw new Error(`“${token.slice(0, 24)}…” exceeds the 4,096-bit limit.`);
  }

  return BigInt(
    format === "binary"
      ? `0b${digits}`
      : format === "hexadecimal"
        ? `0x${digits}`
        : digits,
  );
}

function escapeAscii(value: number) {
  if (value === 0) return "\\0";
  if (value === 9) return "\\t";
  if (value === 10) return "\\n";
  if (value === 13) return "\\r";
  if (value < 32 || value === 127)
    return `\\x${value.toString(16).toUpperCase().padStart(2, "0")}`;
  return String.fromCharCode(value);
}

export function convertNumberBases(
  input: string,
  format: NumberBaseInput,
): NumberBaseResult {
  if (!input) throw new Error("Enter a value to convert.");
  if (input.length > NUMBER_BASE_MAX_INPUT_LENGTH)
    throw new Error(
      `Input must be ${NUMBER_BASE_MAX_INPUT_LENGTH.toLocaleString()} characters or fewer.`,
    );

  let values: bigint[];
  if (format === "ascii") {
    values = Array.from(input, (character) =>
      BigInt(character.codePointAt(0)!),
    );
    if (values.some((value) => value > 127n))
      throw new Error(
        "ASCII input supports only characters from U+0000 through U+007F.",
      );
  } else {
    const tokens = input
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);
    if (!tokens.length) throw new Error("Enter a value to convert.");
    if (tokens.length > NUMBER_BASE_MAX_VALUES)
      throw new Error(
        `Enter no more than ${NUMBER_BASE_MAX_VALUES.toLocaleString()} values.`,
      );
    values = tokens.map((token) => parseToken(token, format));
  }

  if (values.length > NUMBER_BASE_MAX_VALUES)
    throw new Error(
      `Enter no more than ${NUMBER_BASE_MAX_VALUES.toLocaleString()} values.`,
    );

  const asciiAvailable = values.every((value) => value <= 127n);
  return {
    binary: values.map((value) => `0b${value.toString(2)}`).join(" "),
    decimal: values.map((value) => value.toString(10)).join(" "),
    hexadecimal: values
      .map((value) => `0x${value.toString(16).toUpperCase()}`)
      .join(" "),
    ascii: asciiAvailable
      ? values.map((value) => escapeAscii(Number(value))).join("")
      : "Unavailable: every value must be between 0 and 127.",
    asciiAvailable,
    valueCount: values.length,
  };
}
