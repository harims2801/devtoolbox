import YAML from "yaml";
export type TerraformInputFormat = "json" | "yaml" | "key-value";
export interface TerraformVariable {
  originalName: string;
  name: string;
  value: unknown;
  type: string;
  warning?: string;
  ambiguous?: boolean;
  description?: string;
  sensitive: boolean;
  nullable: boolean;
  validation?: boolean;
}
export interface TerraformFiles {
  variablesTf: string;
  tfvars: string;
  tfvarsJson: string;
  environment: string;
  warnings: string[];
}
export function sanitizeTerraformIdentifier(name: string) {
  const clean = name
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/^[^A-Za-z_]/, "_$&");
  return { name: clean || "variable", renamed: clean !== name };
}
export function parseTerraformInput(
  source: string,
  format: TerraformInputFormat,
) {
  let value: unknown;
  if (format === "json") value = JSON.parse(source);
  else if (format === "yaml") value = YAML.parse(source);
  else {
    const object: Record<string, unknown> = {};
    source
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((line, index) => {
        const match = /^([^=]+)=(.*)$/.exec(line);
        if (!match) throw new Error(`Line ${index + 1}: expected key=value.`);
        const raw = match[2]!.trim();
        try {
          object[match[1]!.trim()] = JSON.parse(raw);
        } catch {
          object[match[1]!.trim()] = raw;
        }
      });
    value = object;
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(
      "Input must be an object of variable names and example values.",
    );
  return value as Record<string, unknown>;
}
export function inferTerraformType(value: unknown): {
  type: string;
  ambiguous: boolean;
  warning?: string;
} {
  if (value === null)
    return {
      type: "string",
      ambiguous: true,
      warning: "Null has no inferable type; choose a type.",
    };
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return {
      type: typeof value === "boolean" ? "bool" : typeof value,
      ambiguous: false,
    };
  if (Array.isArray(value)) {
    if (!value.length)
      return {
        type: "list(string)",
        ambiguous: true,
        warning: "Empty list type is ambiguous; choose its element type.",
      };
    const types = value.map((x) => inferTerraformType(x).type),
      unique = [...new Set(types)];
    if (unique.length > 1)
      return {
        type: "tuple([" + types.join(", ") + "])",
        ambiguous: true,
        warning:
          "Mixed collection values require review; a tuple was generated.",
      };
    return { type: `list(${unique[0]})`, ambiguous: false };
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length)
      return {
        type: "map(string)",
        ambiguous: true,
        warning: "Empty object type is ambiguous; choose map or object fields.",
      };
    const types = entries.map(([, item]) => inferTerraformType(item));
    const homogeneous = types.every(
      (x) => x.type === types[0]?.type && !x.ambiguous,
    );
    if (homogeneous)
      return { type: `map(${types[0]!.type})`, ambiguous: false };
    return {
      type: `object({ ${entries.map(([key, item]) => `${sanitizeTerraformIdentifier(key).name} = ${inferTerraformType(item).type}`).join(", ")} })`,
      ambiguous: types.some((x) => x.ambiguous),
      warning: types.some((x) => x.ambiguous)
        ? "A nested value has an ambiguous type."
        : undefined,
    };
  }
  return {
    type: "string",
    ambiguous: true,
    warning: "This value type is unsupported; review it as a string.",
  };
}
export function buildTerraformVariables(
  values: Record<string, unknown>,
): TerraformVariable[] {
  return Object.entries(values).map(([originalName, value]) => {
    const id = sanitizeTerraformIdentifier(originalName),
      inferred = inferTerraformType(value);
    return {
      originalName,
      name: id.name,
      value,
      type: inferred.type,
      ambiguous: inferred.ambiguous,
      warning:
        [
          id.renamed ? `Renamed ${originalName} to ${id.name}.` : "",
          inferred.warning ?? "",
        ]
          .filter(Boolean)
          .join(" ") || undefined,
      sensitive: false,
      nullable: value === null,
    };
  });
}
function hclString(value: string) {
  return JSON.stringify(value)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
export function toHcl(value: unknown, masked = false): string {
  if (masked) return hclString("••••••••");
  if (value === null) return "null";
  if (typeof value === "string") return hclString(value);
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) return `[${value.map((x) => toHcl(x)).join(", ")}]`;
  if (typeof value === "object")
    return `{ ${Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${hclString(k)} = ${toHcl(v)}`)
      .join(", ")} }`;
  return hclString(String(value));
}
export function generateTerraformFiles(
  variables: TerraformVariable[],
  options: { valuesAsDefaults?: boolean; includeEnvironment?: boolean } = {},
): TerraformFiles {
  const warnings = variables.flatMap((v) => (v.warning ? [v.warning] : []));
  const variablesTf =
    variables
      .map((v) =>
        [
          `variable ${hclString(v.name)} {`,
          `  type        = ${v.type}`,
          v.description ? `  description = ${hclString(v.description)}` : "",
          `  sensitive   = ${v.sensitive}`,
          `  nullable    = ${v.nullable}`,
          options.valuesAsDefaults ? `  default     = ${toHcl(v.value)}` : "",
          v.validation
            ? `  validation {\n    condition     = var.${v.name} != null\n    error_message = "${v.name} must be valid."\n  }`
            : "",
          "}",
        ]
          .filter(Boolean)
          .join("\n"),
      )
      .join("\n\n") + "\n";
  const external = options.valuesAsDefaults ? [] : variables,
    tfvars =
      external.map((v) => `${v.name} = ${toHcl(v.value)}`).join("\n") +
      (external.length ? "\n" : ""),
    tfvarsJson =
      JSON.stringify(
        Object.fromEntries(external.map((v) => [v.name, v.value])),
        null,
        2,
      ) + "\n",
    environment = options.includeEnvironment
      ? external
          .map((v) => `TF_VAR_${v.name}=${toHcl(v.value, v.sensitive)}`)
          .join("\n") + (external.length ? "\n" : "")
      : "";
  return { variablesTf, tfvars, tfvarsJson, environment, warnings };
}
