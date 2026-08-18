"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Link as LinkIcon, Search } from "lucide-react";
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
import { filterLogs, logStats, parseLogs } from "@/lib/log-tools";

const sample =
  '{"timestamp":"2026-08-18T08:00:00Z","level":"info","service":"api","message":"Started request","request_id":"req-1"}\n{"timestamp":"2026-08-18T08:00:01Z","level":"error","service":"api","message":"Database timeout","trace_id":"trace-9"}\nmalformed json line';

export function LogAnalyzerTool() {
  const tool = getToolById("log-formatter-analyzer");
  if (!tool) throw new Error("Log analyzer metadata is missing");
  const [input, setInput] = useState(sample),
    [level, setLevel] = useState("all"),
    [service, setService] = useState("all"),
    [search, setSearch] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [selected, setSelected] = useState<number | null>(null),
    [error, setError] = useState("");
  const parsed = useMemo(() => {
    try {
      return parseLogs(input);
    } catch (caught) {
      return {
        format: "plain" as const,
        entries: [],
        skipped: 0,
        errors: [
          caught instanceof Error ? caught.message : "Could not parse logs.",
        ],
      };
    }
  }, [input]);
  const filtered = useMemo(
    () => filterLogs(parsed.entries, { level, service, search, from, to }),
    [parsed.entries, level, service, search, from, to],
  );
  const stats = logStats(filtered),
    services = [
      ...new Set(parsed.entries.map((x) => x.service).filter(Boolean)),
    ] as string[];
  const chosen = filtered.find((entry) => entry.id === selected);
  const output = JSON.stringify(
    filtered.map((entry) => entry.raw),
    null,
    2,
  );
  return (
    <RegisteredToolLayout
      tool={tool}
      inputLabel="Logs"
      outputLabel="Analysis"
      toolbar={
        <>
          <Button
            onClick={() => document.getElementById("log-search")?.focus()}
          >
            <Search /> Filter logs
          </Button>
          <ExampleButton onLoad={() => setInput(sample)} />
          <ResetButton label="Clear" onReset={() => setInput("")} />
        </>
      }
      input={
        <section
          aria-label="Log input"
          className="bg-card min-h-80 space-y-4 rounded-xl border p-5"
        >
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            Local lightweight analysis only—not a replacement for production
            observability platforms.
          </div>
          <label className="text-sm font-medium" htmlFor="log-input">
            Paste or upload logs
          </label>
          <textarea
            id="log-input"
            className="bg-background min-h-64 w-full rounded-md border p-3 font-mono text-sm"
            maxLength={2000000}
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
          <input
            accept=".log,.txt,.json,.jsonl"
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                void file
                  .text()
                  .then(setInput)
                  .catch(() => setError("Could not read this file."));
            }}
          />
          <p className="text-muted-foreground text-xs">
            Detected {parsed.format}; {parsed.entries.length} parsed;{" "}
            {parsed.skipped} skipped.
          </p>
          {error || parsed.errors.length ? (
            <p role="alert" className="text-destructive text-sm">
              {error || parsed.errors.slice(0, 3).join(" ")}
            </p>
          ) : null}
        </section>
      }
      output={
        <OutputPanel
          title="Filtered entries"
          isEmpty={!filtered.length}
          emptyMessage="No entries match these filters."
          toolbar={
            <>
              <CopyButton label="Copy results" text={output} />
              <DownloadButton
                content={output}
                filename="filtered-logs.json"
                label="Download"
              />
            </>
          }
        >
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div className="rounded border p-2">
              {stats.total}
              <br />
              Total
            </div>
            <div className="rounded border p-2">
              {stats.levels.error}
              <br />
              Errors
            </div>
            <div className="rounded border p-2">
              {stats.levels.warn}
              <br />
              Warnings
            </div>
            <div className="rounded border p-2">
              {stats.levels.info}
              <br />
              Info
            </div>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Level</th>
                  <th>Service</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 500).map((entry) => (
                  <tr
                    className="cursor-pointer border-t"
                    key={entry.id}
                    onClick={() => setSelected(entry.id)}
                  >
                    <td className="p-2">{entry.timestamp ?? "—"}</td>
                    <td>{entry.level}</td>
                    <td>{entry.service ?? "—"}</td>
                    <td>{entry.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {chosen ? (
            <details className="mt-4 rounded border p-3" open>
              <summary>Entry details</summary>
              <pre className="mt-2 overflow-auto text-xs">
                {JSON.stringify(chosen.raw, null, 2)}
              </pre>
              <CopyButton
                label="Copy entry"
                text={JSON.stringify(chosen.raw, null, 2)}
              />
            </details>
          ) : null}
        </OutputPanel>
      }
      instructions={
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <select
              aria-label="Log level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="all">All levels</option>
              {["error", "warn", "info", "debug", "unknown"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select
              aria-label="Service"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option value="all">All services</option>
              {services.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <input
              id="log-search"
              aria-label="Search messages"
              placeholder="Search messages"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              aria-label="From time"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <input
              aria-label="To time"
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <p>
            Repeated messages:{" "}
            {stats.groups
              .slice(0, 3)
              .map((x) => `${x.message} (${x.count})`)
              .join(", ") || "none"}
            . Timeline buckets: {stats.timeline.length}.
          </p>
          <Link
            className="inline-flex items-center gap-1 underline"
            href="/tools/sensitive-data-masker"
          >
            <LinkIcon className="size-4" />
            Send content to Sensitive Data Masker locally
          </Link>
          <p>
            Large imports are capped at 2 MB and 10,000 entries to keep the
            browser responsive. Review downloaded results before sharing.
          </p>
        </div>
      }
    />
  );
}
