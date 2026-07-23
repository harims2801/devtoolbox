"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlignLeft,
  ArrowDownAZ,
  FileUp,
  ListTree,
  Minimize2,
} from "lucide-react";
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
import {
  calculateJsonStatistics,
  formatByteSize,
  formatJson,
  getByteSize,
  getJsonSizeState,
  JSON_MAX_BYTES,
  minifyJson,
  parseJson,
  searchJson,
  sortJsonKeys,
  type JsonIndentation,
  type JsonParseError,
  type JsonStatistics,
  type JsonValue,
} from "@/lib/json-tools";
import { cn } from "@/lib/utils";

const exampleJson = `{
  "service": "payments-api",
  "version": 3,
  "healthy": true,
  "regions": ["ap-south-1", "ca-central-1"],
  "limits": {
    "requestsPerMinute": 1200,
    "burst": 50
  },
  "maintenanceWindow": null
}`;

type ProcessMode = "format" | "minify" | "sort";
type OutputMode = "text" | "tree";

const statisticLabels: Array<[keyof JsonStatistics, string]> = [
  ["objectCount", "Objects"],
  ["arrayCount", "Arrays"],
  ["keyCount", "Keys"],
  ["stringCount", "Strings"],
  ["numberCount", "Numbers"],
  ["booleanCount", "Booleans"],
  ["nullCount", "Nulls"],
  ["maximumDepth", "Max depth"],
];

