import {
  buildStructuredOutputSchema,
  type JsonSchema,
  type StructuredField,
} from "@/lib/structured-output-tools";

export type ToolSchemaTarget = "openai" | "anthropic" | "mcp";

export interface ToolBehaviorHints {
  readOnly: boolean;
  destructive: boolean;
  idempotent: boolean;
  openWorld: boolean;
}

export interface ToolSchemaDefinition {
  name: string;
  title: string;
  description: string;
  inputFields: readonly StructuredField[];
  outputFields: readonly StructuredField[];
  strict: boolean;
  hints: ToolBehaviorHints;
}

export interface ToolSchemaBuildResult {
  inputSchema?: JsonSchema;
  outputSchema?: JsonSchema;
  errors: string[];
  warnings: string[];
}

const toolName = /^[A-Za-z0-9_.-]{1,64}$/;

function emptyObjectSchema(): JsonSchema {
  return { type: "object", properties: {}, additionalProperties: false };
}

export function buildAiToolSchemas(
  definition: ToolSchemaDefinition,
): ToolSchemaBuildResult {
  const errors: string[] = [],
    warnings: string[] = [];
  if (!toolName.test(definition.name.trim()))
    errors.push(
      "Tool name must use 1-64 letters, numbers, dots, underscores, or hyphens.",
    );
  if (!definition.description.trim())
    errors.push("Add a tool description so models know when to use it.");
  if (definition.description.length > 1_024)
    errors.push("Tool description must be 1,024 characters or fewer.");

  const input = definition.inputFields.length
      ? buildStructuredOutputSchema(definition.inputFields)
      : { schema: emptyObjectSchema(), errors: [], warnings: [] },
    output = definition.outputFields.length
      ? buildStructuredOutputSchema(definition.outputFields)
      : { schema: undefined, errors: [], warnings: [] };
  errors.push(...input.errors.map((message) => `Input: ${message}`));
  errors.push(...output.errors.map((message) => `Output: ${message}`));
  warnings.push(...input.warnings, ...output.warnings);
  if (!definition.inputFields.length)
    warnings.push(
      "This tool accepts no arguments; confirm that is intentional.",
    );
  if (definition.hints.destructive && definition.hints.readOnly)
    errors.push("A destructive tool cannot also be marked read-only.");
  if (definition.hints.destructive && definition.hints.idempotent)
    warnings.push(
      "Review whether a destructive operation is truly safe to repeat.",
    );

  return errors.length
    ? { errors, warnings }
    : {
        inputSchema: input.schema,
        outputSchema: output.schema,
        errors,
        warnings,
      };
}

export function exportAiToolSchema(
  target: ToolSchemaTarget,
  definition: ToolSchemaDefinition,
  schemas: Pick<ToolSchemaBuildResult, "inputSchema" | "outputSchema">,
) {
  if (!schemas.inputSchema)
    throw new Error("A valid input schema is required before export.");
  const name = definition.name.trim(),
    description = definition.description.trim(),
    title = definition.title.trim();
  if (target === "openai")
    return {
      type: "function",
      name,
      description,
      parameters: schemas.inputSchema,
      strict: definition.strict,
    };
  if (target === "anthropic")
    return { name, description, input_schema: schemas.inputSchema };
  return {
    name,
    ...(title ? { title } : {}),
    description,
    inputSchema: schemas.inputSchema,
    ...(schemas.outputSchema ? { outputSchema: schemas.outputSchema } : {}),
    annotations: {
      readOnlyHint: definition.hints.readOnly,
      destructiveHint: definition.hints.destructive,
      idempotentHint: definition.hints.idempotent,
      openWorldHint: definition.hints.openWorld,
    },
  };
}
