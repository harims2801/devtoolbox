"use client";

import { useMemo, useState } from "react";
import {
  CopyButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { OutputPanel } from "@/components/tools/output-panel";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import { MAX_USER_AGENT_LENGTH, parseUserAgent } from "@/lib/user-agent-tools";

const example =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

function Value({ children }: { children?: string }) {
  return (
    <dd className="mt-1 font-mono break-words">{children || "Unknown"}</dd>
  );
}

export function UserAgentParserTool() {
  const tool = getToolById("user-agent-parser");
  if (!tool) throw new Error("User-Agent parser metadata is missing");
  const [input, setInput] = useState(""),
    [view, setView] = useState<"structured" | "raw">("structured");
  const result = useMemo(() => {
    try {
      return input.trim()
        ? { report: parseUserAgent(input), error: "" }
        : { report: undefined, error: "" };
    } catch (caught) {
      return {
        report: undefined,
        error:
          caught instanceof Error
            ? caught.message
            : "The User-Agent could not be parsed.",
      };
    }
  }, [input]);
  const serialized = result.report
    ? JSON.stringify(result.report, null, 2)
    : "";

  function replaceInput(value: string) {
    setInput(value);
    setView("structured");
  }

  const inputPanel = (
    <section className="bg-card min-h-80 space-y-3 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        User-Agent string
        <textarea
          className="bg-background mt-2 min-h-44 w-full resize-y rounded-md border p-3 font-mono text-sm"
          maxLength={MAX_USER_AGENT_LENGTH + 1}
          placeholder="Paste a browser, bot, or command-line User-Agent"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
      </label>
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>Processed only in this browser</span>
        <span>
          {input.length.toLocaleString()} /{" "}
          {MAX_USER_AGENT_LENGTH.toLocaleString()}
        </span>
      </div>
      {result.error ? (
        <p className="text-destructive text-sm" role="alert">
          {result.error}
        </p>
      ) : null}
    </section>
  );

  const outputPanel = (
    <OutputPanel
      title="Parsed User-Agent"
      emptyMessage="Paste a User-Agent or deliberately load your browser value."
      isEmpty={!result.report}
      toolbar={
        result.report ? (
          <CopyButton label="Copy JSON" text={serialized} />
        ) : null
      }
    >
      {result.report ? (
        <div className="space-y-4" data-testid="user-agent-report">
          <div aria-label="Result view" className="flex gap-2" role="tablist">
            {(["structured", "raw"] as const).map((option) => (
              <Button
                aria-selected={view === option}
                key={option}
                onClick={() => setView(option)}
                role="tab"
                variant={view === option ? "default" : "outline"}
              >
                {option === "structured" ? "Structured" : "Raw"}
              </Button>
            ))}
          </div>
          {view === "raw" ? (
            <pre className="bg-muted max-h-96 overflow-auto rounded-lg border p-4 font-mono text-sm whitespace-pre-wrap">
              {result.report.raw}
            </pre>
          ) : (
            <>
              <p className="rounded-lg border border-amber-400/50 bg-amber-500/10 p-3 text-sm">
                Best-effort only. User-Agent strings can be spoofed or
                intentionally reduced.
              </p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <dt className="text-muted-foreground">Client</dt>
                  <Value>{`${result.report.client.family}${result.report.client.version ? ` ${result.report.client.version}` : ""}`}</Value>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="text-muted-foreground">Client kind</dt>
                  <Value>{result.report.client.kind}</Value>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="text-muted-foreground">Engine</dt>
                  <Value>{`${result.report.engine.name}${result.report.engine.version ? ` ${result.report.engine.version}` : ""}`}</Value>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="text-muted-foreground">Operating system</dt>
                  <Value>{`${result.report.os.name}${result.report.os.version ? ` ${result.report.os.version}` : ""}`}</Value>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="text-muted-foreground">Device class</dt>
                  <Value>{result.report.device.class}</Value>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="text-muted-foreground">Architecture hint</dt>
                  <Value>{result.report.architecture}</Value>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="text-muted-foreground">Device</dt>
                  <Value>
                    {[result.report.device.vendor, result.report.device.model]
                      .filter(Boolean)
                      .join(" ")}
                  </Value>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="text-muted-foreground">Bot indicator</dt>
                  <Value>
                    {result.report.bot.detected
                      ? result.report.bot.indicator || "Detected"
                      : "Not detected"}
                  </Value>
                </div>
              </dl>
              <section>
                <h3 className="font-semibold">Interpretation notes</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {result.report.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={inputPanel}
      inputLabel="User-Agent"
      output={outputPanel}
      outputLabel="Parsed details"
      toolbar={
        <>
          <Button onClick={() => replaceInput(navigator.userAgent)}>
            Use my browser
          </Button>
          <ExampleButton onLoad={() => replaceInput(example)} />
          <ResetButton onReset={() => replaceInput("")} />
        </>
      }
      instructions={
        <p>
          Paste a User-Agent to parse it locally. “Use my browser” reads only{" "}
          <code>navigator.userAgent</code> after your click; it does not collect
          Client Hints or other fingerprinting signals.
        </p>
      }
      examples={[{ title: "Mobile Safari" }, { title: "curl and bots" }]}
      faqs={[
        {
          question: "Are these results authoritative?",
          answer:
            "No. User-Agent strings are self-reported, commonly reduced, and easy to spoof. Treat every field as a best-effort hint.",
        },
        {
          question: "Is my User-Agent transmitted or saved?",
          answer:
            "No. Parsing, examples, and JSON generation stay in this browser and nothing is persisted.",
        },
      ]}
      seoContent={
        <p>
          Parse browser and client family, engine, operating system, device
          class, architecture hints, and common bot markers with a versioned
          parser bundled locally in DevToolbox.
        </p>
      }
    />
  );
}
