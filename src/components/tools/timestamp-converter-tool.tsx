"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Pause, Play } from "lucide-react";
import { toast } from "sonner";

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
  COMMON_TIME_ZONES,
  dateToTimestamps,
  formatDateOutputs,
  timestampToDate,
  toDateTimeLocalValue,
  type TimestampUnit,
} from "@/lib/timestamp-tools";

type ConverterMode = "timestamp-to-date" | "date-to-timestamp";

const outputLabels = [
  ["seconds", "Unix seconds"],
  ["milliseconds", "Unix milliseconds"],
  ["local", "Browser local time"],
  ["selectedZone", "Selected time zone"],
  ["utc", "UTC time"],
  ["iso", "ISO 8601"],
  ["rfc2822", "RFC 2822"],
  ["relative", "Relative time"],
] as const;

export function TimestampConverterTool() {
  const tool = getToolById("unix-timestamp-converter");
  if (!tool) throw new Error("Timestamp converter metadata is missing");

  const [mode, setMode] = useState<ConverterMode>("timestamp-to-date");
  const [timestampInput, setTimestampInput] = useState("");
  const [unit, setUnit] = useState<TimestampUnit>("auto");
  const [dateInput, setDateInput] = useState("");
  const [timeZone, setTimeZone] = useState("Asia/Kolkata");
  const [resultDate, setResultDate] = useState<Date>();
  const [detectedUnit, setDetectedUnit] = useState("");
  const [error, setError] = useState("");
  const [liveNow, setLiveNow] = useState(() => new Date(0));
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setLiveNow(new Date());
    if (paused) return;
    const interval = window.setInterval(() => setLiveNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, [paused]);

  const outputs = useMemo(
    () =>
      resultDate ? formatDateOutputs(resultDate, timeZone, liveNow) : undefined,
    [liveNow, resultDate, timeZone],
  );

  function clearResult() {
    setResultDate(undefined);
    setDetectedUnit("");
    setError("");
  }

  function convert() {
    try {
      if (mode === "timestamp-to-date") {
        const result = timestampToDate(timestampInput, unit);
        setResultDate(result.date);
        setDetectedUnit(result.detectedUnit);
      } else {
        const result = dateToTimestamps(dateInput, timeZone);
        setResultDate(result.date);
        setDetectedUnit("");
      }
      setError("");
      toast.success("Date and timestamp converted locally");
    } catch (caught) {
      setResultDate(undefined);
      setDetectedUnit("");
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not convert this value.",
      );
    }
  }

  function useCurrentTime() {
    const now = new Date();
    setLiveNow(now);
    if (mode === "timestamp-to-date") {
      setTimestampInput(String(Math.trunc(now.getTime() / 1000)));
      setUnit("seconds");
    } else {
      setDateInput(toDateTimeLocalValue(now, timeZone));
    }
    setResultDate(now);
    setError("");
  }

  const inputPanel = (
    <section
      aria-label="Timestamp converter input"
      className="bg-card min-h-80 rounded-xl border p-5"
    >
      <div className="border-b pb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs">Current Unix time</p>
            <p className="mt-1 font-mono text-lg" data-testid="live-timestamp">
              {Math.trunc(liveNow.getTime() / 1000)}
            </p>
          </div>
          <Button
            onClick={() => setPaused((current) => !current)}
            size="sm"
            type="button"
            variant="outline"
          >
            {paused ? (
              <Play aria-hidden="true" />
            ) : (
              <Pause aria-hidden="true" />
            )}
            {paused ? "Resume" : "Pause"}
          </Button>
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          Milliseconds: {liveNow.getTime()}
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {mode === "timestamp-to-date" ? (
          <>
            <label
              className="block text-sm font-medium"
              htmlFor="timestamp-input"
            >
              Unix timestamp
            </label>
            <input
              aria-describedby={error ? "timestamp-error" : undefined}
              aria-invalid={Boolean(error)}
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 font-mono outline-none focus-visible:ring-2"
              id="timestamp-input"
              inputMode="decimal"
              onChange={(event) => {
                setTimestampInput(event.target.value);
                if (error) setError("");
              }}
              placeholder="For example: 1714564800"
              value={timestampInput}
            />
            <label
              className="block text-sm font-medium"
              htmlFor="timestamp-unit"
            >
              Timestamp unit
            </label>
            <select
              className="bg-background h-11 w-full rounded-md border px-3"
              id="timestamp-unit"
              onChange={(event) => setUnit(event.target.value as TimestampUnit)}
              value={unit}
            >
              <option value="auto">Detect automatically</option>
              <option value="seconds">Seconds</option>
              <option value="milliseconds">Milliseconds</option>
            </select>
            {detectedUnit ? (
              <p className="text-muted-foreground text-xs">
                Detected as {detectedUnit}.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <label className="block text-sm font-medium" htmlFor="date-input">
              Date and time in selected zone
            </label>
            <input
              aria-describedby={error ? "timestamp-error" : undefined}
              aria-invalid={Boolean(error)}
              className="bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
              id="date-input"
              onChange={(event) => {
                setDateInput(event.target.value);
                if (error) setError("");
              }}
              step="1"
              type="datetime-local"
              value={dateInput}
            />
          </>
        )}

        <label className="block text-sm font-medium" htmlFor="time-zone">
          Preview time zone
        </label>
        <select
          className="bg-background h-11 w-full rounded-md border px-3"
          id="time-zone"
          onChange={(event) => setTimeZone(event.target.value)}
          value={timeZone}
        >
          {COMMON_TIME_ZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        <p className="text-muted-foreground text-xs leading-5">
          Time-zone output uses this browser’s IANA database. Server runtimes
          may use different zone data or defaults.
        </p>
        {error ? (
          <p
            className="text-destructive text-sm"
            id="timestamp-error"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );

  const outputPanel = (
    <OutputPanel
      emptyMessage="Convert a timestamp or date to see every supported format."
      isEmpty={!outputs}
      title="Converted date and time"
    >
      {outputs ? (
        <dl
          className="divide-y rounded-lg border"
          data-testid="timestamp-output"
        >
          {outputLabels.map(([key, label]) => (
            <div
              className="grid gap-2 p-3 sm:grid-cols-[9rem_1fr_auto] sm:items-center"
              key={key}
            >
              <dt className="text-muted-foreground text-sm">{label}</dt>
              <dd
                className="min-w-0 font-mono text-sm break-all"
                data-testid={`timestamp-${key}`}
              >
                {outputs[key]}
              </dd>
              <CopyButton label={`Copy ${label}`} text={outputs[key]} />
            </div>
          ))}
        </dl>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      examples={[
        {
          title: "Unix epoch",
          description:
            "Use 0 seconds to inspect 1 January 1970 in every format.",
        },
        {
          title: "Before 1970",
          description:
            "Negative timestamps correctly represent dates before the epoch.",
        },
      ]}
      faqs={[
        {
          question: "How does automatic unit detection work?",
          answer:
            "Absolute values of 100 billion or more are treated as milliseconds; smaller values are treated as seconds. Select the unit manually for unusual historical values.",
        },
        {
          question: "What is the Year 2038 problem?",
          answer:
            "Some older systems store Unix seconds in a signed 32-bit integer, which overflows on 19 January 2038. JavaScript dates and this converter are not limited to that 32-bit range.",
        },
      ]}
      input={inputPanel}
      inputLabel="Input"
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Select timestamp-to-date or date-to-timestamp mode.</li>
          <li>
            Choose automatic detection, seconds, or milliseconds where
            applicable.
          </li>
          <li>
            Select a time zone for previews and wall-clock date conversion.
          </li>
          <li>
            Copy any individual output or pause the live clock when comparing
            values.
          </li>
        </ol>
      }
      output={outputPanel}
      outputLabel="Formats"
      seoContent={
        <p>
          Convert Unix seconds, milliseconds, and zoned wall-clock dates into
          local, UTC, ISO 8601, RFC 2822, relative, and epoch formats entirely
          in the browser.
        </p>
      }
      tool={tool}
      toolbar={
        <>
          <div
            aria-label="Conversion direction"
            className="bg-muted flex rounded-lg p-1"
            role="group"
          >
            <Button
              aria-pressed={mode === "timestamp-to-date"}
              onClick={() => {
                setMode("timestamp-to-date");
                clearResult();
              }}
              size="sm"
              type="button"
              variant={mode === "timestamp-to-date" ? "secondary" : "ghost"}
            >
              Timestamp to date
            </Button>
            <Button
              aria-pressed={mode === "date-to-timestamp"}
              onClick={() => {
                setMode("date-to-timestamp");
                clearResult();
              }}
              size="sm"
              type="button"
              variant={mode === "date-to-timestamp" ? "secondary" : "ghost"}
            >
              Date to timestamp
            </Button>
          </div>
          <Button onClick={convert} type="button">
            <CalendarClock aria-hidden="true" />
            Convert
          </Button>
          <Button onClick={useCurrentTime} type="button" variant="outline">
            Use current time
          </Button>
          <ExampleButton
            onLoad={() => {
              setMode("timestamp-to-date");
              setTimestampInput("0");
              setUnit("seconds");
              clearResult();
            }}
          />
          <ResetButton
            label="Clear"
            onReset={() => {
              setTimestampInput("");
              setDateInput("");
              setUnit("auto");
              clearResult();
            }}
          />
        </>
      }
    />
  );
}
