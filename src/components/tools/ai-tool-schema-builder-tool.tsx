"use client";

import { useState, type ReactNode } from "react";
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
  buildAiToolSchemas,
  exportAiToolSchema,
  type ToolBehaviorHints,
  type ToolSchemaTarget,
} from "@/lib/ai-tool-schema-tools";
import type {
  StructuredField,
  StructuredFieldType,
} from "@/lib/structured-output-tools";

const exampleInputs: StructuredField[] = [
  {
    id: "city",
    path: "location.city",
    type: "string",
    required: true,
    description: "City name",
    enumValues: "",
  },
  {
    id: "country",
    path: "location.country_code",
    type: "string",
    required: true,
    description: "Two-letter country code",
    enumValues: "US, CA, GB, IN",
  },
  {
    id: "units",
    path: "units",
    type: "string",
    required: false,
    description: "Temperature units",
    enumValues: "celsius, fahrenheit",
  },
];

const exampleOutputs: StructuredField[] = [
  {
    id: "temperature",
    path: "temperature",
    type: "number",
    required: true,
    description: "Current temperature",
    enumValues: "",
  },
  {
    id: "conditions",
    path: "conditions",
    type: "string",
    required: true,
    description: "Current weather conditions",
    enumValues: "",
  },
];

const defaultHints: ToolBehaviorHints = {
  readOnly: true,
  destructive: false,
  idempotent: true,
  openWorld: true,
};

function blankField(id: string): StructuredField {
  return {
    id,
    path: "",
    type: "string",
    required: true,
    description: "",
    enumValues: "",
  };
}

