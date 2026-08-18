import { generateBatch } from "@/lib/generator-tools";
export interface UuidOptions {
  count: number;
  uppercase?: boolean;
  removeHyphens?: boolean;
  prefix?: string;
  suffix?: string;
  randomUUID?: () => string;
}
export function generateUuidBatch(options: UuidOptions) {
  const generate = options.randomUUID ?? (() => crypto.randomUUID());
  return generateBatch({
    count: options.count,
    generate,
    transform: (value) => {
      let result = options.removeHyphens ? value.replaceAll("-", "") : value;
      if (options.uppercase) result = result.toUpperCase();
      return `${options.prefix ?? ""}${result}${options.suffix ?? ""}`;
    },
  });
}
export function validateUuidBatch(values: string[]) {
  return {
    count: values.length,
    uniqueCount: new Set(values).size,
    isUnique: new Set(values).size === values.length,
  };
}
export function exportUuidBatch(
  values: string[],
  format: "txt" | "csv" | "json",
) {
  if (format === "txt") return values.join("\n");
  if (format === "csv")
    return [
      "uuid",
      ...values.map((value) => `"${value.replaceAll('"', '""')}"`),
    ].join("\n");
  return JSON.stringify(values, null, 2);
}
