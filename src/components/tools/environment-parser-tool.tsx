"use client";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  convertEnvironment,
  DEFAULT_SENSITIVE_PATTERN,
  maskEnvironment,
  parseEnvironment,
  type EnvironmentFormat,
} from "@/lib/environment-tools";
const sample =
  '# Local example only\nPORT=3000\nNODE_ENV=production\nAPI_TOKEN=demo-token\nEMPTY=\nGREETING="Hello world"';
const formats: [EnvironmentFormat, string][] = [
  ["env", ".env"],
  ["json", "JSON"],
  ["yaml", "YAML"],
  ["shell", "Shell exports"],
  ["docker", "Docker Compose list"],
  ["configmap", "Kubernetes ConfigMap"],
  ["secret", "Kubernetes Secret"],
];
export function EnvironmentParserTool() {
  const tool = getToolById("environment-variable-parser");
  if (!tool) throw new Error("Environment parser metadata is missing");
  const [input, setInput] = useState(sample),
    [sourceFormat, setSourceFormat] = useState<EnvironmentFormat>("env"),
    [outputFormat, setOutputFormat] = useState<EnvironmentFormat>("json"),
    [sort, setSort] = useState(true),
    [showSecrets, setShowSecrets] = useState(false),
    [pattern, setPattern] = useState(DEFAULT_SENSITIVE_PATTERN),
    [name, setName] = useState("app-config");
  const result = useMemo(() => {
    try {
      const parsed = parseEnvironment(input, sourceFormat);
      const preview = showSecrets
        ? parsed.entries
        : maskEnvironment(parsed.entries, pattern);
      return {
        parsed,
        output: convertEnvironment(preview, outputFormat, { sort, name }),
        error: "",
      };
    } catch (caught) {
      return {
        error:
          caught instanceof Error
            ? caught.message
            : "Could not parse the input.",
      };
    }
  }, [input, sourceFormat, outputFormat, sort, showSecrets, pattern, name]);
  const inputPanel = (
    <section
      aria-label="Environment input"
      className="bg-card min-h-80 space-y-4 rounded-xl border p-5"
    >
      <div
        className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
        role="alert"
      >
        Avoid pasting production secrets unless necessary. Values are processed
        locally, never saved, logged, analyzed, or placed in URLs.
      </div>
      <label
        className="block text-sm font-medium"
        htmlFor="environment-source-format"
      >
        Input format
      </label>
      <select
        className="bg-background h-10 w-full rounded-md border px-3"
        id="environment-source-format"
        onChange={(e) => setSourceFormat(e.target.value as EnvironmentFormat)}
        value={sourceFormat}
      >
        {formats.slice(0, 6).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <label className="block text-sm font-medium" htmlFor="environment-input">
        Environment content
      </label>
      <textarea
        className="bg-background min-h-72 w-full rounded-md border p-3 font-mono text-sm"
        id="environment-input"
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
        value={input}
      />
      {"parsed" in result && result.parsed ? (
        <div className="space-y-1 text-sm">
          {result.parsed.errors.map((error) => (
            <p className="text-destructive" key={error}>
              {error}
            </p>
          ))}
          {result.parsed.duplicates.length ? (
            <p className="text-amber-700">
              Duplicate variables: {result.parsed.duplicates.join(", ")}
            </p>
          ) : null}
          <p className="text-muted-foreground">
            {result.parsed.entries.length} variables ·{" "}
            {result.parsed.comments.length} comments
          </p>
        </div>
      ) : null}
    </section>
  );
  const outputPanel = (
    <OutputPanel
      isEmpty={Boolean(result.error)}
      emptyMessage={result.error}
      title="Converted environment output"
      toolbar={
        "output" in result ? (
          <>
            <CopyButton label="Copy output" text={result.output} />
            <DownloadButton
              content={result.output!}
              filename={`environment.${outputFormat === "json" ? "json" : outputFormat === "env" ? "env" : "yaml"}`}
              label="Download"
            />
          </>
        ) : null
      }
    >
      {"output" in result ? (
        <div data-testid="environment-output">
          <pre className="max-h-[36rem] overflow-auto rounded-md border p-3 font-mono text-sm break-all whitespace-pre-wrap">
            {result.output}
          </pre>
        </div>
      ) : null}
    </OutputPanel>
  );
  return (
    <RegisteredToolLayout
      tool={tool}
      input={inputPanel}
      inputLabel="Variables"
      output={outputPanel}
      outputLabel="Converted"
      toolbar={
        <>
          <label className="text-sm font-medium">
            Output{" "}
            <select
              className="bg-background ml-2 h-9 rounded-md border px-2"
              onChange={(e) =>
                setOutputFormat(e.target.value as EnvironmentFormat)
              }
              value={outputFormat}
            >
              {formats.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Button
            onClick={() => setShowSecrets((value) => !value)}
            variant="outline"
          >
            {showSecrets ? <EyeOff /> : <Eye />}
            {showSecrets ? "Hide sensitive" : "Show sensitive"}
          </Button>
          <label className="text-sm">
            <input
              checked={sort}
              className="mr-1"
              onChange={(e) => setSort(e.target.checked)}
              type="checkbox"
            />
            Sort keys
          </label>
          <ExampleButton
            onLoad={() => {
              setInput(sample);
              setSourceFormat("env");
            }}
          />
          <ResetButton onReset={() => setInput("")} />
        </>
      }
      instructions={
        <div className="space-y-3">
          <p>
            Choose the input syntax, review validation and duplicates, select an
            output format, then copy or download the local conversion.
          </p>
          <label className="block">
            Sensitive-key regex
            <input
              className="bg-background mt-1 h-10 w-full rounded-md border px-3 font-mono"
              onChange={(e) => setPattern(e.target.value)}
              value={pattern}
            />
          </label>
          <label className="block">
            Kubernetes resource name
            <input
              className="bg-background mt-1 h-10 w-full rounded-md border px-3 font-mono"
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </label>
        </div>
      }
      examples={[
        { title: "Convert .env to JSON" },
        { title: "Create a ConfigMap manifest" },
      ]}
      faqs={[
        {
          question: "Are ConfigMaps suitable for secrets?",
          answer:
            "No. Kubernetes ConfigMaps are not designed for confidential data. Use a dedicated secret-management approach.",
        },
        {
          question: "Is Kubernetes Secret Base64 secure?",
          answer:
            "Base64 is encoding, not encryption. Access controls, encryption at rest, and external secret management are still required.",
        },
      ]}
      seoContent={
        <p>
          Parse comments, quotes, escapes, blank values, duplicates, and invalid
          names, then convert between dotenv, JSON, YAML, shell, Docker Compose,
          ConfigMap, and carefully labeled Secret output entirely in the
          browser.
        </p>
      }
    />
  );
}
