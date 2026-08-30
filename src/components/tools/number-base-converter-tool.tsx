"use client";

import { useState } from "react";

import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import {
  convertNumberBases,
  type NumberBaseInput,
  type NumberBaseResult,
} from "@/lib/number-base-tools";

const examples: Record<NumberBaseInput, string> = {
  ascii: "DevToolbox!",
  binary: "0b01000010 01101001 01110100",
  decimal: "68 101 118",
  hexadecimal: "0x48 65 6C 6C 6F",
};

const outputFields = [
  ["Binary", "binary"],
  ["Decimal", "decimal"],
  ["Hexadecimal", "hexadecimal"],
  ["ASCII", "ascii"],
] as const;

export function NumberBaseConverterTool() {
  const tool = getToolById("hex-binary-decimal-ascii-converter");
  if (!tool) throw new Error("Number base converter metadata is missing");

  const [format, setFormat] = useState<NumberBaseInput>("hexadecimal");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<NumberBaseResult>();
  const [error, setError] = useState("");

  function convert() {
    try {
      setResult(convertNumberBases(input, format));
      setError("");
    } catch (caught) {
      setResult(undefined);
      setError(
        caught instanceof Error ? caught.message : "Could not convert input.",
      );
    }
  }

  const inputPanel = (
    <section className="bg-card min-h-80 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        Input format
        <select
          className="bg-background mt-2 h-10 w-full rounded-md border px-3"
          onChange={(event) => {
            setFormat(event.target.value as NumberBaseInput);
            setResult(undefined);
            setError("");
          }}
          value={format}
        >
          <option value="hexadecimal">Hexadecimal</option>
          <option value="binary">Binary</option>
          <option value="decimal">Decimal</option>
          <option value="ascii">ASCII text</option>
        </select>
      </label>
      <label className="mt-5 block text-sm font-medium">
        Values to convert
        <textarea
          aria-invalid={Boolean(error)}
          className="bg-background mt-2 min-h-48 w-full rounded-md border p-3 font-mono text-sm"
          onChange={(event) => {
            setInput(event.target.value);
            if (error) setError("");
          }}
          placeholder={
            format === "ascii"
              ? "Enter ASCII text"
              : "Separate multiple values with spaces, commas, or new lines"
          }
          value={input}
        />
      </label>
      {error ? (
        <p className="text-destructive mt-3 text-sm" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-muted-foreground mt-3 text-sm">
          Prefixes such as 0x and 0b are optional. Numeric inputs must be
          non-negative; ASCII output supports values from 0 through 127.
        </p>
      )}
    </section>
  );

  const outputPanel = (
    <OutputPanel
      emptyMessage="Convert input to see all four representations."
      isEmpty={!result}
      title={result ? `${result.valueCount} value(s) converted` : "Conversions"}
    >
      {result ? (
        <div className="space-y-3" data-testid="number-base-results">
          {outputFields.map(([label, key]) => (
            <article className="rounded-lg border p-4" key={key}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{label}</h3>
                <CopyButton label={`Copy ${label}`} text={result[key]} />
              </div>
              <pre
                className="bg-muted/50 mt-3 max-h-40 overflow-auto rounded-md p-3 text-sm break-all whitespace-pre-wrap"
                data-testid={`${key}-output`}
              >
                {result[key]}
              </pre>
            </article>
          ))}
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      examples={[
        {
          title: "Hex bytes to text",
          description: "Convert 48 65 6C 6C 6F to Hello.",
        },
        {
          title: "ASCII to numeric values",
          description: "Inspect the binary, decimal, and hex code for text.",
        },
      ]}
      faqs={[
        {
          question: "Does this support negative numbers?",
          answer:
            "No. The converter intentionally accepts non-negative integers so binary and hexadecimal output remain unambiguous.",
        },
        {
          question: "Why is some output unavailable as ASCII?",
          answer:
            "Standard ASCII contains only values 0 through 127. Larger numeric values still convert between binary, decimal, and hexadecimal.",
        },
      ]}
      input={inputPanel}
      inputLabel="Source values"
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Select the format of the values you are entering.</li>
          <li>
            Enter text or one or more space-, comma-, or line-separated numbers.
          </li>
          <li>Convert and copy any resulting representation.</li>
        </ol>
      }
      output={outputPanel}
      outputLabel="Converted values"
      seoContent={
        <p>
          Convert ASCII characters and non-negative integers between binary,
          decimal, and hexadecimal locally without sending input anywhere.
        </p>
      }
      tool={tool}
      toolbar={
        <>
          <Button onClick={convert} type="button">
            Convert
          </Button>
          <ExampleButton
            onLoad={() => {
              setInput(examples[format]);
              setResult(undefined);
              setError("");
            }}
          />
          <ResetButton
            onReset={() => {
              setFormat("hexadecimal");
              setInput("");
              setResult(undefined);
              setError("");
            }}
          />
        </>
      }
    />
  );
}
