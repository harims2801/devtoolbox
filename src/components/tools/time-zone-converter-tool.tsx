"use client";
import { useMemo, useState } from "react";
import { Plus, RefreshCw, X } from "lucide-react";
import { OutputPanel } from "@/components/tools/output-panel";
import { CopyButton, ResetButton } from "@/components/tools/tool-actions";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import {
  formatZonedInstant,
  getSupportedTimeZones,
  resolveZonedDateTime,
  type TimeDisambiguation,
} from "@/lib/time-zone-tools";
function nowLocal() {
  const date = new Date(),
    offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
export function TimeZoneConverterTool() {
  const tool = getToolById("time-zone-converter");
  if (!tool) throw new Error("Time zone metadata is missing");
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    zones = useMemo(() => getSupportedTimeZones(browserZone), [browserZone]);
  const [value, setValue] = useState(""),
    [source, setSource] = useState(browserZone),
    [destinations, setDestinations] = useState(["UTC"]),
    [disambiguation, setDisambiguation] = useState<
      TimeDisambiguation | undefined
    >(),
    [results, setResults] = useState<ReturnType<typeof formatZonedInstant>[]>(
      [],
    ),
    [error, setError] = useState(""),
    [ambiguous, setAmbiguous] = useState(false);
  function convert() {
    try {
      const resolution = resolveZonedDateTime(value, source, disambiguation);
      if (resolution.status === "nonexistent") {
        setError(
          "This local time does not exist because the clock moves forward for daylight saving time.",
        );
        setResults([]);
        setAmbiguous(false);
        return;
      }
      if (resolution.status === "ambiguous" && !resolution.instant) {
        setError(
          "This local time occurs twice. Choose the earlier or later offset before converting.",
        );
        setResults([]);
        setAmbiguous(true);
        return;
      }
      setResults(
        destinations.map((zone) =>
          formatZonedInstant(resolution.instant!, zone, navigator.language),
        ),
      );
      setError("");
      setAmbiguous(resolution.status === "ambiguous");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not convert this time.",
      );
      setResults([]);
    }
  }
  function reset() {
    setValue("");
    setSource(browserZone);
    setDestinations(["UTC"]);
    setDisambiguation(undefined);
    setResults([]);
    setError("");
    setAmbiguous(false);
  }
  const zoneList = (
    <datalist id="iana-time-zones">
      {zones.map((zone) => (
        <option key={zone} value={zone} />
      ))}
    </datalist>
  );
  const input = (
    <section className="bg-card min-h-80 space-y-5 rounded-xl border p-5">
      {zoneList}
      <label className="block text-sm font-medium">
        Local date and time
        <input
          aria-label="Local date and time"
          className="bg-background mt-2 h-10 w-full rounded-md border px-3"
          type="datetime-local"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setResults([]);
            setError("");
            setDisambiguation(undefined);
          }}
        />
      </label>
      <label className="block text-sm font-medium">
        Source IANA zone
        <input
          aria-label="Source time zone"
          className="bg-background mt-2 h-10 w-full rounded-md border px-3"
          list="iana-time-zones"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
      </label>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Destination zones</legend>
        {destinations.map((zone, index) => (
          <div className="flex gap-2" key={index}>
            <input
              aria-label={`Destination time zone ${index + 1}`}
              className="bg-background h-10 min-w-0 flex-1 rounded-md border px-3"
              list="iana-time-zones"
              value={zone}
              onChange={(e) =>
                setDestinations((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? e.target.value : item,
                  ),
                )
              }
            />
            {destinations.length > 1 ? (
              <Button
                aria-label={`Remove destination ${index + 1}`}
                size="icon"
                variant="ghost"
                onClick={() =>
                  setDestinations((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                <X />
              </Button>
            ) : null}
          </div>
        ))}
        <Button
          size="sm"
          variant="outline"
          disabled={destinations.length >= 5}
          onClick={() =>
            setDestinations((current) => [...current, browserZone])
          }
        >
          <Plus />
          Add destination
        </Button>
      </fieldset>
      {ambiguous || error.includes("occurs twice") ? (
        <fieldset>
          <legend className="text-sm font-medium">Repeated time choice</legend>
          <label className="mr-4 text-sm">
            <input
              type="radio"
              name="dst-choice"
              checked={disambiguation === "earlier"}
              onChange={() => setDisambiguation("earlier")}
            />{" "}
            Earlier offset
          </label>
          <label className="text-sm">
            <input
              type="radio"
              name="dst-choice"
              checked={disambiguation === "later"}
              onChange={() => setDisambiguation("later")}
            />{" "}
            Later offset
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
      emptyMessage="Enter a wall-clock time and convert it without silent DST adjustment."
      isEmpty={!results.length}
      title="Converted instant"
      toolbar={
        results.length ? (
          <CopyButton
            text={results
              .map(
                (result) =>
                  `${result.zone}: ${result.local} (${result.offset}) · ${result.iso}`,
              )
              .join("\n")}
          />
        ) : null
      }
    >
      <div className="space-y-3" data-testid="time-zone-output">
        {results.map((result) => (
          <article className="rounded-lg border p-4" key={result.zone}>
            <h3 className="font-medium">{result.zone}</h3>
            <dl className="mt-3 grid gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Local</dt>
                <dd>{result.local}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Offset</dt>
                <dd>{result.offset}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">ISO instant</dt>
                <dd className="break-all">{result.iso}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Localized</dt>
                <dd>{result.localized}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </OutputPanel>
  );
  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Source time"
      output={output}
      outputLabel="Destinations"
      toolbar={
        <>
          <Button onClick={convert}>Convert</Button>
          <Button
            variant="outline"
            onClick={() => {
              setValue(nowLocal());
              setSource(browserZone);
              setResults([]);
            }}
          >
            <RefreshCw />
            Use current time
          </Button>
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Enter the wall time and source IANA zone, add up to five destinations,
          resolve any repeated DST time explicitly, then convert and copy the
          single instant.
        </p>
      }
      examples={[
        { title: "Global meeting time" },
        { title: "DST migration checks" },
      ]}
      faqs={[
        {
          question: "What happens in a DST gap?",
          answer:
            "The tool rejects nonexistent wall times instead of moving them forward silently.",
        },
        {
          question: "What happens when a time repeats?",
          answer:
            "Both instants are detected and you must select the earlier or later offset before conversion.",
        },
      ]}
      seoContent={
        <p>
          Convert wall-clock times between IANA zones locally with explicit
          offsets, date rollover, and safe daylight-saving gap and overlap
          handling.
        </p>
      }
    />
  );
}
