"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  CopyButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { OutputPanel } from "@/components/tools/output-panel";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import {
  buildFullUrl,
  buildQueryString,
  pairsFromBulkJson,
  pairsToBulkJson,
  parseQueryString,
  type QueryPair,
  type SpaceEncoding,
} from "@/lib/query-string-tools";

type EditorRow = QueryPair & { id: number };
let nextId = 1;
const withIds = (pairs: QueryPair[]): EditorRow[] =>
  pairs.map((pair) => ({ ...pair, id: nextId++ }));
const example = "tag=one&tag=&flag&%5Bfilter%5D=caf%C3%A9&q=a%2Bb";

export function QueryStringBuilderTool() {
  const tool = getToolById("query-string-builder");
  if (!tool) throw new Error("Query string builder metadata is missing");
  const [source, setSource] = useState(""),
    [rows, setRows] = useState<EditorRow[]>([]),
    [mode, setMode] = useState<SpaceEncoding>("percent"),
    [base, setBase] = useState(""),
    [bulk, setBulk] = useState("[]"),
    [error, setError] = useState(""),
    [bulkError, setBulkError] = useState("");
  const generated = useMemo(() => {
    try {
      const query = buildQueryString(rows, mode),
        fullUrl = buildFullUrl(base, query);
      return { query, fullUrl, error: "" };
    } catch (caught) {
      return {
        query: "",
        fullUrl: "",
        error:
          caught instanceof Error
            ? caught.message
            : "The query could not be generated.",
      };
    }
  }, [base, mode, rows]);

  function loadPairs(pairs: QueryPair[]) {
    setRows(withIds(pairs));
    setBulk(pairsToBulkJson(pairs));
    setError("");
    setBulkError("");
  }

  function parseSource() {
    try {
      loadPairs(parseQueryString(source, mode));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The query could not be parsed.",
      );
    }
  }

  function updateRow(id: number, patch: Partial<QueryPair>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function moveRow(index: number, direction: -1 | 1) {
    setRows((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current],
        [row] = copy.splice(index, 1);
      copy.splice(target, 0, row!);
      return copy;
    });
  }

  function reset() {
    setSource("");
    setRows([]);
    setMode("percent");
    setBase("");
    setBulk("[]");
    setError("");
    setBulkError("");
  }

  const inputPanel = (
    <section className="bg-card min-h-80 space-y-5 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        Query string
        <textarea
          className="bg-background mt-2 min-h-24 w-full resize-y rounded-md border p-3 font-mono text-sm"
          placeholder="?tag=one&tag=two&empty="
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            setError("");
          }}
        />
      </label>
      <div className="flex flex-wrap items-end gap-3">
        <fieldset>
          <legend className="text-sm font-medium">Space encoding</legend>
          <div className="mt-2 flex gap-3">
            {(["percent", "plus"] as const).map((option) => (
              <label
                className="rounded-md border px-3 py-2 text-sm"
                key={option}
              >
                <input
                  checked={mode === option}
                  className="mr-2"
                  name="space-mode"
                  onChange={() => setMode(option)}
                  type="radio"
                />
                {option === "percent" ? "%20 (RFC-style)" : "+ (form-style)"}
              </label>
            ))}
          </div>
        </fieldset>
        <Button onClick={parseSource}>Parse into rows</Button>
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Ordered rows</h3>
          <Button
            onClick={() =>
              setRows((current) => [
                ...current,
                { id: nextId++, key: "", value: "", included: true },
              ])
            }
            size="sm"
            variant="outline"
          >
            <Plus /> Add row
          </Button>
        </div>
        {rows.length ? (
          <ol className="space-y-2">
            {rows.map((row, index) => (
              <li
                className="grid gap-2 rounded-lg border p-3 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto]"
                key={row.id}
              >
                <label className="flex items-center gap-2 text-sm">
                  <input
                    aria-label={`Include row ${index + 1}`}
                    checked={row.included}
                    onChange={(event) =>
                      updateRow(row.id, { included: event.target.checked })
                    }
                    type="checkbox"
                  />
                  Include
                </label>
                <input
                  aria-label={`Key ${index + 1}`}
                  className="bg-background h-10 rounded border px-2 font-mono text-sm"
                  placeholder="Key"
                  value={row.key}
                  onChange={(event) =>
                    updateRow(row.id, { key: event.target.value })
                  }
                />
                <div className="flex gap-2">
                  <input
                    aria-label={`Value ${index + 1}`}
                    className="bg-background h-10 min-w-0 flex-1 rounded border px-2 font-mono text-sm"
                    disabled={row.value === null}
                    placeholder={
                      row.value === null ? "Key only (no =)" : "Value"
                    }
                    value={row.value ?? ""}
                    onChange={(event) =>
                      updateRow(row.id, { value: event.target.value })
                    }
                  />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <input
                      aria-label={`Key only row ${index + 1}`}
                      checked={row.value === null}
                      onChange={(event) =>
                        updateRow(row.id, {
                          value: event.target.checked ? null : "",
                        })
                      }
                      type="checkbox"
                    />
                    No =
                  </label>
                </div>
                <div className="flex gap-1">
                  <Button
                    aria-label={`Move row ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => moveRow(index, -1)}
                    size="icon"
                    variant="ghost"
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    aria-label={`Move row ${index + 1} down`}
                    disabled={index === rows.length - 1}
                    onClick={() => moveRow(index, 1)}
                    size="icon"
                    variant="ghost"
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    aria-label={`Remove row ${index + 1}`}
                    onClick={() =>
                      setRows((current) =>
                        current.filter((item) => item.id !== row.id),
                      )
                    }
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground rounded-lg border p-4 text-sm">
            Parse a query or add a row.
          </p>
        )}
      </div>
      <label className="block text-sm font-medium">
        Base URL for Copy full URL{" "}
        <span className="text-muted-foreground font-normal">(optional)</span>
        <input
          className="bg-background mt-2 h-10 w-full rounded border px-3 font-mono text-sm"
          placeholder="https://example.com/search#results"
          value={base}
          onChange={(event) => setBase(event.target.value)}
        />
      </label>
    </section>
  );

  const outputPanel = (
    <OutputPanel
      title="Generated query"
      emptyMessage="The current included rows produce an empty query."
      isEmpty={false}
      toolbar={
        <>
          <CopyButton label="Copy query" text={generated.query} />
          {generated.fullUrl ? (
            <CopyButton label="Copy full URL" text={generated.fullUrl} />
          ) : null}
        </>
      }
    >
      <div className="space-y-5" data-testid="query-builder-output">
        {generated.error ? (
          <p className="text-destructive text-sm" role="alert">
            {generated.error}
          </p>
        ) : null}
        <section>
          <h3 className="font-semibold">Query string</h3>
          <pre className="bg-muted mt-2 min-h-14 overflow-auto rounded-lg border p-3 font-mono text-sm whitespace-pre-wrap">
            {generated.query || "(empty)"}
          </pre>
        </section>
        {generated.fullUrl ? (
          <section>
            <h3 className="font-semibold">Full URL</h3>
            <p className="mt-2 rounded-lg border p-3 font-mono text-sm break-all">
              {generated.fullUrl}
            </p>
          </section>
        ) : null}
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Bulk JSON pairs</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setBulk(pairsToBulkJson(rows));
                  setBulkError("");
                }}
                size="sm"
                variant="outline"
              >
                Export rows to JSON
              </Button>
              <CopyButton
                label="Copy pairs JSON"
                text={pairsToBulkJson(rows)}
              />
            </div>
          </div>
          <textarea
            aria-label="Bulk JSON pairs"
            className="bg-background min-h-40 w-full rounded-md border p-3 font-mono text-sm"
            value={bulk}
            onChange={(event) => {
              setBulk(event.target.value);
              setBulkError("");
            }}
          />
          <Button
            onClick={() => {
              try {
                loadPairs(pairsFromBulkJson(bulk));
              } catch (caught) {
                setBulkError(
                  caught instanceof Error
                    ? caught.message
                    : "Bulk JSON could not be loaded.",
                );
              }
            }}
          >
            Load rows from JSON
          </Button>
          {bulkError ? (
            <p className="text-destructive text-sm" role="alert">
              {bulkError}
            </p>
          ) : null}
          <p className="text-muted-foreground text-xs">
            Use <code>[key, null]</code> for a key without an equals sign and{" "}
            <code>[key, &quot;&quot;]</code> for an empty value. Duplicate pairs
            and order are retained.
          </p>
        </section>
      </div>
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={inputPanel}
      inputLabel="Query editor"
      output={outputPanel}
      outputLabel="Generated output"
      toolbar={
        <>
          <ExampleButton
            onLoad={() => {
              setSource(example);
              setMode("percent");
              loadPairs(parseQueryString(example, "percent"));
            }}
          />
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Paste a query and parse it into ordered rows, or build from scratch.
          Excluded rows remain editable but do not appear in generated output.
          The tool never opens or fetches the generated URL.
        </p>
      }
      examples={[{ title: "Repeated filters" }, { title: "Unicode search" }]}
      faqs={[
        {
          question: "How are duplicates represented in JSON?",
          answer:
            "Bulk JSON is an ordered array of two-item pairs, so duplicate and empty keys are preserved.",
        },
        {
          question: "What is the difference between space modes?",
          answer:
            "RFC-style mode encodes spaces as %20 and literal plus signs as %2B. Form-style mode encodes spaces as + while still encoding literal plus signs as %2B.",
        },
      ]}
      seoContent={
        <p>
          Edit ordered query pairs bidirectionally, preserve duplicate and empty
          entries, choose percent or plus space encoding, and generate a
          copyable URL without navigation.
        </p>
      }
    />
  );
}