export function JsonFormatterTool() {
  const tool = getToolById("json-formatter-validator");
  if (!tool) throw new Error("JSON formatter metadata is missing");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [parsedValue, setParsedValue] = useState<JsonValue>();
  const [parseError, setParseError] = useState<JsonParseError>();
  const [indentation, setIndentation] = useState<JsonIndentation>(2);
  const [outputMode, setOutputMode] = useState<OutputMode>("text");
  const [searchQuery, setSearchQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const sizeState = useMemo(() => getJsonSizeState(input), [input]);
  const outputBytes = useMemo(() => getByteSize(output), [output]);
  const statistics = useMemo(
    () =>
      parsedValue === undefined
        ? undefined
        : calculateJsonStatistics(parsedValue),
    [parsedValue],
  );
  const searchMatches = useMemo(
    () =>
      parsedValue === undefined ? [] : searchJson(parsedValue, searchQuery),
    [parsedValue, searchQuery],
  );

  function clearResult() {
    setOutput("");
    setParsedValue(undefined);
    setParseError(undefined);
    setSearchQuery("");
    setOutputMode("text");
  }

  function processJson(mode: ProcessMode) {
    if (!input.trim()) {
      setParseError({
        message: "Paste JSON or open a local .json file first.",
        position: 0,
        line: 1,
        column: 1,
        contextLine: "",
      });
      return;
    }

    if (sizeState.level === "error") {
      setParseError({
        message: sizeState.message,
        position: 0,
        line: 1,
        column: 1,
        contextLine: "",
      });
      return;
    }

    const result = parseJson(input);
    if (!result.ok) {
      setParseError(result.error);
      setOutput("");
      setParsedValue(undefined);
      return;
    }

    const value = mode === "sort" ? sortJsonKeys(result.value) : result.value;
    const nextOutput =
      mode === "minify" ? minifyJson(value) : formatJson(value, indentation);

    setParsedValue(value);
    setOutput(nextOutput);
    setParseError(undefined);
    setOutputMode("text");
    toast.success(
      mode === "minify"
        ? "JSON minified"
        : mode === "sort"
          ? "JSON keys sorted"
          : "JSON formatted and validated",
    );
  }

  async function loadFile(file: File | undefined) {
    if (!file) return;

    if (!file.name.toLocaleLowerCase().endsWith(".json")) {
      toast.error("Choose a file with a .json extension");
      return;
    }
    if (file.size > JSON_MAX_BYTES) {
      toast.error(
        `File exceeds the ${formatByteSize(JSON_MAX_BYTES)} processing limit`,
      );
      return;
    }

    try {
      const content = await file.text();
      setInput(content);
      clearResult();
      toast.success(`${file.name} loaded locally`);
    } catch {
      toast.error("Could not read this local file");
    }
  }

  const inputPanel = (
    <div
      className={cn(
        "rounded-xl",
        dragging && "ring-primary ring-2 ring-offset-2",
      )}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void loadFile(event.dataTransfer.files[0]);
      }}
    >
      <input
        accept=".json,application/json"
        className="sr-only"
        onChange={(event) => {
          void loadFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />
      <CodeTextarea
        description={`Input size: ${formatByteSize(sizeState.bytes)}. Drop a .json file here or use Open file.`}
        error={parseError?.message}
        label="JSON input"
        onChange={(event) => {
          setInput(event.target.value);
          if (parseError) setParseError(undefined);
        }}
        placeholder='Paste JSON here, for example: {"status":"ok"}'
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
      {sizeState.level === "warning" ? (
        <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          {sizeState.message}
        </p>
      ) : null}
      {parseError?.contextLine ? (
        <div className="bg-destructive/5 text-destructive mt-2 overflow-x-auto rounded-md border px-3 py-2 text-xs">
          <p>Problem near line {parseError.line}:</p>
          <pre className="mt-1">
            {parseError.contextLine}
            {"\n"}
            {" ".repeat(Math.max(parseError.column - 1, 0))}^
          </pre>
        </div>
      ) : null}
    </div>
  );

  const outputPanel = (
    <OutputPanel
      emptyMessage="Format, minify, or sort valid JSON to see output."
      isEmpty={parsedValue === undefined}
      title="JSON output"
      toolbar={
        <>
          <Button
            aria-pressed={outputMode === "text"}
            disabled={parsedValue === undefined}
            onClick={() => setOutputMode("text")}
            size="sm"
            variant={outputMode === "text" ? "secondary" : "ghost"}
          >
            <AlignLeft aria-hidden="true" />
            Text
          </Button>
          <Button
            aria-pressed={outputMode === "tree"}
            disabled={parsedValue === undefined}
            onClick={() => setOutputMode("tree")}
            size="sm"
            variant={outputMode === "tree" ? "secondary" : "ghost"}
          >
            <ListTree aria-hidden="true" />
            Tree
          </Button>
        </>
      }
    >
      {parsedValue !== undefined ? (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label className="min-w-48 flex-1">
              <span className="sr-only">Search JSON keys or values</span>
              <input
                className="bg-background focus-visible:outline-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Find keys or values..."
                value={searchQuery}
              />
            </label>
            <span className="text-muted-foreground text-xs">
              {searchQuery
                ? `${searchMatches.length} ${searchMatches.length === 1 ? "match" : "matches"}`
                : formatByteSize(outputBytes)}
            </span>
          </div>

          <div className="max-h-[32rem] overflow-auto rounded-lg border p-3">
            {outputMode === "tree" ? (
              <JsonTreeView query={searchQuery} value={parsedValue} />
            ) : (
              <pre
                className="font-mono text-sm leading-6 whitespace-pre"
                data-testid="json-output"
              >
                {output}
              </pre>
            )}
          </div>

          {statistics ? (
            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {statisticLabels.map(([key, label]) => (
                <div className="bg-muted/30 rounded-md border p-2" key={key}>
                  <dt className="text-muted-foreground text-xs">{label}</dt>
                  <dd className="mt-1 font-mono text-sm font-semibold">
                    {statistics[key]}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      examples={[
        {
          title: "API response",
          description: "Format an object with nested arrays and objects.",
        },
        {
          title: "Configuration file",
          description: "Sort keys for predictable reviews and diffs.",
        },
      ]}
      faqs={[
        {
          question: "Is my JSON uploaded?",
          answer:
            "No. Parsing, formatting, searching, statistics, and file reading happen entirely inside your browser.",
        },
        {
          question: "Does sorting change array order?",
          answer:
            "No. Sort Keys alphabetizes object keys recursively while preserving every array's original order.",
        },
        {
          question: "Why is there a file-size limit?",
          answer:
            "The limit protects the browser tab from becoming unresponsive when processing unusually large input.",
        },
      ]}
      input={inputPanel}
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Paste JSON, drop a .json file, or select Open file.</li>
          <li>Choose indentation and select Format, Minify, or Sort Keys.</li>
          <li>Inspect statistics or switch to Tree view to explore values.</li>
          <li>Copy the result or download it as a local .json file.</li>
        </ol>
      }
      output={outputPanel}
      seoContent={
        <p>
          This browser-based JSON formatter validates syntax, produces readable
          or minified output, sorts object keys, calculates structural
          statistics, and renders an optional searchable tree without executing
          or uploading JSON content.
        </p>
      }
      tool={tool}
      toolbar={
        <>
          <Button onClick={() => processJson("format")} type="button">
            <AlignLeft aria-hidden="true" />
            Format
          </Button>
          <Button
            onClick={() => processJson("minify")}
            type="button"
            variant="outline"
          >
            <Minimize2 aria-hidden="true" />
            Minify
          </Button>
          <Button
            onClick={() => processJson("sort")}
            type="button"
            variant="outline"
          >
            <ArrowDownAZ aria-hidden="true" />
            Sort Keys
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <span>Indent</span>
            <select
              aria-label="JSON indentation"
              className="bg-background focus-visible:outline-ring h-9 rounded-md border px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
              onChange={(event) => {
                const value = event.target.value;
                setIndentation(value === "tab" ? "tab" : value === "4" ? 4 : 2);
              }}
              value={String(indentation)}
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tabs</option>
            </select>
          </label>
          <ExampleButton
            onLoad={() => {
              setInput(exampleJson);
              clearResult();
            }}
          />
          <ResetButton
            label="Clear"
            onReset={() => {
              setInput("");
              clearResult();
            }}
          />
          <CopyButton disabled={!output} text={output} />
          <DownloadButton
            content={output}
            disabled={!output}
            filename="formatted.json"
            mimeType="application/json;charset=utf-8"
          />
        </>
      }
    />
  );
}
