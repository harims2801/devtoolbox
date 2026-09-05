"use client";

import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";

import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import { COMMON_TIME_ZONES } from "@/lib/timestamp-tools";
import {
  CRON_FIELDS,
  CRON_PRESETS,
  explainCron,
  nextCronRuns,
  parseCron,
} from "@/lib/cron-tools";

const defaultExpression = "0 9 * * 1-5";
type BuilderFields = [string, string, string, string, string];

function getBuilderFields(expression: string): BuilderFields | undefined {
  const parts = expression.trim().split(/\s+/);
  return parts.length === 5 ? (parts as BuilderFields) : undefined;
}

export function CronBuilderTool() {
  const tool = getToolById("cron-expression-builder");
  if (!tool) throw new Error("Cron builder metadata is missing");
  const [schedule, setSchedule] = useState(() => ({
    expression: defaultExpression,
    submitted: defaultExpression,
    builderFields: getBuilderFields(defaultExpression)!,
  }));
  const [timeZone, setTimeZone] = useState("UTC");
  const [error, setError] = useState("");
  const { builderFields, expression, submitted } = schedule;

  const result = useMemo(() => {
    try {
      const explanation = explainCron(submitted);
      const runs = nextCronRuns(submitted, { timeZone });
      return { explanation, runs };
    } catch (caught) {
      return {
        error:
          caught instanceof Error
            ? caught.message
            : "Could not evaluate this schedule.",
      };
    }
  }, [submitted, timeZone]);
  function evaluate() {
    try {
      const normalized = parseCron(expression).expression;
      nextCronRuns(normalized, { timeZone, count: 1 });
      setSchedule({
        expression: normalized,
        submitted: normalized,
        builderFields: getBuilderFields(normalized)!,
      });
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Invalid cron expression.",
      );
    }
  }

  function updateBuilder(index: number, value: string) {
    setSchedule((current) => {
      const fields = [...current.builderFields] as BuilderFields;
      fields[index] = value;
      const next = fields.map((field) => field.trim() || "*").join(" ");
      return { expression: next, submitted: next, builderFields: fields };
    });
    setError("");
  }

  const inputPanel = (
    <section
      aria-label="Cron input"
      className="bg-card min-h-80 rounded-xl border p-5"
    >
      <label className="block text-sm font-medium" htmlFor="cron-expression">
        Standard Unix cron expression
      </label>
      <input
        aria-describedby={error ? "cron-error" : "cron-help"}
        aria-invalid={Boolean(error)}
        className="bg-background focus-visible:ring-ring mt-2 h-12 w-full rounded-md border px-3 font-mono text-lg outline-none focus-visible:ring-2"
        id="cron-expression"
        onChange={(event) => {
          const next = event.target.value;
          setSchedule((current) => ({
            ...current,
            expression: next,
            builderFields: getBuilderFields(next) ?? current.builderFields,
          }));
          setError("");
        }}
        spellCheck={false}
        value={expression}
      />
      <p className="text-muted-foreground mt-2 text-xs" id="cron-help">
        minute · hour · day-of-month · month · day-of-week
      </p>
      {error ? (
        <p
          className="text-destructive mt-2 text-sm"
          id="cron-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        <p className="text-sm font-medium">Presets</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CRON_PRESETS.map(([label, value]) => (
            <Button
              key={value}
              onClick={() => {
                setSchedule({
                  expression: value,
                  submitted: value,
                  builderFields: getBuilderFields(value)!,
                });
                setError("");
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t pt-5">
        <p className="text-sm font-medium">Visual builder</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {CRON_FIELDS.map((field, index) => (
            <label className="text-muted-foreground text-xs" key={field.name}>
              {field.label}
              <input
                aria-label={`Builder ${field.label}`}
                className="bg-background text-foreground mt-1 h-10 w-full rounded-md border px-3 font-mono"
                onChange={(event) => updateBuilder(index, event.target.value)}
                placeholder={`${field.min}-${field.max} or *`}
                value={builderFields[index]}
              />
            </label>
          ))}
        </div>
      </div>

      <label
        className="mt-5 block text-sm font-medium"
        htmlFor="cron-time-zone"
      >
        Time zone for preview
      </label>
      <select
        className="bg-background mt-2 h-11 w-full rounded-md border px-3"
        id="cron-time-zone"
        onChange={(event) => setTimeZone(event.target.value)}
        value={timeZone}
      >
        {COMMON_TIME_ZONES.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </select>
      <p className="text-muted-foreground mt-2 text-xs">
        Cron time-zone behavior is environment-specific. Confirm how your
        scheduler configures its zone.
      </p>
    </section>
  );

  const outputPanel = (
    <OutputPanel
      isEmpty={Boolean(result.error)}
      emptyMessage={result.error}
      title="Schedule explanation and next runs"
      toolbar={<CopyButton label="Copy expression" text={submitted} />}
    >
      {"explanation" in result && result.explanation ? (
        <div data-testid="cron-output">
          <p className="text-lg font-semibold">{result.explanation.summary}</p>
          <p className="text-muted-foreground mt-1 text-sm">Using {timeZone}</p>
          <dl className="mt-5 grid gap-2 sm:grid-cols-2">
            {result.explanation.fields.map((description, index) => (
              <div className="rounded-md border p-3" key={description}>
                <dt className="font-mono text-xs">
                  {submitted.split(" ")[index]}
                </dt>
                <dd className="text-muted-foreground mt-1 text-sm">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-6 font-medium">Next 10 runs</h3>
          <ol
            className="mt-2 divide-y rounded-md border font-mono text-sm"
            data-testid="next-runs"
          >
            {result.runs?.map((run) => (
              <li className="px-3 py-2" key={run.toISOString()}>
                {new Intl.DateTimeFormat("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "long",
                  timeZone,
                }).format(run)}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      examples={[
        {
          title: "Weekday stand-up",
          description: "Run at 09:00 from Monday through Friday.",
        },
        {
          title: "Every five minutes",
          description: "Use steps to repeat throughout every hour.",
        },
      ]}
      faqs={[
        {
          question: "Which cron syntax is supported?",
          answer:
            "This tool supports standard five-field Unix cron with wildcards, lists, ranges, and steps. It does not claim support for Quartz, AWS, Kubernetes, seconds, years, or vendor-specific extensions.",
        },
        {
          question: "How are day-of-month and day-of-week combined?",
          answer:
            "Standard Unix cron runs when either restricted day field matches. When one is a wildcard, the other controls the day.",
        },
      ]}
      input={inputPanel}
      inputLabel="Build"
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Enter a five-field expression or choose a preset.</li>
          <li>Validate it and choose a preview time zone.</li>
          <li>Review each field and the next ten run times.</li>
        </ol>
      }
      output={outputPanel}
      outputLabel="Explain"
      seoContent={
        <p>
          Build and validate portable five-field Unix cron expressions locally.
          Inspect wildcards, lists, ranges, steps, day matching, and upcoming
          runs without sending schedule data to a server.
        </p>
      }
      tool={tool}
      toolbar={
        <>
          <Button onClick={evaluate} type="button">
            <CalendarClock aria-hidden="true" />
            Validate and explain
          </Button>
          <ExampleButton
            onLoad={() => {
              setSchedule({
                expression: defaultExpression,
                submitted: defaultExpression,
                builderFields: getBuilderFields(defaultExpression)!,
              });
              setError("");
            }}
          />
          <ResetButton
            onReset={() => {
              setSchedule({
                expression: "* * * * *",
                submitted: "* * * * *",
                builderFields: ["*", "*", "*", "*", "*"],
              });
              setTimeZone("UTC");
              setError("");
            }}
          />
        </>
      }
    />
  );
}
