"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
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
  exportUuidBatch,
  generateUuidBatch,
  validateUuidBatch,
} from "@/lib/uuid-tools";

type Format = "txt" | "csv" | "json";
export function UuidGeneratorTool() {
  const tool = getToolById("uuid-generator");
  if (!tool) throw new Error("UUID metadata is missing");
  const [count, setCount] = useState(10),
    [uppercase, setUppercase] = useState(false),
    [removeHyphens, setRemoveHyphens] = useState(false),
    [prefix, setPrefix] = useState(""),
    [suffix, setSuffix] = useState(""),
    [format, setFormat] = useState<Format>("txt"),
    [values, setValues] = useState<string[]>([]),
    [error, setError] = useState("");
  function generate() {
    try {
      setValues(
        generateUuidBatch({ count, uppercase, removeHyphens, prefix, suffix }),
      );
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not generate UUIDs.",
      );
    }
  }
  const validation = validateUuidBatch(values),
    exported = exportUuidBatch(values, format);
  const input = (
    <section
      aria-label="UUID options"
      className="bg-card min-h-80 space-y-4 rounded-xl border p-5"
    >
      <label className="block text-sm font-medium" htmlFor="uuid-count">
        Number of UUIDs (1–1,000)
      </label>
      <input
        className="bg-background h-11 w-full rounded-md border px-3"
        id="uuid-count"
        max={1000}
        min={1}
        onChange={(e) => setCount(Number(e.target.value))}
        type="number"
        value={count}
      />
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Prefix
          <input
            className="bg-background mt-2 h-10 w-full rounded-md border px-3"
            maxLength={50}
            onChange={(e) => setPrefix(e.target.value)}
            value={prefix}
          />
        </label>
        <label className="text-sm font-medium">
          Suffix
          <input
            className="bg-background mt-2 h-10 w-full rounded-md border px-3"
            maxLength={50}
            onChange={(e) => setSuffix(e.target.value)}
            value={suffix}
          />
        </label>
      </div>
      <label className="block text-sm">
        <input
          checked={uppercase}
          className="mr-2"
          onChange={(e) => setUppercase(e.target.checked)}
          type="checkbox"
        />
        Uppercase UUID characters
      </label>
      <label className="block text-sm">
        <input
          checked={removeHyphens}
          className="mr-2"
          onChange={(e) => setRemoveHyphens(e.target.checked)}
          type="checkbox"
        />
        Remove hyphens
      </label>
      <label className="block text-sm font-medium" htmlFor="uuid-format">
        Download format
      </label>
      <select
        className="bg-background h-10 w-full rounded-md border px-3"
        id="uuid-format"
        onChange={(e) => setFormat(e.target.value as Format)}
        value={format}
      >
        <option value="txt">TXT</option>
        <option value="csv">CSV</option>
        <option value="json">JSON</option>
      </select>
      <p className="text-muted-foreground text-xs">
        Generation uses the browser’s cryptographically secure{" "}
        <code>crypto.randomUUID()</code> API. Prefixes and formatting are
        applied after UUID v4 creation.
      </p>
    </section>
  );
  const output = (
    <OutputPanel
      isEmpty={!values.length}
      emptyMessage="Choose a count and generate UUID v4 values."
      title="Generated UUIDs"
      toolbar={
        <>
          <CopyButton
            disabled={!values.length}
            label="Copy all"
            text={values.join("\n")}
          />
          <DownloadButton
            content={exported}
            disabled={!values.length}
            filename={`uuids.${format}`}
            label={`Download ${format.toUpperCase()}`}
            mimeType={format === "json" ? "application/json" : "text/plain"}
          />
        </>
      }
    >
      <div data-testid="uuid-output">
        <div
          className={`mb-4 rounded-md border p-3 text-sm ${validation.isUnique ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}
        >
          {validation.isUnique
            ? `All ${validation.uniqueCount} UUIDs are unique within this batch.`
            : `Warning: only ${validation.uniqueCount} of ${validation.count} values are unique.`}
        </div>
        <ol className="max-h-[36rem] divide-y overflow-auto rounded-md border">
          {values.map((value, index) => (
            <li
              className="flex items-center gap-2 px-3 py-2"
              key={`${value}-${index}`}
            >
              <code className="min-w-0 flex-1 text-sm break-all">{value}</code>
              <CopyButton label={`Copy UUID ${index + 1}`} text={value} />
            </li>
          ))}
        </ol>
      </div>
    </OutputPanel>
  );
  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Generator options"
      output={output}
      outputLabel="UUID batch"
      toolbar={
        <>
          <Button onClick={generate}>
            <RefreshCw />
            Generate UUIDs
          </Button>
          <ExampleButton
            onLoad={() => {
              setCount(5);
              setPrefix("usr_");
              setSuffix("");
              setUppercase(false);
              setRemoveHyphens(false);
              setValues(generateUuidBatch({ count: 5, prefix: "usr_" }));
            }}
          />
          <ResetButton
            onReset={() => {
              setCount(10);
              setPrefix("");
              setSuffix("");
              setUppercase(false);
              setRemoveHyphens(false);
              setValues([]);
              setError("");
            }}
          />
        </>
      }
      instructions={
        <p>
          Select 1–1,000 values, apply optional display transformations,
          generate, then copy individual values or export the batch as TXT, CSV,
          or JSON.
        </p>
      }
      examples={[
        { title: "Database seed identifiers" },
        { title: "Prefixed public IDs" },
      ]}
      faqs={[
        {
          question: "Are these standards-compliant UUIDs?",
          answer:
            "Yes. The tool generates UUID version 4 with the browser’s standards-based cryptographically secure API. It does not imitate UUID v1, v5, or v7.",
        },
        {
          question: "Does uniqueness mean globally guaranteed?",
          answer:
            "No identifier scheme offers an absolute global guarantee. UUID v4 has 122 random bits and an extremely low collision probability; the tool additionally checks uniqueness inside each generated batch.",
        },
      ]}
      seoContent={
        <p>
          Generate secure UUID v4 batches locally with optional case, hyphen,
          prefix, and suffix formatting. The reusable batch engine is ready for
          future password, random string, fake-data, and Lorem Ipsum generators.
        </p>
      }
    />
  );
}
