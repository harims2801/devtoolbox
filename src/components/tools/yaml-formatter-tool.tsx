"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeftRight, ArrowDownAZ, FileUp, ListTree } from "lucide-react";
import { toast } from "sonner";

import { CodeTextarea } from "@/components/tools/code-textarea";
import { JsonTreeView } from "@/components/tools/json-tree-view";
import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  DownloadButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import { formatByteSize, getByteSize, type JsonValue } from "@/lib/json-tools";
import {
  detectStructuredFormat,
  getStructuredSizeState,
  parseStructuredInput,
  renderStructuredOutput,
  YAML_MAX_BYTES,
  type StructuredDocumentStatistics,
  type StructuredFormat,
  type StructuredParseError,
} from "@/lib/yaml-tools";

const exampleYaml = `service:
  name: payments-api
  enabled: true
  replicas: 3
  regions:
    - ap-south-1
    - ca-central-1
---
maintenance:
  window: "Sunday 02:00 UTC"
  owners:
    - platform
    - sre`;

const statisticLabels: Array<[keyof StructuredDocumentStatistics, string]> = [
  ["documentCount", "Documents"],
  ["objectCount", "Objects"],
  ["arrayCount", "Arrays"],
  ["keyCount", "Keys"],
  ["stringCount", "Strings"],
  ["numberCount", "Numbers"],
  ["booleanCount", "Booleans"],
  ["nullCount", "Nulls"],
  ["maximumDepth", "Max depth"],
];

type InputFormat = StructuredFormat | "auto";
type ViewMode = "text" | "tree";

