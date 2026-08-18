"use client";

import { useMemo, useState } from "react";
import {
  CopyButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { OutputPanel } from "@/components/tools/output-panel";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { getToolById } from "@/config/tool-registry";
import { caseFormats, convertCase, type CaseFormat } from "@/lib/case-tools";

export function CaseConverterTool() {
  const tool = getToolById("case-converter");
  if (!tool) throw new Error("Case converter metadata is missing");
  const [inputText, setInputText] = useState(""),
    [primary, setPrimary] = useState<CaseFormat>("camelCase"),
    conversions = useMemo(() => convertCase(inputText), [inputText]),
    primaryValue =
      conversions.find((item) => item.format === primary)?.value ?? "";

  const input = (
    <section className="bg-card min-h-80 space-y-4 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        Text to convert
        <textarea
          className="bg-background mt-2 min-h-72 w-full rounded-md border p-3 font-mono text-sm"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
        />
      </label>
      <p className="text-muted-foreground text-sm">
        Unicode letters are retained. Acronym, camel-case, digit, punctuation,
        and separator boundaries become tokens. Casing is locale-neutral.
      </p>
    </section>
  );

  const output = (
    <OutputPanel
      emptyMessage="Enter text to see every case conversion."
      isEmpty={!inputText}
      title="Case conversions"
      toolbar={
        inputText ? (
          <CopyButton label="Copy primary" text={primaryValue} />
        ) : null
      }
    >
      {inputText ? (
        <div className="space-y-3" data-testid="case-converter-output">
          {conversions.map((conversion) => (
            <article
              className="flex items-start gap-3 rounded-lg border p-3"
              key={conversion.format}
            >
              <label className="flex min-w-0 flex-1 gap-3">
                <input
                  aria-label={`Use ${conversion.format} as primary`}
                  className="mt-1"
                  type="radio"
                  name="primary-case"
                  checked={primary === conversion.format}
                  onChange={() => setPrimary(conversion.format)}
                />
                <span className="min-w-0">
                  <span className="text-muted-foreground block text-sm">
                    {conversion.format}
                  </span>
                  <code className="mt-1 block break-all">
                    {conversion.value}
                  </code>
                </span>
              </label>
              <CopyButton
                label={`Copy ${conversion.format}`}
                text={conversion.value}
              />
            </article>
          ))}
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Source text"
      output={output}
      outputLabel="All cases"
      toolbar={
        <>
          <ExampleButton
            onLoad={() => setInputText("XMLHttpRequest v2 API response")}
          />
          <ResetButton
            onReset={() => {
              setInputText("");
              setPrimary(caseFormats[0]);
            }}
          />
        </>
      }
      instructions={
        <p>
          Enter a name or phrase, review all conversions at once, choose a
          primary result, and copy any individual format.
        </p>
      }
      examples={[
        { title: "API identifier" },
        { title: "Human-readable heading" },
      ]}
      faqs={[
        {
          question: "How are acronyms handled?",
          answer:
            "A run such as XML before Http becomes its own token, producing xmlHttp in camel case.",
        },
        {
          question: "Are locale-specific casing rules used?",
          answer:
            "No. Results use deterministic Unicode default casing rather than the browser locale.",
        },
      ]}
      seoContent={
        <p>
          Convert text locally to camel, Pascal, snake, kebab, constant, dot,
          path, title, sentence, lower, and upper case with predictable Unicode
          tokenization.
        </p>
      }
    />
  );
}
