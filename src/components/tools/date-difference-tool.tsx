"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
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
  calculateDateDifference,
  formatDateDifference,
  type DateDifferenceResult,
} from "@/lib/date-difference-tools";
import {
  getSupportedTimeZones,
  type TimeDisambiguation,
} from "@/lib/time-zone-tools";

interface EndpointState {
  value: string;
  zone: string;
  disambiguation?: TimeDisambiguation;
}

const emptyEndpoint = (): EndpointState => ({ value: "", zone: "UTC" });

function number(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(
    value,
  );
}

export function DateDifferenceTool() {
  const tool = getToolById("date-difference-calculator");
  if (!tool) throw new Error("Date difference metadata is missing");
  const zones = useMemo(() => getSupportedTimeZones(), []),
    [start, setStart] = useState<EndpointState>(emptyEndpoint),
    [end, setEnd] = useState<EndpointState>(emptyEndpoint),
    [dateOnly, setDateOnly] = useState(false),
    [inclusive, setInclusive] = useState(false),
    [result, setResult] = useState<DateDifferenceResult>(),
    [error, setError] = useState("");

  function calculate() {
    try {
      setResult(calculateDateDifference(start, end, { dateOnly, inclusive }));
      setError("");
    } catch (caught) {
      setResult(undefined);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not calculate this difference.",
      );
    }
  }

  function reset() {
    setStart(emptyEndpoint());
    setEnd(emptyEndpoint());
    setDateOnly(false);
    setInclusive(false);
    setResult(undefined);
    setError("");
  }

  function endpointFields(
    label: string,
    endpoint: EndpointState,
    setEndpoint: (value: EndpointState) => void,
  ) {
    return (
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-1 font-medium">{label}</legend>
        <label className="block text-sm font-medium">
          {dateOnly ? "Date" : "Local date and time"}
          <input
            aria-label={`${label} ${dateOnly ? "date" : "date and time"}`}
            className="bg-background mt-2 h-10 w-full rounded-md border px-3"
            type={dateOnly ? "date" : "datetime-local"}
            value={endpoint.value}
            onChange={(event) =>
              setEndpoint({ ...endpoint, value: event.target.value })
            }
          />
        </label>
        <label className="block text-sm font-medium">
          IANA time zone
          <input
            aria-label={`${label} time zone`}
            className="bg-background mt-2 h-10 w-full rounded-md border px-3"
            list="date-difference-time-zones"
            value={endpoint.zone}
            onChange={(event) =>
              setEndpoint({ ...endpoint, zone: event.target.value })
            }
          />
        </label>
        {!dateOnly ? (
          <label className="block text-sm font-medium">
            Repeated DST time
            <select
              aria-label={`${label} repeated time choice`}
              className="bg-background mt-2 h-10 w-full rounded-md border px-3"
              value={endpoint.disambiguation ?? ""}
              onChange={(event) =>
                setEndpoint({
                  ...endpoint,
                  disambiguation:
                    (event.target.value as TimeDisambiguation) || undefined,
                })
              }
            >
              <option value="">Require an explicit choice</option>
              <option value="earlier">Earlier occurrence</option>
              <option value="later">Later occurrence</option>
            </select>
          </label>
        ) : null}
      </fieldset>
    );
  }

  const input = (
    <section className="bg-card min-h-80 space-y-4 rounded-xl border p-5">
      <datalist id="date-difference-time-zones">
        {zones.map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={dateOnly}
          onChange={(event) => {
            setDateOnly(event.target.checked);
            setInclusive(false);
            setStart(emptyEndpoint());
            setEnd(emptyEndpoint());
            setResult(undefined);
          }}
        />
        Date-only inputs
      </label>
      {endpointFields("Start", start, setStart)}
      {endpointFields("End", end, setEnd)}
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          disabled={!dateOnly}
          checked={inclusive}
          onChange={(event) => setInclusive(event.target.checked)}
        />
        Include both boundary dates
      </label>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );

  const output = (
    <OutputPanel
      emptyMessage="Enter two dates to compare elapsed time and calendar units."
      isEmpty={!result}
      title="Difference"
      toolbar={
        result ? <CopyButton text={formatDateDifference(result)} /> : null
      }
    >
      {result ? (
        <div className="space-y-5" data-testid="date-difference-output">
          <section>
            <h3 className="font-medium">Elapsed duration</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Exact instant-to-instant totals. A DST day can be 23 or 25 hours.
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {(
                [
                  ["Milliseconds", result.milliseconds],
                  ["Seconds", result.seconds],
                  ["Minutes", result.minutes],
                  ["Hours", result.hours],
                  ["Days (24 hours)", result.days],
                ] satisfies [string, number][]
              ).map(([label, value]) => (
                <div className="rounded-lg border p-3" key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-mono break-all">{number(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h3 className="font-medium">Calendar difference</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Compares the entered calendar dates with month-end clamping; it is
              not a fixed-duration conversion.
            </p>
            <p className="mt-3 rounded-lg border p-4 font-mono">
              {result.calendar.years} years, {result.calendar.months} months,{" "}
              {result.calendar.days} days
            </p>
            {result.inclusiveCalendarDays !== undefined ? (
              <p className="mt-3 text-sm">
                Inclusive calendar span: {result.inclusiveCalendarDays} days
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Dates"
      output={output}
      outputLabel="Duration"
      toolbar={
        <>
          <Button onClick={calculate}>Calculate</Button>
          <Button
            variant="outline"
            onClick={() => {
              setStart(end);
              setEnd(start);
              setResult(undefined);
            }}
          >
            <ArrowLeftRight />
            Swap
          </Button>
          <ExampleButton
            onLoad={() => {
              setDateOnly(false);
              setInclusive(false);
              setStart({
                value: "2024-03-09T12:00",
                zone: "America/New_York",
              });
              setEnd({
                value: "2024-03-10T12:00",
                zone: "America/New_York",
              });
              setResult(undefined);
              setError("");
            }}
          />
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Enter two wall times and their IANA zones. Negative totals mean the
          end precedes the start. Use date-only mode for inclusive date ranges.
        </p>
      }
      examples={[
        { title: "DST-aware elapsed time" },
        { title: "Inclusive project dates" },
      ]}
      faqs={[
        {
          question: "Why can one calendar day be 23 or 25 hours?",
          answer:
            "Daylight-saving transitions change the UTC offset. Elapsed totals use actual instants, while calendar units use entered dates.",
        },
        {
          question: "How are month ends handled?",
          answer:
            "Calendar months clamp to the final valid day, so January 31 to February 29 can be one calendar month.",
        },
      ]}
      seoContent={
        <p>
          Calculate signed elapsed totals and calendar-aware date differences
          locally with IANA time zones, DST safety, leap years, and inclusive
          date ranges.
        </p>
      }
    />
  );
}
