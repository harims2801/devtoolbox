"use client";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  DownloadButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import {
  countTextStats,
  generateLorem,
  type LoremFormat,
  type LoremUnit,
} from "@/lib/lorem-tools";

export function LoremIpsumTool() {
  const tool = getToolById("lorem-ipsum-generator");
  if (!tool) throw new Error("Lorem ipsum metadata is missing");
  const [unit, setUnit] = useState<LoremUnit>("paragraphs"),
    [count, setCount] = useState(3),
    [format, setFormat] = useState<LoremFormat>("text"),
    [opening, setOpening] = useState(true),
    [seed, setSeed] = useState(""),
    [output, setOutput] = useState(""),
    [plainText, setPlainText] = useState(""),
    [error, setError] = useState("");
  const stats = useMemo(() => countTextStats(plainText), [plainText]);
  function generate() {
    try {
      const result = generateLorem({
        unit,
        count,
        format,
        startWithLorem: opening,
        seed: seed.trim(),
      });
      setOutput(result.output);
      setPlainText(result.text);
      setError("");
    } catch (caught) {
      setOutput("");
      setPlainText("");
      setError(
        caught instanceof Error ? caught.message : "Could not generate text.",
      );
    }
  }
  function reset() {
    setUnit("paragraphs");
    setCount(3);
    setFormat("text");
    setOpening(true);
    setSeed("");
    setOutput("");
    setPlainText("");
    setError("");
  }
  const input = (
    <section
      aria-label="Lorem ipsum options"
      className="bg-card min-h-80 space-y-5 rounded-xl border p-5"
    >
      <label className="block text-sm font-medium">
        Unit
        <select
          aria-label="Generation unit"
          className="bg-background mt-2 h-10 w-full rounded-md border px-3"
          onChange={(e) => {
            const next = e.target.value as LoremUnit;
            setUnit(next);
            setCount(next === "paragraphs" ? 3 : next === "sentences" ? 5 : 50);
            setOutput("");
          }}
          value={unit}
        >
          <option value="words">Words</option>
          <option value="sentences">Sentences</option>
          <option value="paragraphs">Paragraphs</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Count
        <input
          aria-label="Generation count"
          className="bg-background mt-2 h-10 w-full rounded-md border px-3"
          min={1}
          max={unit === "words" ? 1000 : unit === "sentences" ? 100 : 50}
          onChange={(e) => setCount(Number(e.target.value))}
          type="number"
          value={count}
        />
      </label>
      <label className="block text-sm font-medium">
        Output
        <select
          aria-label="Output format"
          className="bg-background mt-2 h-10 w-full rounded-md border px-3"
          onChange={(e) => {
            setFormat(e.target.value as LoremFormat);
            setOutput("");
          }}
          value={format}
        >
          <option value="text">Plain text</option>
          <option value="html">HTML paragraphs</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          checked={opening}
          onChange={(e) => setOpening(e.target.checked)}
          type="checkbox"
        />
        Start with “Lorem ipsum”
      </label>
      <label className="block text-sm font-medium">
        Deterministic seed (optional)
        <input
          aria-label="Deterministic seed"
          className="bg-background mt-2 h-10 w-full rounded-md border px-3"
          onChange={(e) => setSeed(e.target.value)}
          placeholder="Leave blank for normal random mode"
          value={seed}
        />
      </label>
      <p className="text-muted-foreground text-xs">
        Bounds: 1–1,000 words, 1–100 sentences, or 1–50 paragraphs. A seed
        repeats the same fixture.
      </p>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </section>
  );
  const result = (
    <OutputPanel
      emptyMessage="Choose options and generate placeholder text."
      isEmpty={!output}
      title={`Generated ${format === "html" ? "HTML" : "text"}`}
      toolbar={
        <>
          <CopyButton disabled={!output} text={output} />
          <DownloadButton
            content={output}
            disabled={!output}
            filename={`lorem-ipsum.${format === "html" ? "html" : "txt"}`}
            mimeType={
              format === "html"
                ? "text/html;charset=utf-8"
                : "text/plain;charset=utf-8"
            }
          />
        </>
      }
    >
      <p
        className="text-muted-foreground mb-3 text-xs"
        data-testid="lorem-stats"
      >
        {stats.words} words · {stats.characters} Unicode characters
      </p>
      <pre
        className="bg-muted/50 max-h-[36rem] overflow-auto rounded-lg p-4 text-sm leading-7 whitespace-pre-wrap"
        data-testid="lorem-output"
      >
        {output}
      </pre>
    </OutputPanel>
  );
  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Options"
      output={result}
      outputLabel="Generated text"
      toolbar={
        <>
          <Button onClick={generate}>
            <RefreshCw />
            Generate
          </Button>
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Select a unit, bounded count, format, and optional seed, then
          generate, copy, or download the result.
        </p>
      }
      examples={[
        { title: "Repeatable UI fixtures" },
        { title: "Prototype page copy" },
      ]}
      faqs={[
        {
          question: "Is HTML input interpreted?",
          answer:
            "No input is accepted for content. HTML mode wraps app-generated, escaped paragraphs in simple p elements and displays the source as text.",
        },
        {
          question: "What does a seed do?",
          answer:
            "The same non-empty seed and options produce the same output for repeatable tests. Blank seeds use fresh browser randomness.",
        },
      ]}
      seoContent={
        <p>
          Generate bounded placeholder words, sentences, or paragraphs locally
          in plain text or escaped HTML, with optional repeatable seeds.
        </p>
      }
    />
  );
}
