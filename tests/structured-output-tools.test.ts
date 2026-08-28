import { describe, expect, it } from "vitest";
import {
  buildStructuredOutputSchema,
  providerStructuredOutput,
  validateAgainstStructuredSchema,
  type StructuredField,
} from "@/lib/structured-output-tools";

function field(
  path: string,
  overrides: Partial<StructuredField> = {},
): StructuredField {
  return {
    id: path,
    path,
    type: "string",
    required: true,
    description: "",
    enumValues: "",
    ...overrides,
  };
}

describe("structured output schema builder", () => {
  it("builds strict nested object, object-array, and primitive-array schemas", () => {
    const result = buildStructuredOutputSchema(
      [
        field("candidate.name", { description: "Full name" }),
        field("candidate.skills[]"),
        field("jobs[].title"),
        field("jobs[].years", { type: "integer", required: false }),
      ],
      { title: "candidate_result", description: "A result" },
    );

    expect(result.errors).toEqual([]);
    expect(result.schema).toEqual({
      type: "object",
      description: "A result",
      properties: {
        candidate: {
          type: "object",
          properties: {
            name: { type: "string", description: "Full name" },
            skills: { type: "array", items: { type: "string" } },
          },
          required: ["name", "skills"],
          additionalProperties: false,
        },
        jobs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              years: { type: "integer" },
            },
            required: ["title"],
            additionalProperties: false,
          },
        },
      },
      required: ["candidate", "jobs"],
      additionalProperties: false,
      title: "candidate_result",
    });
  });

  it("deduplicates string enums and ignores enums on numeric fields", () => {
    const result = buildStructuredOutputSchema([
      field("status", { enumValues: "ready, waiting, ready" }),
      field("score", { type: "number", enumValues: "1, 2" }),
    ]);
    expect(result.warnings).toEqual([
      "Enum values on score are ignored because it is not a string.",
    ]);
    expect(
      (result.schema?.properties as Record<string, Record<string, unknown>>)
        .status?.enum,
    ).toEqual(["ready", "waiting"]);
  });

  it("rejects duplicate, conflicting, invalid, over-deep, and excessive fields", () => {
    expect(
      buildStructuredOutputSchema([field("result"), field("result")]).errors,
    ).toContain("Duplicate field path: result.");
    expect(
      buildStructuredOutputSchema([field("result"), field("result.name")])
        .errors[0],
    ).toMatch(/conflicts/);
    expect(buildStructuredOutputSchema([field("bad path")]).errors[0]).toMatch(
      /dot-separated/,
    );
    expect(
      buildStructuredOutputSchema([field("a.b.c.d.e.f")]).errors[0],
    ).toMatch(/1-5/);
    expect(
      buildStructuredOutputSchema(
        Array.from({ length: 51 }, (_, index) => field(`field_${index}`)),
      ).errors,
    ).toContain("Use no more than 50 fields.");
  });

  it("validates nested arrays, required properties, enums, and unexpected keys", () => {
    const schema = buildStructuredOutputSchema([
      field("items[].name"),
      field("items[].count", { type: "integer" }),
      field("status", { enumValues: "ok, error" }),
    ]).schema!;
    expect(
      validateAgainstStructuredSchema(
        { items: [{ name: "A", count: 2 }], status: "ok" },
        schema,
      ),
    ).toEqual([]);
    expect(
      validateAgainstStructuredSchema(
        {
          items: [{ count: 1.5, extra: true }],
          status: "unknown",
          debug: true,
        },
        schema,
      ),
    ).toEqual(
      expect.arrayContaining([
        { path: "$.debug", message: "Additional field is not allowed." },
        { path: "$.items[0].name", message: "Required field is missing." },
        {
          path: "$.items[0].extra",
          message: "Additional field is not allowed.",
        },
        {
          path: "$.items[0].count",
          message: "Expected integer, received number.",
        },
        {
          path: "$.status",
          message: "Value must be one of: ok, error.",
        },
      ]),
    );
  });

  it("exports current OpenAI, Anthropic, Google, and raw schema wrappers", () => {
    const schema = { type: "object", properties: {} };
    expect(providerStructuredOutput("json-schema", schema, "My Result")).toBe(
      schema,
    );
    expect(providerStructuredOutput("openai", schema, "My Result")).toEqual({
      text: {
        format: {
          type: "json_schema",
          name: "my_result",
          strict: true,
          schema,
        },
      },
    });
    expect(providerStructuredOutput("anthropic", schema, "ignored")).toEqual({
      output_config: { format: { type: "json_schema", schema } },
    });
    expect(providerStructuredOutput("google", schema, "ignored")).toEqual({
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema,
      },
    });
  });
});
