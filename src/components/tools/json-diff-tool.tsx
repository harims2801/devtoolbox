"use client";

import { useMemo, useState } from "react";
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
  compareJsonDocuments,
  JsonDocumentError,
  jsonDiffReport,
  type JsonDiffResult,
} from "@/lib/json-diff-tools";

type View = "side" | "unified";
const example = [
  '{"user":{"name":"Ada","active":true},"roles":["admin"],"a/b":1}',
  '{"user":{"name":"Ada","active":"yes","city":"London"},"roles":["admin","editor"],"a/b":2}',
];

function display(value: unknown) {
  return value === undefined ? "—" : JSON.stringify(value, null, 2);
}

export function JsonDiffTool() {
  const tool = getToolById("json-diff-checker");
  if (!tool) throw new Error("JSON diff metadata is missing");
  const [original, setOriginal] = useState(""),
    [modified, setModified] = useState(""),
    [unorderedArrays, setUnorderedArrays] = useState(false),
    [view, setView] = useState<View>("side"),
    [filter, setFilter] = useState(""),
    [result, setResult] = useState<JsonDiffResult>(),
    [errors, setErrors] = useState<string[]>([]);

  const visible = useMemo(
    () =>
      result?.differences.filter((difference) =>
        difference.path
          .toLocaleLowerCase()
          .includes(filter.toLocaleLowerCase()),
      ) ?? [],
    [filter, result],
  );

  function compare() {
    const nextErrors: string[] = [];
    let nextResult: JsonDiffResult | undefined;
    try {
      nextResult = compareJsonDocuments(original, modified, {
        unorderedArrays,
      });
    } catch (caught) {
      if (caught instanceof JsonDocumentError) nextErrors.push(caught.message);
      else nextErrors.push("Could not compare these JSON documents.");
      try {
        JSON.parse(original);
      } catch {
        try {
          compareJsonDocuments(original, "null");
        } catch (detail) {
          if (
            detail instanceof JsonDocumentError &&
            !nextErrors.includes(detail.message)
          )
            nextErrors.push(detail.message);
        }
      }
      try {
        JSON.parse(modified);
      } catch {
        try {
          compareJsonDocuments("null", modified);
        } catch (detail) {
          if (
            detail instanceof JsonDocumentError &&
            !nextErrors.includes(detail.message)
          )
            nextErrors.push(detail.message);
        }
      }
    }
    setResult(nextResult);
    setErrors(nextErrors);
  }

  async function loadFile(
    file: File | undefined,
    side: "original" | "modified",
  ) {
    if (!file) return;
    const text = await file.text();
    if (side === "original") setOriginal(text);
    else setModified(text);
    setResult(undefined);
    setErrors([]);
  }

  function reset() {
    setOriginal("");
    setModified("");
    setUnorderedArrays(false);
    setView("side");
    setFilter("");
    setResult(undefined);
    setErrors([]);
  }

  const input = (
    <section className="bg-card min-h-80 space-y-4 rounded-xl border p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        {(["Original", "Modified"] as const).map((label) => {
          const side = label.toLocaleLowerCase() as "original" | "modified",
            text = side === "original" ? original : modified,
            setText = side === "original" ? setOriginal : setModified;
          return (
            <div key={label}>
              <label className="text-sm font-medium">
                {label} JSON
                <textarea
                  aria-label={`${label} JSON`}
                  className="bg-background mt-2 min-h-72 w-full rounded-md border p-3 font-mono text-sm"
                  maxLength={1_000_000}
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    setResult(undefined);
                    setErrors([]);
                  }}
                />
              </label>
              <label className="mt-2 inline-block text-sm">
                Upload {label.toLocaleLowerCase()}
                <input
                  accept="application/json,.json"
                  aria-label={`Upload ${label.toLocaleLowerCase()} JSON`}
                  className="ml-2 text-xs"
                  type="file"
                  onChange={(event) =>
                    void loadFile(event.target.files?.[0], side)
                  }
                />
              </label>
            </div>
          );
        })}
      </div>
      <label className="flex items-start gap-2 text-sm font-medium">
        <input
          className="mt-1"
          type="checkbox"
          checked={unorderedArrays}
          onChange={(event) => {
            setUnorderedArrays(event.target.checked);
            setResult(undefined);
          }}
        />
        <span>
          Compare arrays as unordered multisets
          <span className="text-muted-foreground block font-normal">
            Order is ignored, but duplicate counts still matter. JSON Patch is
            disabled in this mode.
          </span>
        </span>
      </label>
      {errors.map((error) => (
        <p className="text-destructive text-sm" key={error} role="alert">
          {error}
        </p>
      ))}
    </section>
  );

  const output = (
    <OutputPanel
      emptyMessage="Compare two valid JSON documents to see semantic changes."
      isEmpty={!result}
      title="Semantic differences"
      toolbar={
        result ? (
          <>
            {result.patch ? (
              <CopyButton
                label="Copy JSON Patch"
                text={JSON.stringify(result.patch, null, 2)}
              />
            ) : null}
            <DownloadButton
              content={jsonDiffReport(result)}
              filename="json-diff-report.json"
              label="Download report"
              mimeType="application/json"
            />
          </>
        ) : null
      }
    >
      {result ? (
        <div className="space-y-4" data-testid="json-diff-output">
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {Object.entries(result.summary).map(([kind, count]) => (
              <div className="rounded-lg border p-3" key={kind}>
                <span className="block text-xl font-semibold">{count}</span>
                <span className="text-muted-foreground capitalize">{kind}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="min-w-56 flex-1 text-sm font-medium">
              Filter by JSON Pointer
              <input
                className="bg-background mt-1 h-9 w-full rounded-md border px-3 font-mono"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
            </label>
            <div className="self-end rounded-md border p-1">
              <Button
                size="sm"
                variant={view === "side" ? "secondary" : "ghost"}
                onClick={() => setView("side")}
              >
                Side-by-side
              </Button>
              <Button
                size="sm"
                variant={view === "unified" ? "secondary" : "ghost"}
                onClick={() => setView("unified")}
              >
                Unified
              </Button>
            </div>
          </div>
          {result.patchUnavailableReason ? (
            <p className="text-muted-foreground text-sm">
              {result.patchUnavailableReason}
            </p>
          ) : null}
          <p className="text-sm">
            Showing {visible.length} of {result.differences.length} differences
          </p>
          <div className="space-y-3">
            {visible.map((difference, index) => (
              <article
                className="overflow-hidden rounded-lg border"
                key={`${difference.path}-${index}`}
              >
                <header className="bg-muted flex justify-between gap-3 px-3 py-2 text-sm">
                  <code>{difference.path || "(root)"}</code>
                  <span className="uppercase">{difference.kind}</span>
                </header>
                {view === "side" ? (
                  <div className="grid sm:grid-cols-2">
                    <pre className="overflow-auto border-b p-3 text-xs whitespace-pre-wrap sm:border-r sm:border-b-0">
                      {display(difference.before)}
                    </pre>
                    <pre className="overflow-auto p-3 text-xs whitespace-pre-wrap">
                      {display(difference.after)}
                    </pre>
                  </div>
                ) : (
                  <pre className="overflow-auto p-3 text-xs whitespace-pre-wrap">
                    <span className="text-red-700">
                      - {display(difference.before)}
                    </span>
                    {"\n"}
                    <span className="text-emerald-700">
                      + {display(difference.after)}
                    </span>
                  </pre>
                )}
              </article>
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
      inputLabel="JSON documents"
      output={output}
      outputLabel="Changes"
      toolbar={
        <>
          <Button onClick={compare}>Compare</Button>
          <ExampleButton
            onLoad={() => {
              setOriginal(example[0]!);
              setModified(example[1]!);
              setResult(undefined);
              setErrors([]);
            }}
          />
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Paste or upload two JSON documents, choose ordered or multiset array
          semantics, compare, filter by JSON Pointer, and export the report or
          safe RFC 6902 patch.
        </p>
      }
      examples={[
        { title: "API response regression" },
        { title: "Configuration review" },
      ]}
      faqs={[
        {
          question: "Does object key order matter?",
          answer: "No. Objects are compared by property name after parsing.",
        },
        {
          question: "When is JSON Patch unavailable?",
          answer:
            "Unordered-array mode removes positional meaning, so the tool does not claim a positional RFC 6902 patch is safe.",
        },
      ]}
      seoContent={
        <p>
          Compare JSON semantically in your browser with JSON Pointer paths,
          independent validation, ordered or multiset arrays, summary counts,
          and safe JSON Patch export.
        </p>
      }
    />
  );
}
