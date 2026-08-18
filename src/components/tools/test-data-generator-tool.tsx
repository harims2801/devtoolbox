"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { CodeTextarea } from "@/components/tools/code-textarea";
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
  DEFAULT_TEST_DATA_SCHEMA,
  exportTestData,
  generateTestData,
  parseTestDataSchema,
  type TestDataFormat,
} from "@/lib/test-data-tools";
const defaultSchema = JSON.stringify(DEFAULT_TEST_DATA_SCHEMA, null, 2);
export function TestDataGeneratorTool() {
  const tool = getToolById("fake-test-data-generator");
  if (!tool) throw new Error("Test data metadata is missing");
  const [count, setCount] = useState(10),
    [seed, setSeed] = useState(""),
    [format, setFormat] = useState<TestDataFormat>("json"),
    [schemaText, setSchemaText] = useState(defaultSchema),
    [dateStart, setDateStart] = useState("2020-01-01"),
    [dateEnd, setDateEnd] = useState("2030-12-31"),
    [numberMin, setNumberMin] = useState(0),
    [numberMax, setNumberMax] = useState(1000),
    [output, setOutput] = useState(""),
    [error, setError] = useState("");
  function generate() {
    try {
      const schema = parseTestDataSchema(schemaText),
        records = generateTestData({
          count,
          schema,
          seed: seed.trim(),
          dateStart,
          dateEnd,
          numberMin,
          numberMax,
        });
      setOutput(exportTestData(records, format, schema));
      setError("");
    } catch (caught) {
      setOutput("");
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not generate records.",
      );
    }
  }
  function reset() {
    setCount(10);
    setSeed("");
    setFormat("json");
    setSchemaText(defaultSchema);
    setDateStart("2020-01-01");
    setDateEnd("2030-12-31");
    setNumberMin(0);
    setNumberMax(1000);
    setOutput("");
    setError("");
  }
  const input = (
    <section className="space-y-4">
      <div className="bg-card grid gap-4 rounded-xl border p-5 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Records (1–1,000)
          <input
            aria-label="Record count"
            className="bg-background mt-2 h-10 w-full rounded-md border px-3"
            min={1}
            max={1000}
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <label className="text-sm font-medium">
          Seed (optional)
          <input
            aria-label="Test data seed"
            className="bg-background mt-2 h-10 w-full rounded-md border px-3"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Date start
          <input
            aria-label="Date start"
            className="bg-background mt-2 h-10 w-full rounded-md border px-3"
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Date end
          <input
            aria-label="Date end"
            className="bg-background mt-2 h-10 w-full rounded-md border px-3"
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Number minimum
          <input
            aria-label="Number minimum"
            className="bg-background mt-2 h-10 w-full rounded-md border px-3"
            type="number"
            value={numberMin}
            onChange={(e) => setNumberMin(Number(e.target.value))}
          />
        </label>
        <label className="text-sm font-medium">
          Number maximum
          <input
            aria-label="Number maximum"
            className="bg-background mt-2 h-10 w-full rounded-md border px-3"
            type="number"
            value={numberMax}
            onChange={(e) => setNumberMax(Number(e.target.value))}
          />
        </label>
      </div>
      <CodeTextarea
        label="Custom field schema"
        description="JSON object with up to 50 fields and 3 levels. Types: uuid, name, email, phone, address, company, date, boolean, number."
        value={schemaText}
        onChange={(e) => setSchemaText(e.target.value)}
        error={error}
      />
    </section>
  );
  const result = (
    <OutputPanel
      emptyMessage="Validate the schema and generate fictional records."
      isEmpty={!output}
      title={`Fictional ${format.toUpperCase()} records`}
      toolbar={
        <>
          <CopyButton text={output} disabled={!output} />
          <DownloadButton
            content={output}
            disabled={!output}
            filename={`fictional-test-data.${format === "jsonl" ? "jsonl" : format}`}
            mimeType={
              format === "csv"
                ? "text/csv;charset=utf-8"
                : "application/json;charset=utf-8"
            }
          />
        </>
      }
    >
      <pre
        data-testid="test-data-output"
        className="bg-muted/50 max-h-[36rem] overflow-auto rounded-lg p-4 text-xs leading-6 whitespace-pre-wrap"
      >
        {output}
      </pre>
    </OutputPanel>
  );
  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Schema and bounds"
      output={result}
      outputLabel="Export preview"
      toolbar={
        <>
          <label className="text-sm">
            Format{" "}
            <select
              aria-label="Export format"
              className="bg-background h-9 rounded-md border px-2"
              value={format}
              onChange={(e) => {
                setFormat(e.target.value as TestDataFormat);
                setOutput("");
              }}
            >
              <option value="json">JSON</option>
              <option value="jsonl">JSON Lines</option>
              <option value="csv">CSV</option>
            </select>
          </label>
          <Button onClick={generate}>
            <RefreshCw />
            Generate
          </Button>
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Choose a bounded batch, optional seed and ranges, validate the field
          schema, then generate and export explicitly fictional records.
        </p>
      }
      examples={[{ title: "API fixtures" }, { title: "CSV import testing" }]}
      faqs={[
        {
          question: "Does this use real people?",
          answer:
            "No. Names are numbered Test Person labels, emails use the reserved example.test domain, and phone/address values are intentionally fictional shapes.",
        },
        {
          question: "Can this verify identities?",
          answer:
            "No. This output is only for development fixtures and is not suitable for identity, verification, security, analytics, or production use.",
        },
      ]}
      seoContent={
        <p>
          Generate deterministic, explicitly fictional development records
          locally with strict schemas and JSON, JSON Lines, or correctly quoted
          CSV export.
        </p>
      }
    />
  );
}
