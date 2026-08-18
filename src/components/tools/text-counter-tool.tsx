"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { CopyButton, ResetButton } from "@/components/tools/tool-actions";
import { OutputPanel } from "@/components/tools/output-panel";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { getToolById } from "@/config/tool-registry";
import { countText, formatTextMetrics } from "@/lib/text-counter-tools";

export function TextCounterTool() {
  const tool = getToolById("text-counter");
  if (!tool) throw new Error("Text counter metadata is missing");
  const [inputText, setInputText] = useState(""),
    [wordsPerMinute, setWordsPerMinute] = useState(200),
    deferredText = useDeferredValue(inputText),
    metrics = useMemo(
      () => countText(deferredText, wordsPerMinute),
      [deferredText, wordsPerMinute],
    ),
    pending = deferredText !== inputText;

  async function loadFile(file: File | undefined) {
    if (file) setInputText(await file.text());
  }

  const input = (
    <section className="bg-card min-h-80 space-y-4 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        Text to measure
        <textarea
          className="bg-background mt-2 min-h-72 w-full rounded-md border p-3 font-mono text-sm"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
        />
      </label>
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm font-medium">
          Words per minute
          <input
            className="bg-background mt-1 block h-10 w-36 rounded-md border px-3"
            type="number"
            min={1}
            max={2000}
            value={wordsPerMinute}
            onChange={(event) =>
              setWordsPerMinute(Math.max(1, Number(event.target.value) || 1))
            }
          />
        </label>
        <label className="text-sm font-medium">
          Load text file
          <input
            className="mt-1 block text-xs"
            type="file"
            accept="text/*,.txt,.md,.log"
            onChange={(event) => void loadFile(event.target.files?.[0])}
          />
        </label>
      </div>
      {pending ? (
        <p className="text-muted-foreground text-xs">Updating counts…</p>
      ) : null}
    </section>
  );

  const cards = [
    [
      "Unicode code points",
      metrics.codePoints,
      "Unicode scalar values; most emoji count as one or more points.",
    ],
    [
      "UTF-16 code units",
      metrics.utf16Units,
      "JavaScript string length; supplementary characters use two units.",
    ],
    [
      "Grapheme clusters",
      metrics.graphemeClusters,
      metrics.graphemeSupported
        ? "User-perceived characters, including joined emoji and combining marks."
        : "Intl.Segmenter is unavailable; code-point fallback shown.",
    ],
    ["Words", metrics.words, "Locale-aware word-like segments."],
    ["Sentences", metrics.sentences, "Locale-aware sentence segments."],
    [
      "Lines",
      metrics.lines,
      "Logical lines; a trailing newline creates a final empty line.",
    ],
    [
      "Non-whitespace",
      metrics.nonWhitespace,
      "Code points excluding Unicode whitespace.",
    ],
    [
      "UTF-8 bytes",
      metrics.utf8Bytes,
      "Encoded network and file size without a byte-order mark.",
    ],
  ] as const;

  const output = (
    <OutputPanel
      isEmpty={false}
      title="Text metrics"
      toolbar={
        <CopyButton label="Copy summary" text={formatTextMetrics(metrics)} />
      }
    >
      <div className="space-y-5" data-testid="text-counter-output">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, help]) => (
            <article className="rounded-lg border p-4" key={label}>
              <p className="text-2xl font-semibold">{value}</p>
              <h3 className="mt-1 text-sm font-medium">{label}</h3>
              <p className="text-muted-foreground mt-1 text-xs">{help}</p>
            </article>
          ))}
        </div>
        <section className="rounded-lg border p-4 text-sm">
          <h3 className="font-medium">Whitespace and reading</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <dt className="text-muted-foreground">Whitespace</dt>
              <dd>{metrics.whitespace}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Spaces</dt>
              <dd>{metrics.spaces}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tabs</dt>
              <dd>{metrics.tabs}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Line breaks</dt>
              <dd>{metrics.lineBreaks}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Reading time</dt>
              <dd>{metrics.readingMinutes.toFixed(2)} min</dd>
            </div>
          </dl>
        </section>
      </div>
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Text"
      output={output}
      outputLabel="Counts"
      toolbar={
        <ResetButton
          onReset={() => {
            setInputText("");
            setWordsPerMinute(200);
          }}
        />
      }
      instructions={
        <p>
          Type, paste, or load a text file. Counts update locally; adjust
          reading speed to estimate duration without changing the text.
        </p>
      }
      examples={[
        { title: "Editorial word count" },
        { title: "Unicode payload size" },
      ]}
      faqs={[
        {
          question: "Why do emoji counts differ?",
          answer:
            "One visible emoji can contain several Unicode code points and even more UTF-16 units, while grapheme segmentation treats the sequence as one perceived character.",
        },
        {
          question: "How are trailing newlines counted?",
          answer:
            "Each line break starts another logical line, so text ending in a newline includes a final empty line.",
        },
      ]}
      seoContent={
        <p>
          Count Unicode code points, UTF-16 units, graphemes, words, sentences,
          lines, whitespace, and UTF-8 bytes locally with configurable
          reading-time estimates.
        </p>
      }
    />
  );
}
