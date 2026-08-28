export type StructuredFieldType = "string" | "integer" | "number" | "boolean";

export interface StructuredField {
  id: string;
  path: string;
  type: StructuredFieldType;
  required: boolean;
  description: string;
  enumValues: string;
}

export type JsonSchema = Record<string, unknown>;

export interface SchemaBuildResult {
  schema?: JsonSchema;
  errors: string[];
  warnings: string[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}

const MAX_FIELDS = 50,
  MAX_DEPTH = 5,
  identifier = /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/;

interface PathPart {
  name: string;
  array: boolean;
}

function parsePath(input: string): PathPart[] | undefined {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 320) return undefined;
  const raw = trimmed.split(".");
  if (!raw.length || raw.length > MAX_DEPTH) return undefined;
  const parts = raw.map((part) => ({
    name: part.endsWith("[]") ? part.slice(0, -2) : part,
    array: part.endsWith("[]"),
  }));
  return parts.every((part) => identifier.test(part.name)) ? parts : undefined;
}

function objectSchema(description?: string): JsonSchema {
  return {
    type: "object",
    ...(description ? { description } : {}),
    properties: {},
    required: [],
    additionalProperties: false,
  };
}

function properties(schema: JsonSchema) {
  return schema.properties as Record<string, JsonSchema>;
}

function required(schema: JsonSchema) {
  return schema.required as string[];
}

function addRequired(schema: JsonSchema, name: string) {
  const values = required(schema);
  if (!values.includes(name)) values.push(name);
}

function leafSchema(field: StructuredField): JsonSchema {
  const enumValues = field.enumValues
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    type: field.type,
    ...(field.description.trim()
      ? { description: field.description.trim().slice(0, 500) }
      : {}),
    ...(field.type === "string" && enumValues.length
      ? { enum: [...new Set(enumValues)].slice(0, 50) }
      : {}),
  };
}

export function buildStructuredOutputSchema(
  fields: readonly StructuredField[],
  options: { title?: string; description?: string } = {},
): SchemaBuildResult {
  const errors: string[] = [],
    warnings: string[] = [];
  if (!fields.length) errors.push("Add at least one output field.");
  if (fields.length > MAX_FIELDS)
    errors.push(`Use no more than ${MAX_FIELDS} fields.`);
  const root = objectSchema(options.description?.trim().slice(0, 500));
  if (options.title?.trim()) root.title = options.title.trim().slice(0, 100);
  const seen = new Set<string>();

  for (const [index, field] of fields.slice(0, MAX_FIELDS).entries()) {
    const parts = parsePath(field.path);
    if (!parts) {
      errors.push(
        `Field ${index + 1} must use 1-${MAX_DEPTH} dot-separated names; append [] to array segments.`,
      );
      continue;
    }
    const normalized = parts
      .map((part) => `${part.name}${part.array ? "[]" : ""}`)
      .join(".");
    if (seen.has(normalized)) {
      errors.push(`Duplicate field path: ${normalized}.`);
      continue;
    }
    seen.add(normalized);
    if (field.enumValues.trim() && field.type !== "string")
      warnings.push(
        `Enum values on ${normalized} are ignored because it is not a string.`,
      );

    let current = root;
    let conflicted = false;
    for (const [partIndex, part] of parts.entries()) {
      const last = partIndex === parts.length - 1,
        existing = properties(current)[part.name];
      if (last) {
        const leaf = leafSchema(field);
        const value = part.array ? { type: "array", items: leaf } : leaf;
        if (existing) {
          errors.push(`Field path ${normalized} conflicts with another field.`);
          conflicted = true;
          break;
        }
        properties(current)[part.name] = value;
        if (field.required) addRequired(current, part.name);
        continue;
      }

      let child: JsonSchema;
      if (existing) {
        const target = part.array
          ? (existing.items as JsonSchema | undefined)
          : existing;
        if (
          existing.type !== (part.array ? "array" : "object") ||
          !target ||
          target.type !== "object"
        ) {
          errors.push(`Field path ${normalized} conflicts at ${part.name}.`);
          conflicted = true;
          break;
        }
        child = target;
      } else {
        child = objectSchema();
        properties(current)[part.name] = part.array
          ? { type: "array", items: child }
          : child;
      }
      if (field.required) addRequired(current, part.name);
      current = child;
    }
    if (conflicted) continue;
  }

  function clean(schema: JsonSchema) {
    if (schema.type === "object") {
      const values = required(schema);
      if (!values.length) delete schema.required;
      else values.sort();
      const entries = Object.entries(properties(schema)).sort(([a], [b]) =>
        a.localeCompare(b),
      );
      schema.properties = Object.fromEntries(entries);
      for (const child of Object.values(properties(schema))) clean(child);
    } else if (schema.type === "array") {
      clean(schema.items as JsonSchema);
    }
  }
  clean(root);
  return errors.length
    ? { errors, warnings }
    : { schema: root, errors, warnings };
}

function typeName(value: unknown) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

export function validateAgainstStructuredSchema(
  value: unknown,
  schema: JsonSchema,
  path = "$",
): ValidationIssue[] {
  const issues: ValidationIssue[] = [],
    expected = schema.type as string;
  if (expected === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return [
        { path, message: `Expected object, received ${typeName(value)}.` },
      ];
    const record = value as Record<string, unknown>,
      allowed = schema.properties as Record<string, JsonSchema>,
      requiredFields = (schema.required as string[] | undefined) ?? [];
    for (const name of requiredFields)
      if (!(name in record))
        issues.push({
          path: `${path}.${name}`,
          message: "Required field is missing.",
        });
    if (schema.additionalProperties === false)
      for (const name of Object.keys(record))
        if (!(name in allowed))
          issues.push({
            path: `${path}.${name}`,
            message: "Additional field is not allowed.",
          });
    for (const [name, child] of Object.entries(allowed))
      if (name in record)
        issues.push(
          ...validateAgainstStructuredSchema(
            record[name],
            child,
            `${path}.${name}`,
          ),
        );
    return issues;
  }
  if (expected === "array") {
    if (!Array.isArray(value))
      return [
        { path, message: `Expected array, received ${typeName(value)}.` },
      ];
    for (const [index, item] of value.entries())
      issues.push(
        ...validateAgainstStructuredSchema(
          item,
          schema.items as JsonSchema,
          `${path}[${index}]`,
        ),
      );
    return issues;
  }
  const validType =
    expected === "integer"
      ? typeof value === "number" && Number.isInteger(value)
      : expected === "number"
        ? typeof value === "number" && Number.isFinite(value)
        : typeof value === expected;
  if (!validType)
    return [
      { path, message: `Expected ${expected}, received ${typeName(value)}.` },
    ];
  const enumValues = schema.enum as string[] | undefined;
  if (enumValues && !enumValues.includes(value as string))
    issues.push({
      path,
      message: `Value must be one of: ${enumValues.join(", ")}.`,
    });
  return issues;
}

export function providerStructuredOutput(
  provider: "json-schema" | "openai" | "anthropic" | "google",
  schema: JsonSchema,
  name: string,
) {
  const safeName =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 64) || "structured_output";
  if (provider === "openai")
    return {
      text: {
        format: { type: "json_schema", name: safeName, strict: true, schema },
      },
    };
  if (provider === "anthropic")
    return { output_config: { format: { type: "json_schema", schema } } };
  if (provider === "google")
    return {
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema,
      },
    };
  return schema;
}
