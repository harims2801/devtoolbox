export const TEST_DATA_FIELD_TYPES = [
  "uuid",
  "name",
  "email",
  "phone",
  "address",
  "company",
  "date",
  "boolean",
  "number",
] as const;
export type TestDataFieldType = (typeof TEST_DATA_FIELD_TYPES)[number];
export type TestDataSchema = {
  [key: string]: TestDataFieldType | TestDataSchema;
};
export type TestDataFormat = "json" | "jsonl" | "csv";
export interface TestDataOptions {
  count: number;
  schema: TestDataSchema;
  seed?: string;
  dateStart?: string;
  dateEnd?: string;
  numberMin?: number;
  numberMax?: number;
}
export const DEFAULT_TEST_DATA_SCHEMA: TestDataSchema = {
  id: "uuid",
  name: "name",
  email: "email",
  phone: "phone",
  address: "address",
  company: "company",
  createdAt: "date",
  active: "boolean",
  score: "number",
};
const typeSet = new Set<string>(TEST_DATA_FIELD_TYPES);
function hashSeed(seed: string) {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.codePointAt(0)!;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}
function seededRandom(seed: string) {
  let state = hashSeed(seed);
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
function cryptoRandom() {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0]! / 4294967296;
}
export function parseTestDataSchema(input: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("Custom schema must be valid JSON.");
  }
  validateTestDataSchema(parsed);
  return parsed as TestDataSchema;
}
export function validateTestDataSchema(schema: unknown) {
  let fields = 0;
  function visit(value: unknown, depth: number) {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Schema levels must be JSON objects.");
    if (depth > 3) throw new Error("Schema nesting cannot exceed 3 levels.");
    const entries = Object.entries(value);
    if (!entries.length) throw new Error("Schema objects cannot be empty.");
    for (const [key, field] of entries) {
      fields += 1;
      if (fields > 50)
        throw new Error("Schema cannot contain more than 50 fields.");
      if (!/^[A-Za-z_][A-Za-z0-9_]{0,39}$/.test(key))
        throw new Error(`Invalid field name "${key}".`);
      if (typeof field === "string") {
        if (!typeSet.has(field))
          throw new Error(`Unsupported field type "${field}".`);
      } else visit(field, depth + 1);
    }
  }
  visit(schema, 1);
  return true;
}
function uuid(random: () => number) {
  const bytes = Array.from({ length: 16 }, () => Math.floor(random() * 256));
  bytes[6] = (bytes[6]! & 15) | 64;
  bytes[8] = (bytes[8]! & 63) | 128;
  const hex = bytes
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function fieldValue(
  type: TestDataFieldType,
  index: number,
  random: () => number,
  options: TestDataOptions,
): unknown {
  const serial = String(index + 1).padStart(3, "0");
  switch (type) {
    case "uuid":
      return uuid(random);
    case "name":
      return `Test Person ${serial}`;
    case "email":
      return `user${serial}@example.test`;
    case "phone":
      return `+1-202-555-01${String(index % 100).padStart(2, "0")}`;
    case "address":
      return `${100 + index} Example Avenue, Testville`;
    case "company":
      return ["Example Labs", "Sample Systems", "Fixture Works"][index % 3]!;
    case "boolean":
      return random() >= 0.5;
    case "number": {
      const min = options.numberMin ?? 0,
        max = options.numberMax ?? 1000;
      return min + Math.floor(random() * (max - min + 1));
    }
    case "date": {
      const start = Date.parse(options.dateStart ?? "2020-01-01T00:00:00.000Z"),
        end = Date.parse(options.dateEnd ?? "2030-12-31T23:59:59.999Z");
      return new Date(
        start + Math.floor(random() * (end - start + 1)),
      ).toISOString();
    }
  }
}
function record(
  schema: TestDataSchema,
  index: number,
  random: () => number,
  options: TestDataOptions,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(schema).map(([key, value]) => [
      key,
      typeof value === "string"
        ? fieldValue(value, index, random, options)
        : record(value, index, random, options),
    ]),
  );
}
export function generateTestData(options: TestDataOptions) {
  if (
    !Number.isInteger(options.count) ||
    options.count < 1 ||
    options.count > 1000
  )
    throw new Error("Record count must be a whole number from 1 to 1,000.");
  validateTestDataSchema(options.schema);
  const start = Date.parse(options.dateStart ?? "2020-01-01"),
    end = Date.parse(options.dateEnd ?? "2030-12-31");
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end)
    throw new Error("Date range is invalid or reversed.");
  if ((options.numberMin ?? 0) > (options.numberMax ?? 1000))
    throw new Error("Number range is reversed.");
  const random = options.seed ? seededRandom(options.seed) : cryptoRandom;
  return Array.from({ length: options.count }, (_, index) =>
    record(options.schema, index, random, options),
  );
}
function csvCell(value: unknown) {
  const text =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
export function exportTestData(
  records: Record<string, unknown>[],
  format: TestDataFormat,
  schema: TestDataSchema,
) {
  if (format === "json") return JSON.stringify(records, null, 2);
  if (format === "jsonl")
    return records.map((value) => JSON.stringify(value)).join("\n");
  const keys = Object.keys(schema);
  return [
    keys.map(csvCell).join(","),
    ...records.map((value) => keys.map((key) => csvCell(value[key])).join(",")),
  ].join("\n");
}
