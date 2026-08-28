"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  CopyButton,
  DownloadButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { OutputPanel } from "@/components/tools/output-panel";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import {
  buildStructuredOutputSchema,
  providerStructuredOutput,
  validateAgainstStructuredSchema,
  type StructuredField,
  type StructuredFieldType,
} from "@/lib/structured-output-tools";

type Provider = "json-schema" | "openai" | "anthropic" | "google";

const exampleFields: StructuredField[] = [
  {
    id: "example-name",
    path: "candidate.name",
    type: "string",
    required: true,
    description: "Candidate's full name",
    enumValues: "",
  },
  {
    id: "example-experience",
    path: "candidate.years_experience",
    type: "integer",
    required: true,
    description: "Completed years of relevant experience",
    enumValues: "",
  },
  {
    id: "example-skills",
    path: "candidate.skills[]",
    type: "string",
    required: true,
    description: "Relevant technical skills",
    enumValues: "",
  },
  {
    id: "example-level",
    path: "recommendation",
    type: "string",
    required: true,
    description: "Screening recommendation",
    enumValues: "advance, review, decline",
  },
];

const exampleSample = JSON.stringify(
  {
    candidate: {
      name: "Example Candidate",
      years_experience: 7,
      skills: ["Python", "Kubernetes"],
    },
    recommendation: "advance",
  },
  null,
  2,
);

function emptyField(id: string): StructuredField {
  return {
    id,
    path: "",
    type: "string",
    required: true,
    description: "",
    enumValues: "",
  };
}

