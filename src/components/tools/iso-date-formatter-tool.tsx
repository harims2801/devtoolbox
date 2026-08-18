"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
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
  describeRelativeInstant,
  parseIsoDate,
  type IsoDateResult,
} from "@/lib/iso-date-tools";

function copyRow(label: string, value: string) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <dt className="text-muted-foreground text-sm">{label}</dt>
        <dd className="mt-1 font-mono text-sm break-all">{value}</dd>
      </div>
      <CopyButton label={`Copy ${label}`} text={value} />
    </div>
  );
}

export function IsoDateFormatterTool() {
  const tool = getToolById("iso-date-formatter");
  if (!tool) throw new Error("ISO date formatter metadata is missing");
  const [value, setValue] = useState(""),
    [result, setResult] = useState<IsoDateResult>(),
    [error, setError] = useState("");

  function parse() {
    try {
      setResult(parseIsoDate(value));
      setError("");
    } catch (caught) {
      setResult(undefined);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not parse this value.",
      );
    }
  }

  function reset() {
    setValue("");
    setResult(undefined);
    setError("");
  }

  const input = (
    <section className="bg-card min-h-80 space-y-4 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        ISO 8601 value
        <input
          aria-label="ISO 8601 value"
          className="bg-background mt-2 h-11 w-full rounded-md border px-3 font-mono"
          placeholder="2026-07-22T12:30:00.125+05:30"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setResult(undefined);
            setError("");
          }}
        />
      </label>
      <p className="text-muted-foreground text-sm">
        Date-times require <code>Z</code> or an explicit offset. Date-only
        values are accepted but are not treated as midnight instants.
      </p>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );

  const output = (
    <OutputPanel
      emptyMessage="Enter a strict ISO date or zoned date-time to inspect it."
      isEmpty={!result}
      title="Normalized date"
    >
      {result ? (
        <div className="space-y-5" data-testid="iso-date-output">
          <div className="rounded-lg border p-4">
            <p className="font-medium">
              {result.kind === "date" ? "Calendar date" : "Valid instant"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {result.kind === "date"
                ? "No time or zone was supplied, so Unix and relative values do not apply."
                : `${describeRelativeInstant(result.unixMilliseconds)} · ${result.fractionalPrecision} fractional digits preserved`}
            </p>
          </div>
          <dl className="space-y-3">
            {result.kind === "date" ? (
              copyRow("Canonical date", result.canonical)
            ) : (
              <>
                {copyRow("Normalized UTC", result.utc)}
                {copyRow("Preserved offset", result.preservedOffset)}
                {copyRow(
                  "Local time",
                  new Date(result.unixMilliseconds).toLocaleString(undefined, {
                    dateStyle: "full",
                    timeStyle: "long",
                  }),
                )}
                {copyRow("Unix seconds", String(result.unixSeconds))}
                {copyRow("Unix milliseconds", String(result.unixMilliseconds))}
              </>
            )}
          </dl>
          <section>
            <h3 className="font-medium">Parsed components</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {Object.entries(result.components)
                .filter(([, component]) => component !== undefined)
                .map(([label, component]) => (
                  <div className="rounded-lg border p-3" key={label}>
                    <dt className="text-muted-foreground capitalize">
                      {label}
                    </dt>
                    <dd className="mt-1 font-mono">{component}</dd>
                  </div>
                ))}
            </dl>
          </section>
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="ISO value"
      output={output}
      outputLabel="Formats"
      toolbar={
        <>
          <Button onClick={parse}>Parse</Button>
          <Button
            variant="outline"
            onClick={() => {
              setValue(new Date().toISOString());
              setResult(undefined);
              setError("");
            }}
          >
            <Clock />
            Current instant
          </Button>
          <ExampleButton
            onLoad={() => {
              setValue("2024-02-29T23:45:12.123456789+05:30");
              setResult(undefined);
              setError("");
            }}
          />
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Paste a strict ISO 8601 value, parse it locally, then copy the UTC,
          offset-preserving, local, or Unix representation you need.
        </p>
      }
      examples={[{ title: "API timestamp" }, { title: "Calendar-only date" }]}
      faqs={[
        {
          question: "Why are zone-less date-times rejected?",
          answer:
            "A wall time without Z or an offset does not identify one instant and could silently change across environments.",
        },
        {
          question: "Is fractional precision retained?",
          answer:
            "Yes. Up to nine supplied fractional digits are preserved; the tool never pads extra fractional digits.",
        },
      ]}
      seoContent={
        <p>
          Parse strict ISO 8601 dates and instants locally, normalize offsets to
          UTC, preserve fractional precision, and inspect Unix and component
          values without ambiguous browser parsing.
        </p>
      }
    />
  );
}