function FieldEditor({
  label,
  fields,
  setFields,
  optional,
}: {
  label: string;
  fields: StructuredField[];
  setFields: (fields: StructuredField[]) => void;
  optional?: boolean;
}) {
  function update(id: string, change: Partial<StructuredField>) {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...change } : field,
      ),
    );
  }
  return (
    <section className="bg-card space-y-4 rounded-xl border p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{label}</h2>
          <p className="text-muted-foreground text-sm">
            {optional
              ? "Optional MCP structured-result schema."
              : "Dot paths create nested objects; [] creates arrays."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={fields.length >= 50}
          onClick={() =>
            setFields([
              ...fields,
              blankField(`${label}-${Date.now()}-${fields.length}`),
            ])
          }
        >
          <Plus /> Add {optional ? "output" : "input"}
        </Button>
      </div>
      {fields.length ? (
        <div className="overflow-auto rounded-lg border">
          <table className="w-full min-w-[870px] text-left text-sm">
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
                    <input
                      aria-label={`${label} field ${index + 1} path`}
                      className="bg-background h-10 w-full rounded-md border px-2 font-mono"
                      value={field.path}
                      onChange={(event) =>
                        update(field.id, { path: event.target.value })
                      }
                      placeholder="request.items[].id"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      aria-label={`${label} field ${index + 1} type`}
                      className="bg-background h-10 w-full rounded-md border px-2"
                      value={field.type}
                      onChange={(event) =>
                        update(field.id, {
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
                      aria-label={`${label} field ${index + 1} required`}
                      type="checkbox"
                      checked={field.required}
                      onChange={(event) =>
                        update(field.id, { required: event.target.checked })
                      }
                    />
                  </td>
                  <td className="p-2">
                    <input
                      aria-label={`${label} field ${index + 1} description`}
                      className="bg-background h-10 w-full rounded-md border px-2"
                      value={field.description}
                      onChange={(event) =>
                        update(field.id, { description: event.target.value })
                      }
                      maxLength={500}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      aria-label={`${label} field ${index + 1} enum values`}
                      className="bg-background h-10 w-full rounded-md border px-2"
                      value={field.enumValues}
                      onChange={(event) =>
                        update(field.id, { enumValues: event.target.value })
                      }
                      placeholder="one, two"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${label.toLowerCase()} field ${index + 1}`}
                      onClick={() =>
                        setFields(fields.filter((item) => item.id !== field.id))
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
      ) : (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
          {optional
            ? "No output schema will be exported."
            : "This tool accepts no arguments."}
        </p>
      )}
    </section>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <span className="text-sm">{children}</span>;
}

export function AiToolSchemaBuilderTool() {
  const tool = getToolById("ai-tool-schema-builder");
  if (!tool) throw new Error("AI tool schema builder metadata is missing");
  const [name, setName] = useState("get_weather"),
    [title, setTitle] = useState("Weather lookup"),
    [description, setDescription] = useState(
      "Get current weather for a city when the user asks about present conditions.",
    ),
    [inputFields, setInputFields] = useState(exampleInputs),
    [outputFields, setOutputFields] = useState(exampleOutputs),
    [strict, setStrict] = useState(true),
    [hints, setHints] = useState(defaultHints),
    [target, setTarget] = useState<ToolSchemaTarget>("openai"),
    definition = {
      name,
      title,
      description,
      inputFields,
      outputFields,
      strict,
      hints,
    },
    result = buildAiToolSchemas(definition),
    exported = result.inputSchema
      ? exportAiToolSchema(target, definition, result)
      : undefined,
    serialized = exported ? JSON.stringify(exported, null, 2) : "";

  function setHint(key: keyof ToolBehaviorHints, value: boolean) {
    setHints((current) => ({ ...current, [key]: value }));
  }

  function loadExample() {
    setName("get_weather");
    setTitle("Weather lookup");
    setDescription(
      "Get current weather for a city when the user asks about present conditions.",
    );
    setInputFields(exampleInputs);
    setOutputFields(exampleOutputs);
    setStrict(true);
    setHints(defaultHints);
    setTarget("openai");
  }

  function reset() {
    setName("my_tool");
    setTitle("");
    setDescription("");
    setInputFields([]);
    setOutputFields([]);
    setStrict(true);
    setHints({
      readOnly: false,
      destructive: false,
      idempotent: false,
      openWorld: false,
    });
    setTarget("openai");
  }

  const input = (
    <div className="space-y-5">
      <section className="bg-card space-y-4 rounded-xl border p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Tool name
            <input
              aria-label="Tool name"
              className="bg-background mt-2 h-11 w-full rounded-md border px-3 font-mono"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={128}
            />
          </label>
          <label className="text-sm font-medium">
            Display title
            <input
              aria-label="Display title"
              className="bg-background mt-2 h-11 w-full rounded-md border px-3"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
            />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Description
          <textarea
            aria-label="Tool description"
            className="bg-background mt-2 min-h-28 w-full rounded-md border p-3"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1024}
          />
        </label>
        <p className="text-muted-foreground text-sm">
          Describe when the model should call the tool, its limits, and what it
          returns. Never put secrets or executable instructions in a schema.
        </p>
      </section>
      <FieldEditor
        label="Input parameters"
        fields={inputFields}
        setFields={setInputFields}
      />
      <FieldEditor
        label="Output fields"
        fields={outputFields}
        setFields={setOutputFields}
        optional
      />
      <section className="bg-card space-y-3 rounded-xl border p-5">
        <h2 className="font-semibold">Behavior and safety hints</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2">
            <input
              aria-label="Read-only"
              type="checkbox"
              checked={hints.readOnly}
              onChange={(event) => setHint("readOnly", event.target.checked)}
            />
            <Hint>Read-only</Hint>
          </label>
          <label className="flex items-center gap-2">
            <input
              aria-label="Destructive"
              type="checkbox"
              checked={hints.destructive}
              onChange={(event) => setHint("destructive", event.target.checked)}
            />
            <Hint>May perform destructive updates</Hint>
          </label>
          <label className="flex items-center gap-2">
            <input
              aria-label="Idempotent"
              type="checkbox"
              checked={hints.idempotent}
              onChange={(event) => setHint("idempotent", event.target.checked)}
            />
            <Hint>Safe to repeat with identical arguments</Hint>
          </label>
          <label className="flex items-center gap-2">
            <input
              aria-label="Open world"
              type="checkbox"
              checked={hints.openWorld}
              onChange={(event) => setHint("openWorld", event.target.checked)}
            />
            <Hint>Interacts beyond a closed local domain</Hint>
          </label>
          <label className="flex items-center gap-2">
            <input
              aria-label="Strict OpenAI schema"
              type="checkbox"
              checked={strict}
              onChange={(event) => setStrict(event.target.checked)}
            />
            <Hint>OpenAI strict mode</Hint>
          </label>
        </div>
        <p className="text-muted-foreground text-sm">
          MCP annotations are untrusted behavioral hints, not an authorization
          or confirmation mechanism.
        </p>
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
    </div>
  );

  const output = (
    <OutputPanel
      title="Tool definition"
      emptyMessage="Add a valid name and description to export this tool."
      isEmpty={!exported}
      toolbar={
        exported ? (
          <>
            <CopyButton label="Copy tool definition" text={serialized} />
            <DownloadButton
              label="Download tool JSON"
              content={serialized}
              filename={`${name || "tool"}-${target}.json`}
              mimeType="application/json"
            />
          </>
        ) : null
      }
    >
      {exported ? (
        <div className="space-y-4" data-testid="ai-tool-schema-result">
          <label className="block text-sm font-medium">
            Export target
            <select
              aria-label="Export target"
              className="bg-background mt-2 h-11 w-full rounded-md border px-3"
              value={target}
              onChange={(event) =>
                setTarget(event.target.value as ToolSchemaTarget)
              }
            >
              <option value="openai">OpenAI Responses API</option>
              <option value="anthropic">Anthropic Messages API</option>
              <option value="mcp">Model Context Protocol</option>
            </select>
          </label>
          <pre className="bg-muted max-h-[48rem] overflow-auto rounded-lg border p-4 font-mono text-sm whitespace-pre-wrap">
            {serialized}
          </pre>
          <p className="text-muted-foreground text-sm">
            Formats follow official documentation checked on 2026-08-28.
            Revalidate provider constraints when integrating, and enforce
            permissions in the tool implementation.
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
        "Name the tool for one clear capability and describe when it should be called.",
        "Define bounded input parameters and, for MCP structured content, optional output fields.",
        "Review behavior hints, export the provider format, and validate again in the provider SDK.",
      ]}
      faqs={[
        {
          question: "Does this register or execute the tool?",
          answer:
            "No. It only builds JSON definitions locally. Your application must implement authentication, validation, confirmation, timeouts, and execution.",
        },
        {
          question: "Why are provider exports different?",
          answer:
            "OpenAI uses parameters on a function tool, Anthropic uses input_schema, and MCP tools use inputSchema plus optional outputSchema and annotations.",
        },
        {
          question: "Are MCP annotations security controls?",
          answer:
            "No. Clients must treat annotations as untrusted hints and independently enforce permissions and user confirmation.",
        },
      ]}
    />
  );
}
