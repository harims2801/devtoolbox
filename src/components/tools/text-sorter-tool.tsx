"use client";

import { useState } from "react";
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
  sortAndDeduplicateText,
  type DuplicatePolicy,
  type EmptyLineMode,
  type TextSortMode,
  type TextSortResult,
} from "@/lib/text-sort-tools";

export function TextSorterTool() {
  const tool = getToolById("text-sorter-deduplicator");
  if (!tool) throw new Error("Text sorter metadata is missing");
  const [inputText, setInputText] = useState(""),
    [result, setResult] = useState<TextSortResult>(),
    [mode, setMode] = useState<TextSortMode>("natural"),
    [direction, setDirection] = useState<"ascending" | "descending">(
      "ascending",
    ),
    [caseSensitive, setCaseSensitive] = useState(false),
    [trimBeforeCompare, setTrimBeforeCompare] = useState(false),
    [emptyLines, setEmptyLines] = useState<EmptyLineMode>("keep"),
    [removeDuplicates, setRemoveDuplicates] = useState(false),
    [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>("first"),
    [locale, setLocale] = useState(""),
    [error, setError] = useState("");

  function sort() {
    try {
      setResult(
        sortAndDeduplicateText(inputText, {
          mode,
          direction,
          caseSensitive,
          trimBeforeCompare,
          emptyLines,
          removeDuplicates,
          duplicatePolicy,
          locale,
        }),
      );
      setError("");
    } catch {
      setResult(undefined);
      setError("Enter a supported BCP 47 locale, such as en, de, or sv.");
    }
  }

  function reset() {
    setInputText("");
    setResult(undefined);
    setMode("natural");
    setDirection("ascending");
    setCaseSensitive(false);
    setTrimBeforeCompare(false);
    setEmptyLines("keep");
    setRemoveDuplicates(false);
    setDuplicatePolicy("first");
    setLocale("");
    setError("");
  }

  const input = (
    <section className="bg-card min-h-80 space-y-4 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        Lines to sort
        <textarea
          className="bg-background mt-2 min-h-72 w-full rounded-md border p-3 font-mono text-sm"
          value={inputText}
          onChange={(event) => {
            setInputText(event.target.value);
            setResult(undefined);
          }}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Sort mode
          <select
            className="bg-background mt-1 h-10 w-full rounded-md border px-3"
            value={mode}
            onChange={(event) => setMode(event.target.value as TextSortMode)}
          >
            <option value="lexical">Lexical (code point)</option>
            <option value="natural">
              Natural numeric (item2 before item10)
            </option>
            <option value="numeric">Numeric-only (non-numbers last)</option>
            <option value="locale">Locale-aware</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Direction
          <select
            className="bg-background mt-1 h-10 w-full rounded-md border px-3"
            value={direction}
            onChange={(event) =>
              setDirection(event.target.value as typeof direction)
            }
          >
            <option value="ascending">Ascending</option>
            <option value="descending">Descending</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Empty lines
          <select
            className="bg-background mt-1 h-10 w-full rounded-md border px-3"
            value={emptyLines}
            onChange={(event) =>
              setEmptyLines(event.target.value as EmptyLineMode)
            }
          >
            <option value="keep">Keep in normal order</option>
            <option value="first">Keep first</option>
            <option value="last">Keep last</option>
            <option value="remove">Remove</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Locale (optional)
          <input
            className="bg-background mt-1 h-10 w-full rounded-md border px-3"
            placeholder="en, de, sv"
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label>
          <input
            className="mr-1"
            type="checkbox"
            checked={caseSensitive}
            onChange={(event) => setCaseSensitive(event.target.checked)}
          />
          Case sensitive
        </label>
        <label>
          <input
            className="mr-1"
            type="checkbox"
            checked={trimBeforeCompare}
            onChange={(event) => setTrimBeforeCompare(event.target.checked)}
          />
          Trim before compare
        </label>
        <label>
          <input
            className="mr-1"
            type="checkbox"
            checked={removeDuplicates}
            onChange={(event) => setRemoveDuplicates(event.target.checked)}
          />
          Remove duplicates
        </label>
      </div>
      {removeDuplicates ? (
        <fieldset className="text-sm">
          <legend className="font-medium">Duplicate policy</legend>
          <label className="mr-4">
            <input
              type="radio"
              name="duplicate-policy"
              checked={duplicatePolicy === "first"}
              onChange={() => setDuplicatePolicy("first")}
            />{" "}
            Preserve first
          </label>
          <label>
            <input
              type="radio"
              name="duplicate-policy"
              checked={duplicatePolicy === "last"}
              onChange={() => setDuplicatePolicy("last")}
            />{" "}
            Preserve last
          </label>
        </fieldset>
      ) : null}
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );

  const output = (
    <OutputPanel
      emptyMessage="Sort the input to produce a separate output."
      isEmpty={!result}
      title="Sorted output"
      toolbar={
        result ? (
          <>
            <CopyButton text={result.output} />
            <DownloadButton
              content={result.output}
              filename="sorted-lines.txt"
            />
          </>
        ) : null
      }
    >
      {result ? (
        <div className="space-y-4" data-testid="text-sort-output">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>Input lines: {result.inputLines}</span>
            <span>Output lines: {result.outputLines}</span>
            <span>Duplicates removed: {result.duplicatesRemoved}</span>
            <span>Empty lines removed: {result.emptyLinesRemoved}</span>
          </div>
          <pre className="bg-muted min-h-72 overflow-auto rounded-lg border p-4 font-mono text-sm whitespace-pre-wrap">
            {result.output}
          </pre>
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Input lines"
      output={output}
      outputLabel="Sorted lines"
      toolbar={
        <>
          <Button onClick={sort}>Sort</Button>
          <ExampleButton
            onLoad={() => {
              setInputText("item10\nApple\nitem2\napple\n\nitem2");
              setResult(undefined);
            }}
          />
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Choose comparison, direction, whitespace, empty-line, and duplicate
          rules, then sort into a separate output. Equal comparison keys retain
          their original order.
        </p>
      }
      examples={[
        { title: "Natural filename order" },
        { title: "Unique normalized list" },
      ]}
      faqs={[
        {
          question: "Is the sort stable?",
          answer:
            "Yes. Lines with equal comparison keys keep their original relative order.",
        },
        {
          question: "Does trimming change output text?",
          answer:
            "No. Trimming affects comparison and duplicate detection only; retained lines are output exactly as entered.",
        },
      ]}
      seoContent={
        <p>
          Sort and deduplicate lines locally using lexical, natural numeric,
          numeric-only, or locale-aware comparison with stable ordering and
          explicit empty-line policies.
        </p>
      }
    />
  );
}
