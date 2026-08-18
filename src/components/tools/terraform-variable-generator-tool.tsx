"use client";
import { useMemo, useState } from "react";
import { FileCode2 } from "lucide-react";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  DownloadButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import {
  buildTerraformVariables,
  generateTerraformFiles,
  parseTerraformInput,
  type TerraformInputFormat,
  type TerraformVariable,
} from "@/lib/terraform-tools";
const sample =
  '{"service_name":"api","replicas":3,"enabled":true,"ports":[8080,8081],"database":{"host":"localhost","port":5432},"api-token":"example-secret"}';
export function TerraformVariableGeneratorTool() {
  const tool = getToolById("terraform-variable-generator");
  if (!tool) throw new Error("Terraform generator metadata is missing");
  const [input, setInput] = useState(sample),
    [format, setFormat] = useState<TerraformInputFormat>("json"),
    [overrides, setOverrides] = useState<
      Record<string, Partial<TerraformVariable>>
    >({}),
    [defaults, setDefaults] = useState(false),
    [environment, setEnvironment] = useState(true),
    [active, setActive] = useState<"variables" | "tfvars" | "json" | "env">(
      "variables",
    );
  const parsed = useMemo(() => {
    try {
      const base = buildTerraformVariables(parseTerraformInput(input, format));
      return {
        variables: base.map((v) => ({ ...v, ...overrides[v.name] })),
        error: "",
      };
    } catch (error) {
      return {
        variables: [],
        error:
          error instanceof Error ? error.message : "Could not parse input.",
      };
    }
  }, [input, format, overrides]);
  const files = generateTerraformFiles(parsed.variables, {
    valuesAsDefaults: defaults,
    includeEnvironment: environment,
  });
  const content =
      active === "variables"
        ? files.variablesTf
        : active === "tfvars"
          ? files.tfvars
          : active === "json"
            ? files.tfvarsJson
            : files.environment,
    filename =
      active === "variables"
        ? "variables.tf"
        : active === "tfvars"
          ? "terraform.tfvars"
          : active === "json"
            ? "terraform.tfvars.json"
            : "terraform.env";
  const update = (name: string, change: Partial<TerraformVariable>) =>
    setOverrides((values) => ({
      ...values,
      [name]: { ...values[name], ...change },
    }));
  return (
    <RegisteredToolLayout
      tool={tool}
      inputLabel="Example values"
      outputLabel="Terraform files"
      toolbar={
        <>
          <Button>
            <FileCode2 />
            Generate files
          </Button>
          <ExampleButton onLoad={() => setInput(sample)} />
          <ResetButton
            label="Clear"
            onReset={() => {
              setInput("");
              setOverrides({});
            }}
          />
        </>
      }
      input={
        <section
          aria-label="Terraform input"
          className="bg-card min-h-80 space-y-4 rounded-xl border p-5"
        >
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            Generated Terraform must be reviewed. Sensitive values remain local
            and are masked in environment previews.
          </div>
          <label htmlFor="terraform-format">Input format</label>
          <select
            id="terraform-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as TerraformInputFormat)}
          >
            <option value="json">JSON object</option>
            <option value="yaml">YAML object</option>
            <option value="key-value">Key-value form</option>
          </select>
          <textarea
            aria-label="Structured example values"
            className="bg-background min-h-60 w-full rounded border p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {parsed.error ? (
            <p role="alert" className="text-destructive">
              {parsed.error}
            </p>
          ) : null}
          <div className="space-y-3">
            {parsed.variables.map((v) => (
              <fieldset className="rounded border p-3" key={v.name}>
                <legend className="font-medium">{v.name}</legend>
                {v.warning ? (
                  <p className="text-sm text-amber-700">{v.warning}</p>
                ) : null}
                <label className="block text-sm">
                  Type{" "}
                  <input
                    className="ml-2 w-2/3 rounded border px-2 font-mono"
                    value={v.type}
                    onChange={(e) => update(v.name, { type: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  Description{" "}
                  <input
                    className="ml-2 rounded border px-2"
                    value={v.description ?? ""}
                    onChange={(e) =>
                      update(v.name, { description: e.target.value })
                    }
                  />
                </label>
                <label className="mr-4 text-sm">
                  <input
                    type="checkbox"
                    checked={v.sensitive}
                    onChange={(e) =>
                      update(v.name, { sensitive: e.target.checked })
                    }
                  />{" "}
                  Sensitive
                </label>
                <label className="mr-4 text-sm">
                  <input
                    type="checkbox"
                    checked={v.nullable}
                    onChange={(e) =>
                      update(v.name, { nullable: e.target.checked })
                    }
                  />{" "}
                  Nullable
                </label>
                <label className="text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(v.validation)}
                    onChange={(e) =>
                      update(v.name, { validation: e.target.checked })
                    }
                  />{" "}
                  Validation template
                </label>
              </fieldset>
            ))}
          </div>
        </section>
      }
      output={
        <OutputPanel
          title={filename}
          isEmpty={!content}
          toolbar={
            <>
              <CopyButton label={`Copy ${filename}`} text={content} />
              <DownloadButton
                content={content}
                filename={filename}
                label="Download"
              />
            </>
          }
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {(
              [
                ["variables", "variables.tf"],
                ["tfvars", "terraform.tfvars"],
                ["json", "terraform.tfvars.json"],
                ["env", "TF_VAR_ names"],
              ] as const
            ).map(([id, label]) => (
              <button
                className="rounded border px-2 py-1 text-sm"
                key={id}
                onClick={() => setActive(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <pre
            className="overflow-auto text-sm whitespace-pre-wrap"
            data-testid="terraform-output"
          >
            {content}
          </pre>
        </OutputPanel>
      }
      instructions={
        <div>
          <div className="flex gap-5">
            <label>
              <input
                type="checkbox"
                checked={defaults}
                onChange={(e) => setDefaults(e.target.checked)}
              />{" "}
              Put values in defaults instead of tfvars
            </label>
            <label>
              <input
                type="checkbox"
                checked={environment}
                onChange={(e) => setEnvironment(e.target.checked)}
              />{" "}
              Generate TF_VAR_ names
            </label>
          </div>
          <p className="mt-3">
            Primitive, list, map, object, and nested types are inferred. Null
            and empty collections are flagged for an explicit choice; mixed
            collections become review-required tuples. Invalid identifiers are
            sanitized with visible warnings.
          </p>
          <p className="mt-3">
            Mark secrets sensitive before sharing generated output. Terraform
            sensitive values can still appear in state; review storage and
            access controls.
          </p>
        </div>
      }
    />
  );
}