export function StructuredOutputSchemaTool() {
  const tool = getToolById("structured-output-schema-builder");
  if (!tool) throw new Error("Structured output schema metadata is missing");
  const [name, setName] = useState("candidate_result"),
    [description, setDescription] = useState(
      "Structured candidate screening result",
    ),
    [fields, setFields] = useState<StructuredField[]>(exampleFields),
    [sample, setSample] = useState(exampleSample),
    [provider, setProvider] = useState<Provider>("json-schema"),
    result = useMemo(
      () => buildStructuredOutputSchema(fields, { title: name, description }),
      [description, fields, name],
    ),
    validation = useMemo(() => {
      if (!sample.trim()) return { parseError: "", issues: [] };
      if (!result.schema)
        return {
          parseError: "Fix the schema before validating a sample.",
          issues: [],
        };
      try {
        return {
          parseError: "",
          issues: validateAgainstStructuredSchema(
            JSON.parse(sample),
            result.schema,
          ),
        };
      } catch {
        return { parseError: "Sample response is not valid JSON.", issues: [] };
      }
    }, [result.schema, sample]),
    generated = result.schema
      ? providerStructuredOutput(provider, result.schema, name)
      : undefined,
    serialized = generated ? JSON.stringify(generated, null, 2) : "";

  function updateField(id: string, update: Partial<StructuredField>) {
    setFields((current) =>
      current.map((field) =>
        field.id === id ? { ...field, ...update } : field,
      ),
    );
  }

  function reset() {
    setName("structured_output");
    setDescription("");
    setFields([emptyField("field-1")]);
    setSample("");
    setProvider("json-schema");
  }

  function loadExample() {
    setName("candidate_result");
    setDescription("Structured candidate screening result");
    setFields(exampleFields);
    setSample(exampleSample);
    setProvider("json-schema");
  }

  const input = (
    <div className="space-y-5">
      <section className="bg-card space-y-4 rounded-xl border p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Schema name
            <input
              className="bg-background mt-2 h-11 w-full rounded-md border px-3 font-mono"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
            />
          </label>
          <label className="text-sm font-medium">
            Description
            <input
              className="bg-background mt-2 h-11 w-full rounded-md border px-3"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
            />
          </label>
        </div>
        <p className="text-muted-foreground text-sm">
          Dot paths create nested objects. Append <code>[]</code> to create an
          array, for example <code>items[].name</code> or <code>tags[]</code>.
        </p>
      </section>

      <section className="bg-card space-y-4 rounded-xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Output fields</h2>
            <p className="text-muted-foreground text-sm">
              Up to 50 fields and five nesting levels.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={fields.length >= 50}
            onClick={() =>
              setFields((current) => [
                ...current,
                emptyField(`field-${Date.now()}-${current.length}`),
              ])
            }
          >
            <Plus /> Add field
          </Button>
        </div>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Path</th>
                <th className="p-3">Type</th>
                <th className="p-3">Required</th>
                <th className="p-3">Description</th>
                <th className="p-3">String enum</th>
                <th className="p-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr className="border-t" key={field.id}>
                  <td className="p-2">
                    <label className="sr-only" htmlFor={`${field.id}-path`}>
                      Field {index + 1} path
                    </label>
                    <input
                      id={`${field.id}-path`}
                      aria-label={`Field ${index + 1} path`}
                      className="bg-background h-10 w-full rounded-md border px-2 font-mono"
                      value={field.path}
                      onChange={(event) =>
                        updateField(field.id, { path: event.target.value })
                      }
                      placeholder="result.items[].name"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      aria-label={`Field ${index + 1} type`}
                      className="bg-background h-10 w-full rounded-md border px-2"
                      value={field.type}
                      onChange={(event) =>
                        updateField(field.id, {
                          type: event.target.value as StructuredFieldType,
                        })
                      }
                    >
                      {(
                        ["string", "integer", "number", "boolean"] as const
                      ).map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <input
                      aria-label={`Field ${index + 1} required`}
                      type="checkbox"
                      checked={field.required}
                      onChange={(event) =>
                        updateField(field.id, {
                          required: event.target.checked,
                        })
                      }
                    />
                  </td>
                  <td className="p-2">
                    <input
                      aria-label={`Field ${index + 1} description`}
                      className="bg-background h-10 w-full rounded-md border px-2"
                      value={field.description}
                      onChange={(event) =>
                        updateField(field.id, {
                          description: event.target.value,
                        })
                      }
                      maxLength={500}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      aria-label={`Field ${index + 1} enum values`}
                      className="bg-background h-10 w-full rounded-md border px-2"
                      value={field.enumValues}
                      onChange={(event) =>
                        updateField(field.id, {
                          enumValues: event.target.value,
                        })
                      }
                      placeholder="one, two, three"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove field ${index + 1}`}
                      onClick={() =>
                        setFields((current) =>
                          current.filter((item) => item.id !== field.id),
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result.errors.map((error) => (
          <p className="text-destructive text-sm" role="alert" key={error}>
            {error}
          </p>
        ))}
        {result.warnings.map((warning) => (
          <p
            className="text-sm text-amber-700 dark:text-amber-300"
            key={warning}
          >
            Review: {warning}
          </p>
        ))}
      </section>

      <section className="bg-card space-y-3 rounded-xl border p-5">
        <div>
          <h2 className="font-semibold">Sample response validation</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Validation runs locally and checks types, required fields, enums,
            arrays, nested objects, and unexpected properties.
          </p>
        </div>
        <label className="block text-sm font-medium">
          Sample JSON
          <textarea
            className="bg-background mt-2 min-h-64 w-full rounded-md border p-3 font-mono text-sm"
            value={sample}
            onChange={(event) => setSample(event.target.value)}
            spellCheck={false}
          />
        </label>
        {validation.parseError ? (
          <p className="text-destructive text-sm" role="alert">
            {validation.parseError}
          </p>
        ) : null}
        {!validation.parseError && sample.trim() ? (
          validation.issues.length ? (
            <ul
              className="space-y-1 text-sm"
              data-testid="schema-validation-errors"
            >
              {validation.issues.map((issue, index) => (
                <li className="text-destructive" key={`${issue.path}-${index}`}>
                  <code>{issue.path}</code>: {issue.message}
                </li>
              ))}
            </ul>
          ) : (
            <p
              className="text-sm text-emerald-700 dark:text-emerald-300"
              data-testid="schema-validation-success"
            >
              Sample matches the generated schema.
            </p>
          )
        ) : null}
      </section>
    </div>
  );

  const output = (
    <OutputPanel
      title="Generated configuration"
      emptyMessage="Add valid fields to generate a schema."
      isEmpty={!generated}
      toolbar={
        generated ? (
          <>
            <CopyButton label="Copy configuration" text={serialized} />
            <DownloadButton
              label="Download JSON"
              content={serialized}
              filename={`${name.trim() || "structured-output"}.json`}
              mimeType="application/json"
            />
          </>
        ) : null
      }
    >
      {generated ? (
        <div className="space-y-4" data-testid="structured-output-result">
          <label className="block text-sm font-medium">
            Export target
            <select
              className="bg-background mt-2 h-11 w-full rounded-md border px-3"
              value={provider}
              onChange={(event) => setProvider(event.target.value as Provider)}
            >
              <option value="json-schema">JSON Schema</option>
              <option value="openai">OpenAI Responses API</option>
              <option value="anthropic">Anthropic Messages API</option>
              <option value="google">Google Interactions API</option>
            </select>
          </label>
          <pre className="bg-muted max-h-[44rem] overflow-auto rounded-lg border p-4 font-mono text-sm whitespace-pre-wrap">
            {serialized}
          </pre>
          <p className="text-muted-foreground text-sm">
            Provider wrappers follow official documentation checked on
            2026-08-28. Provider-supported JSON Schema subsets can change; test
            the exported configuration against the selected model.
          </p>
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      output={output}
      toolbar={
        <>
          <ExampleButton onLoad={loadExample} />
          <ResetButton onReset={reset} />
        </>
      }
      instructions={[
        "Describe each leaf field with a dot path; [] creates array segments.",
        "Validate representative and intentionally invalid sample responses before integration.",
        "Export raw JSON Schema or a provider request wrapper, then confirm model-specific schema support.",
      ]}
      faqs={[
        {
          question: "Does this call an AI provider?",
          answer:
            "No. Schema generation, sample parsing, validation, copying, and downloads stay in the browser.",
        },
        {
          question: "Does a valid sample guarantee provider support?",
          answer:
            "No. It proves the sample matches this generated schema. Each provider and model may support a smaller JSON Schema subset.",
        },
        {
          question: "Why are additional properties disabled?",
          answer:
            "Strict output workflows are safer when unexpected keys are rejected. The builder applies additionalProperties: false to every generated object.",
        },
      ]}
    />
  );
}