export function YamlFormatterTool() {
  const tool = getToolById("yaml-formatter-converter");
  if (!tool) throw new Error("YAML formatter metadata is missing");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [inputFormat, setInputFormat] = useState<InputFormat>("auto");
  const [outputFormat, setOutputFormat] = useState<StructuredFormat>("yaml");
  const [downloadExtension, setDownloadExtension] = useState<
    "yaml" | "yml" | "json"
  >("yaml");
  const [documents, setDocuments] = useState<JsonValue[]>([]);
  const [statistics, setStatistics] = useState<StructuredDocumentStatistics>();
  const [parseError, setParseError] = useState<StructuredParseError>();
  const [viewMode, setViewMode] = useState<ViewMode>("text");
  const sizeState = useMemo(() => getStructuredSizeState(input), [input]);
  const outputBytes = useMemo(() => getByteSize(output), [output]);
  const detectedFormat = useMemo(() => detectStructuredFormat(input), [input]);

  function clearResult() {
    setOutput("");
    setDocuments([]);
    setStatistics(undefined);
    setParseError(undefined);
    setViewMode("text");
  }

  function processInput({
    targetFormat,
    sortKeys = false,
  }: {
    targetFormat?: StructuredFormat;
    sortKeys?: boolean;
  } = {}) {
    const result = parseStructuredInput(input, inputFormat);
    if (!result.ok) {
      setParseError(result.error);
      setOutput("");
      setDocuments([]);
      setStatistics(undefined);
      return;
    }

    const resolvedTarget = targetFormat ?? result.format;
    const rendered = renderStructuredOutput(
      result.documents,
      resolvedTarget,
      sortKeys,
    );
    setOutput(rendered);
    setOutputFormat(resolvedTarget);
    setDownloadExtension(resolvedTarget === "json" ? "json" : "yaml");
    setDocuments(result.documents);
    setStatistics(result.statistics);
    setParseError(undefined);
    setViewMode("text");
    toast.success(
      targetFormat
        ? `Converted to ${targetFormat.toUpperCase()}`
        : sortKeys
          ? "Keys sorted safely"
          : `${result.format.toUpperCase()} formatted and validated`,
    );
  }

  async function loadFile(file: File | undefined) {
    if (!file) return;
    const extension = file.name.split(".").at(-1)?.toLocaleLowerCase();
    if (!["yaml", "yml", "json"].includes(extension ?? "")) {
      toast.error("Choose a .yaml, .yml, or .json file");
      return;
    }
    if (file.size > YAML_MAX_BYTES) {
      toast.error("File exceeds the 5 MB processing limit");
      return;
    }

    try {
      setInput(await file.text());
      setInputFormat(extension === "json" ? "json" : "yaml");
      clearResult();
      toast.success(`${file.name} loaded locally`);
    } catch {
      toast.error("Could not read this local file");
    }
  }

  const inputPanel = (
    <div
      className="rounded-xl"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void loadFile(event.dataTransfer.files[0]);
      }}
    >
      <input
        accept=".yaml,.yml,.json,application/json,application/yaml,text/yaml"
        className="sr-only"
        onChange={(event) => {
          void loadFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />
      <CodeTextarea
        description={`Input size: ${formatByteSize(sizeState.bytes)}. ${
          inputFormat === "auto"
            ? `Detected as ${detectedFormat.toUpperCase()}.`
            : `Parsing as ${inputFormat.toUpperCase()}.`
        } Drop a YAML or JSON file here.`}
        error={parseError?.message}
        label="YAML or JSON input"
        onChange={(event) => {
          setInput(event.target.value);
          if (parseError) setParseError(undefined);
        }}
        placeholder="Paste YAML or JSON here"
        toolbar={
          <>
            <span className="text-muted-foreground px-1 text-xs">
              {formatByteSize(sizeState.bytes)}
            </span>
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              type="button"
              variant="ghost"
            >
              <FileUp aria-hidden="true" />
              Open file
            </Button>
          </>
        }
        value={input}
      />
      {sizeState.message ? (
        <p
          className={
            sizeState.level === "error"
              ? "text-destructive mt-2 text-sm"
              : "text-muted-foreground mt-2 text-sm"
          }
          role={sizeState.level === "error" ? "alert" : undefined}
        >
          {sizeState.message}
        </p>
      ) : null}
      {parseError?.contextLine ? (
        <div className="bg-muted mt-3 overflow-x-auto rounded-lg p-3 font-mono text-xs">
          <p>Problem near line {parseError.line}</p>
          <pre>{parseError.contextLine}</pre>
          <pre aria-hidden="true">
            {" ".repeat(Math.max(parseError.column - 1, 0))}^
          </pre>
        </div>
      ) : null}
    </div>
  );

  const treeValue: JsonValue =
    documents.length === 1 ? (documents[0] ?? null) : documents;
  const outputPanel = (
    <OutputPanel
      emptyMessage="Format or convert valid YAML or JSON to see the result."
      isEmpty={!output}
      title={`Converted output · ${formatByteSize(outputBytes)}`}
      toolbar={
        output ? (
          <>
            <Button
              onClick={() => setViewMode("text")}
              size="sm"
              type="button"
              variant={viewMode === "text" ? "secondary" : "ghost"}
            >
              Text
            </Button>
            <Button
              onClick={() => setViewMode("tree")}
              size="sm"
              type="button"
              variant={viewMode === "tree" ? "secondary" : "ghost"}
            >
              <ListTree aria-hidden="true" />
              Tree
            </Button>
          </>
        ) : null
      }
    >
      {output ? (
        viewMode === "tree" ? (
          <div
            className="bg-muted/50 max-h-[32rem] overflow-auto rounded-lg p-4"
            data-testid="yaml-tree"
          >
            <JsonTreeView value={treeValue} />
          </div>
        ) : (
          <pre
            className="bg-muted/50 max-h-[32rem] overflow-auto rounded-lg p-4 text-sm leading-6 whitespace-pre-wrap"
            data-testid="yaml-output"
          >
            {output}
          </pre>
        )
      ) : null}
      {statistics ? (
        <dl className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {statisticLabels.map(([key, label]) => (
            <div className="bg-muted/50 rounded-lg p-2" key={key}>
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="mt-1 font-mono text-sm">{statistics[key]}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      examples={[
        {
          title: "Multi-document YAML",
          description:
            "Separate configuration documents with --- and inspect them together.",
        },
        {
          title: "JSON conversion",
          description:
            "Paste JSON, select JSON input, then convert it to readable YAML.",
        },
      ]}
      faqs={[
        {
          question: "Is my configuration uploaded?",
          answer:
            "No. Parsing, formatting, file reading, conversion, and downloads happen in this browser tab.",
        },
        {
          question: "How are aliases and custom tags handled?",
          answer:
            "Aliases have a strict expansion limit. Custom or execution-capable tags are rejected rather than instantiated.",
        },
      ]}
      input={inputPanel}
      inputLabel="YAML / JSON"
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Paste content or open a local YAML, YML, or JSON file.</li>
          <li>Select Auto detection or force the expected input format.</li>
          <li>Format in place, convert formats, or recursively sort keys.</li>
          <li>Review syntax errors, statistics, and the optional tree view.</li>
          <li>Copy the result or download it with the required extension.</li>
        </ol>
      }
      output={outputPanel}
      outputLabel={outputFormat.toUpperCase()}
      seoContent={
        <p>
          Validate and format YAML, convert YAML to JSON or JSON to YAML,
          inspect multiple documents, and review structure without sending
          configuration data to a server.
        </p>
      }
      tool={tool}
      toolbar={
        <>
          <label className="flex items-center gap-2 text-sm">
            <span>Input</span>
            <select
              aria-label="Input format"
              className="bg-background h-9 rounded-md border px-2"
              onChange={(event) =>
                setInputFormat(event.target.value as InputFormat)
              }
              value={inputFormat}
            >
              <option value="auto">Auto detect</option>
              <option value="yaml">YAML</option>
              <option value="json">JSON</option>
            </select>
          </label>
          <Button onClick={() => processInput()} type="button">
            Format & Validate
          </Button>
          <Button
            onClick={() =>
              processInput({
                targetFormat:
                  (inputFormat === "auto" ? detectedFormat : inputFormat) ===
                  "yaml"
                    ? "json"
                    : "yaml",
              })
            }
            type="button"
            variant="outline"
          >
            <ArrowLeftRight aria-hidden="true" />
            Convert
          </Button>
          <Button
            onClick={() => processInput({ sortKeys: true })}
            type="button"
            variant="outline"
          >
            <ArrowDownAZ aria-hidden="true" />
            Sort Keys
          </Button>
          <ExampleButton
            onLoad={() => {
              setInput(exampleYaml);
              setInputFormat("yaml");
              clearResult();
            }}
          />
          <ResetButton
            label="Clear"
            onReset={() => {
              setInput("");
              setInputFormat("auto");
              clearResult();
            }}
          />
          <CopyButton disabled={!output} text={output} />
          <label className="flex items-center gap-2 text-sm">
            <span>File</span>
            <select
              aria-label="Download extension"
              className="bg-background h-9 rounded-md border px-2"
              onChange={(event) =>
                setDownloadExtension(
                  event.target.value as "yaml" | "yml" | "json",
                )
              }
              value={downloadExtension}
            >
              <option value="yaml">.yaml</option>
              <option value="yml">.yml</option>
              <option value="json">.json</option>
            </select>
          </label>
          <DownloadButton
            content={output}
            disabled={!output}
            filename={`converted.${downloadExtension}`}
            mimeType={
              downloadExtension === "json"
                ? "application/json;charset=utf-8"
                : "application/yaml;charset=utf-8"
            }
          />
        </>
      }
    />
  );
}
