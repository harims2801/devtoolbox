"use client";
import { useMemo, useState } from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
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
  diffJson,
  diffLines,
  diffStats,
  diffWords,
  jsonDiffReport,
  unifiedDiff,
} from "@/lib/diff-tools";

type Mode = "text" | "json";
type View = "unified" | "side";
type Granularity = "line" | "word";
const textExample = [
  "Hello world\nKeep this line\nRemove this",
  "Hello brave world\nKeep this line\nAdd this",
];
const jsonExample = [
  '{"user":{"name":"Ada","active":true},"roles":["admin"]}',
  '{"user":{"name":"Ada","active":"yes","city":"London"},"roles":["admin","editor"]}',
];

export function DiffCheckerTool() {
  const tool = getToolById("text-diff-checker");
  if (!tool) throw new Error("Diff metadata is missing");
  const [mode, setMode] = useState<Mode>("text"),
    [view, setView] = useState<View>("unified"),
    [granularity, setGranularity] = useState<Granularity>("line");
  const [original, setOriginal] = useState(textExample[0]!),
    [modified, setModified] = useState(textExample[1]!);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false),
    [ignoreCase, setIgnoreCase] = useState(false),
    [unorderedArrays, setUnorderedArrays] = useState(false),
    [ignoredPaths, setIgnoredPaths] = useState("");
  const [selected, setSelected] = useState(0);
  const result = useMemo(() => {
    try {
      if (mode === "json") {
        const differences = diffJson(original, modified, {
          unorderedArrays,
          ignoredPaths: ignoredPaths.split(","),
        });
        return { differences, error: "" };
      }
      const options = { ignoreWhitespace, ignoreCase };
      const lines =
        granularity === "line"
          ? diffLines(original, modified, options)
          : diffWords(original, modified, options);
      return {
        lines,
        stats: diffStats(lines),
        unified: unifiedDiff(original, modified, options),
        error: "",
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Could not compare inputs.",
      };
    }
  }, [
    mode,
    original,
    modified,
    unorderedArrays,
    ignoredPaths,
    ignoreWhitespace,
    ignoreCase,
    granularity,
  ]);
  function switchMode(next: Mode) {
    setMode(next);
    const sample = next === "json" ? jsonExample : textExample;
    setOriginal(sample[0]!);
    setModified(sample[1]!);
    setSelected(0);
  }
  function swap() {
    setOriginal(modified);
    setModified(original);
  }
  function load() {
    const sample = mode === "json" ? jsonExample : textExample;
    setOriginal(sample[0]!);
    setModified(sample[1]!);
  }
  const input = (
    <section
      aria-label="Diff input"
      className="bg-card min-h-80 rounded-xl border p-5"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm font-medium">
          Original
          <textarea
            className="bg-background mt-2 min-h-72 w-full rounded-md border p-3 font-mono text-sm"
            maxLength={500000}
            onChange={(e) => setOriginal(e.target.value)}
            value={original}
          />
        </label>
        <label className="text-sm font-medium">
          Modified
          <textarea
            className="bg-background mt-2 min-h-72 w-full rounded-md border p-3 font-mono text-sm"
            maxLength={500000}
            onChange={(e) => setModified(e.target.value)}
            value={modified}
          />
        </label>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Large comparisons are limited to keep the browser responsive. All
        content stays local.
      </p>
      {mode === "json" ? (
        <label className="mt-4 block text-sm font-medium">
          Ignored paths (comma-separated)
          <input
            className="bg-background mt-2 h-10 w-full rounded-md border px-3 font-mono"
            onChange={(e) => setIgnoredPaths(e.target.value)}
            placeholder="metadata.updatedAt, user.id"
            value={ignoredPaths}
          />
        </label>
      ) : null}
    </section>
  );
  const output = (
    <OutputPanel
      isEmpty={Boolean(result.error)}
      emptyMessage={result.error}
      title={mode === "json" ? "Semantic JSON differences" : "Text differences"}
      toolbar={
        mode === "json" && "differences" in result ? (
          <>
            <CopyButton
              text={jsonDiffReport(result.differences!)}
              label="Copy report"
            />
            <DownloadButton
              content={jsonDiffReport(result.differences!)}
              filename="json-diff-report.json"
              label="Export JSON"
              mimeType="application/json"
            />
          </>
        ) : "unified" in result ? (
          <>
            <CopyButton text={result.unified} label="Copy diff" />
            <DownloadButton
              content={result.unified!}
              filename="changes.diff"
              label="Download diff"
            />
          </>
        ) : null
      }
    >
      {mode === "text" && "lines" in result ? (
        <div data-testid="text-diff-output">
          <div className="mb-4 flex gap-3 text-sm">
            <span className="text-emerald-700">
              Added {result.stats?.added}
            </span>
            <span className="text-red-700">
              Removed {result.stats?.removed}
            </span>
            <span className="text-amber-700">
              Changed {result.stats?.changed}
            </span>
          </div>
          {view === "unified" ? (
            <div className="overflow-auto rounded-md border font-mono text-sm">
              {result.lines?.map((line, index) => (
                <div
                  className={
                    line.kind === "added"
                      ? "bg-emerald-100 text-emerald-950"
                      : line.kind === "removed"
                        ? "bg-red-100 text-red-950"
                        : ""
                  }
                  key={index}
                >
                  <span className="inline-block w-14 border-r px-2 text-right opacity-60">
                    {line.oldLine ?? line.newLine}
                  </span>
                  <span className="px-2">
                    {line.kind === "added"
                      ? "+"
                      : line.kind === "removed"
                        ? "-"
                        : " "}{" "}
                    {line.text}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {["Original", "Modified"].map((title, column) => (
                <div className="overflow-auto rounded-md border" key={title}>
                  <h3 className="border-b p-2 text-sm font-medium">{title}</h3>
                  {result.lines
                    ?.filter((line) =>
                      column === 0
                        ? line.kind !== "added"
                        : line.kind !== "removed",
                    )
                    .map((line, index) => (
                      <div
                        className={`p-2 font-mono text-sm ${line.kind === "added" ? "bg-emerald-100" : line.kind === "removed" ? "bg-red-100" : ""}`}
                        key={index}
                      >
                        {line.text}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
      {mode === "json" && "differences" in result ? (
        <div data-testid="json-diff-output">
          <div className="mb-4 flex items-center justify-between">
            <p>{result.differences?.length} differences</p>
            <div className="flex items-center gap-1">
              <Button
                disabled={!result.differences?.length}
                onClick={() => setSelected((i) => Math.max(0, i - 1))}
                size="sm"
                variant="outline"
              >
                <ChevronLeft />
                Previous
              </Button>
              <span className="text-sm">
                {result.differences?.length ? selected + 1 : 0}/
                {result.differences?.length}
              </span>
              <Button
                disabled={!result.differences?.length}
                onClick={() =>
                  setSelected((i) =>
                    Math.min((result.differences?.length ?? 1) - 1, i + 1),
                  )
                }
                size="sm"
                variant="outline"
              >
                Next
                <ChevronRight />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {result.differences?.map((difference, index) => (
              <div
                className={`rounded-md border p-3 ${index === selected ? "ring-ring ring-2" : ""}`}
                key={`${difference.path}-${index}`}
              >
                <div className="flex justify-between gap-3">
                  <code>{difference.path}</code>
                  <span className="text-xs uppercase">{difference.kind}</span>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <pre className="bg-red-50 p-2 text-xs whitespace-pre-wrap">
                    {JSON.stringify(difference.before, null, 2) ?? "—"}
                  </pre>
                  <pre className="bg-emerald-50 p-2 text-xs whitespace-pre-wrap">
                    {JSON.stringify(difference.after, null, 2) ?? "—"}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </OutputPanel>
  );
  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Original and modified"
      output={output}
      outputLabel="Differences"
      toolbar={
        <>
          <div className="bg-muted flex rounded-lg p-1">
            <Button
              aria-pressed={mode === "text"}
              onClick={() => switchMode("text")}
              size="sm"
              variant={mode === "text" ? "secondary" : "ghost"}
            >
              Plain text
            </Button>
            <Button
              aria-pressed={mode === "json"}
              onClick={() => switchMode("json")}
              size="sm"
              variant={mode === "json" ? "secondary" : "ghost"}
            >
              JSON semantic
            </Button>
          </div>
          {mode === "text" ? (
            <>
              <Button
                onClick={() =>
                  setGranularity((g) => (g === "line" ? "word" : "line"))
                }
                variant="outline"
              >
                {granularity === "line" ? "Line" : "Word"} level
              </Button>
              <Button
                onClick={() =>
                  setView((v) => (v === "unified" ? "side" : "unified"))
                }
                variant="outline"
              >
                {view === "unified" ? "Unified" : "Side-by-side"}
              </Button>
              <label className="text-sm">
                <input
                  checked={ignoreWhitespace}
                  className="mr-1"
                  onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                  type="checkbox"
                />
                Ignore whitespace
              </label>
              <label className="text-sm">
                <input
                  checked={ignoreCase}
                  className="mr-1"
                  onChange={(e) => setIgnoreCase(e.target.checked)}
                  type="checkbox"
                />
                Ignore case
              </label>
            </>
          ) : (
            <label className="text-sm">
              <input
                checked={unorderedArrays}
                className="mr-1"
                onChange={(e) => setUnorderedArrays(e.target.checked)}
                type="checkbox"
              />
              Arrays unordered
            </label>
          )}
          <Button onClick={swap} variant="outline">
            <ArrowLeftRight />
            Swap
          </Button>
          <ExampleButton onLoad={load} />
          <ResetButton
            onReset={() => {
              setOriginal("");
              setModified("");
            }}
          />
        </>
      }
      instructions={
        <p>
          Choose plain text for line or word changes, or JSON semantic mode to
          compare parsed values independently of formatting and key order.
        </p>
      }
      examples={[
        { title: "Configuration change" },
        { title: "Nested JSON update" },
      ]}
      faqs={[
        {
          question: "Is object key order ignored?",
          answer:
            "Yes. JSON mode compares parsed properties, not source formatting or key order.",
        },
        {
          question: "How are arrays compared?",
          answer:
            "By index by default, or as unordered semantic values when selected.",
        },
      ]}
      seoContent={
        <p>
          Compare text in unified or side-by-side views and inspect semantic
          JSON changes by property path. Inputs are rendered as text and
          processed only in your browser.
        </p>
      }
    />
  );
}
