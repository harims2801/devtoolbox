import { describe, expect, it } from "vitest";
import {
  buildAiToolSchemas,
  exportAiToolSchema,
  type ToolSchemaDefinition,
} from "@/lib/ai-tool-schema-tools";
import type { StructuredField } from "@/lib/structured-output-tools";

function field(path: string, required = true): StructuredField {
  return {
    id: path,
    path,
    type: "string",
    required,
    description: `${path} value`,
    enumValues: "",
  };
}

function definition(
  overrides: Partial<ToolSchemaDefinition> = {},
): ToolSchemaDefinition {
  return {
    name: "search_docs",
    title: "Document search",
    description: "Search approved documents for relevant passages.",
    inputFields: [field("query"), field("filters.tags[]", false)],
    outputFields: [field("matches[].id"), field("matches[].text")],
    strict: true,
    hints: {
      readOnly: true,
      destructive: false,
      idempotent: true,
      openWorld: false,
    },
    ...overrides,
  };
}

describe("AI tool schema builder", () => {
  it("builds strict input and optional output schemas", () => {
    const result = buildAiToolSchemas(definition());
    expect(result.errors).toEqual([]);
    expect(result.inputSchema).toMatchObject({
      type: "object",
      required: ["query"],
      additionalProperties: false,
    });
    expect(result.outputSchema).toMatchObject({
      type: "object",
      required: ["matches"],
      additionalProperties: false,
    });
  });

  it("supports a deliberately argument-free tool", () => {
    const result = buildAiToolSchemas(definition({ inputFields: [] }));
    expect(result.errors).toEqual([]);
    expect(result.inputSchema).toEqual({
      type: "object",
      properties: {},
      additionalProperties: false,
    });
    expect(result.warnings[0]).toMatch(/accepts no arguments/);
  });

  it("rejects unsafe names, absent descriptions, schema conflicts, and contradictory hints", () => {
    const result = buildAiToolSchemas(
      definition({
        name: "bad tool!",
        description: "",
        inputFields: [field("item"), field("item.id")],
        hints: {
          readOnly: true,
          destructive: true,
          idempotent: false,
          openWorld: false,
        },
      }),
    );
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Tool name/),
        expect.stringMatching(/description/),
        expect.stringMatching(/Input:.*conflicts/),
        expect.stringMatching(/cannot also be marked read-only/),
      ]),
    );
    expect(result.inputSchema).toBeUndefined();
  });

  it("exports the OpenAI function-tool shape without MCP-only fields", () => {
    const source = definition(),
      schemas = buildAiToolSchemas(source);
    expect(exportAiToolSchema("openai", source, schemas)).toEqual({
      type: "function",
      name: "search_docs",
      description: source.description,
      parameters: schemas.inputSchema,
      strict: true,
    });
  });

  it("exports the Anthropic tool shape without unsupported output metadata", () => {
    const source = definition(),
      schemas = buildAiToolSchemas(source);
    expect(exportAiToolSchema("anthropic", source, schemas)).toEqual({
      name: "search_docs",
      description: source.description,
      input_schema: schemas.inputSchema,
    });
  });

  it("exports MCP input, output, title, and untrusted behavior annotations", () => {
    const source = definition(),
      schemas = buildAiToolSchemas(source);
    expect(exportAiToolSchema("mcp", source, schemas)).toEqual({
      name: "search_docs",
      title: "Document search",
      description: source.description,
      inputSchema: schemas.inputSchema,
      outputSchema: schemas.outputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    });
  });

  it("refuses export without a validated input schema", () => {
    expect(() => exportAiToolSchema("mcp", definition(), {})).toThrow(
      /valid input schema/,
    );
  });
});
