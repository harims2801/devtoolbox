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
import {
  MAX_URL_INPUT_LENGTH,
  parseUrlReference,
} from "@/lib/url-parser-tools";

const example =
  "https://demo:secret@xn--pple-43d.com:8443/a%2Fb/items?tag=one&tag=&next=%2Fadmin%3Fx%3D1#résumé";

export function UrlParserTool() {
  const tool = getToolById("url-parser");
  if (!tool) throw new Error("URL parser metadata is missing");
  const [input, setInput] = useState(""),
    [base, setBase] = useState(""),
    [view, setView] = useState<"details" | "json">("details");
  const parsed = useMemo(() => {
    try {
      return input.trim()
        ? { report: parseUrlReference(input, base), error: "" }
        : { report: undefined, error: "" };
    } catch (caught) {
      return {
        report: undefined,
        error:
          caught instanceof Error
            ? caught.message
            : "The URL could not be parsed.",
      };
    }
  }, [base, input]);
  const serialized = parsed.report
    ? JSON.stringify(parsed.report, null, 2)
    : "";

  function reset() {
    setInput("");
    setBase("");
    setView("details");
  }

  const inputPanel = (
    <section className="bg-card min-h-80 space-y-4 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        URL or reference
        <textarea
          aria-describedby="url-length"
          className="bg-background mt-2 min-h-32 w-full resize-y rounded-md border p-3 font-mono text-sm"
          maxLength={MAX_URL_INPUT_LENGTH + 1}
          placeholder="https://example.com/path?key=value or ../relative"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
      </label>
      <p className="text-muted-foreground text-xs" id="url-length">
        {input.length.toLocaleString()} /{" "}
        {MAX_URL_INPUT_LENGTH.toLocaleString()} characters
      </p>
      <label className="block text-sm font-medium">
        Explicit base URL{" "}
        <span className="text-muted-foreground font-normal">
          (required for relative input)
        </span>
        <input
          className="bg-background mt-2 h-11 w-full rounded-md border px-3 font-mono text-sm"
          placeholder="https://example.com/docs/"
          value={base}
          onChange={(event) => setBase(event.target.value)}
        />
      </label>
      <p className="text-muted-foreground text-sm">
        Parsing uses the browser URL standard. Nothing is fetched, opened,
        transmitted, or saved.
      </p>
      {parsed.error ? (
        <p className="text-destructive text-sm" role="alert">
          {parsed.error}
        </p>
      ) : null}
    </section>
  );

  const outputPanel = (
    <OutputPanel
      title="Parsed URL"
      emptyMessage="Enter an absolute URL, or provide an explicit base for a relative reference."
      isEmpty={!parsed.report}
      toolbar={
        parsed.report ? (
          <CopyButton label="Copy JSON" text={serialized} />
        ) : null
      }
    >
      {parsed.report ? (
        <div className="space-y-4" data-testid="url-parser-report">
          <div aria-label="Output view" className="flex gap-2" role="tablist">
            <Button
              aria-selected={view === "details"}
              onClick={() => setView("details")}
              role="tab"
              variant={view === "details" ? "default" : "outline"}
            >
              Human-readable
            </Button>
            <Button
              aria-selected={view === "json"}
              onClick={() => setView("json")}
              role="tab"
              variant={view === "json" ? "default" : "outline"}
            >
              Structured JSON
            </Button>
          </div>
          {view === "json" ? (
            <pre className="bg-muted max-h-[36rem] overflow-auto rounded-lg border p-4 text-sm whitespace-pre-wrap">
              {serialized}
            </pre>
          ) : (
            <>
              {parsed.report.risks.length ? (
                <section className="space-y-2" aria-labelledby="risk-heading">
                  <h3 className="font-semibold" id="risk-heading">
                    Review before using
                  </h3>
                  {parsed.report.risks.map((risk) => (
                    <p
                      className="rounded-lg border border-amber-400/50 bg-amber-500/10 p-3 text-sm"
                      key={risk.code}
                    >
                      {risk.message}
                    </p>
                  ))}
                </section>
              ) : (
                <p className="rounded-lg border p-3 text-sm">
                  No configured risky patterns were detected. This is not a
                  safety guarantee.
                </p>
              )}
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  [
                    "Reference",
                    `${parsed.report.reference.kind}${parsed.report.reference.relative ? " (resolved with explicit base)" : ""}`,
                  ],
                  ["Scheme", parsed.report.scheme],
                  ["Host", parsed.report.host || "None"],
                  ["ASCII hostname", parsed.report.hostname.ascii || "None"],
                  [
                    "Unicode hostname",
                    parsed.report.hostname.unicode || "None",
                  ],
                  ["Port", parsed.report.port || "Default or none"],
                  ["Origin", parsed.report.origin],
                  ["Path", parsed.report.pathname || "None"],
                  ["Fragment", parsed.report.fragment.decoded || "None"],
                  [
                    "Username present",
                    parsed.report.credentials.usernamePresent
                      ? "Yes (value hidden)"
                      : "No",
                  ],
                  [
                    "Password present",
                    parsed.report.credentials.passwordPresent
                      ? "Yes (value hidden)"
                      : "No",
                  ],
                ].map(([label, value]) => (
                  <div className="rounded-lg border p-3" key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-mono break-all">{value}</dd>
                  </div>
                ))}
              </dl>
              <section>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Safe canonical URL</h3>
                  <CopyButton
                    label="Copy canonical URL"
                    text={parsed.report.canonicalUrl}
                  />
                </div>
                <p className="rounded-lg border p-3 font-mono text-sm break-all">
                  {parsed.report.canonicalUrl}
                </p>
              </section>
              <section>
                <h3 className="font-semibold">Path segments</h3>
                <ol className="mt-2 space-y-1 text-sm">
                  {parsed.report.pathSegments.map((segment, index) => (
                    <li
                      className="rounded border p-2 font-mono break-all"
                      key={`${index}-${segment.raw}`}
                    >
                      {index}: {segment.decoded || "(empty)"}
                      {segment.raw !== segment.decoded
                        ? ` · encoded: ${segment.raw}`
                        : ""}
                    </li>
                  ))}
                </ol>
              </section>
              <section>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Query pairs in order</h3>
                  <CopyButton
                    label="Copy raw query"
                    text={parsed.report.query.raw}
                  />
                </div>
                {parsed.report.query.pairs.length ? (
                  <ol className="space-y-1 text-sm">
                    {parsed.report.query.pairs.map((pair, index) => (
                      <li
                        className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 rounded border p-2 font-mono"
                        key={`${index}-${pair.key}`}
                      >
                        <span>{index + 1}.</span>
                        <span className="break-all">
                          {pair.key || "(empty key)"}
                        </span>
                        <span className="break-all">
                          {pair.value || "(empty value)"}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No query pairs.
                  </p>
                )}
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
      inputLabel="URL input"
      output={outputPanel}
      outputLabel="URL parts"
      toolbar={
        <>
          <ExampleButton
            onLoad={() => {
              setInput(example);
              setBase("");
              setView("details");
            }}
          />
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Paste an absolute URL. For relative references such as{" "}
          <code>../api?q=1</code>, enter the base URL you intend—DevToolbox
          never guesses one. Embedded password text remains only in the input
          field and is removed from outputs.
        </p>
      }
      examples={[
        { title: "IDN with repeated parameters" },
        { title: "Relative API reference" },
      ]}
      faqs={[
        {
          question: "Does parsing visit the URL?",
          answer:
            "No. It only constructs a browser URL object locally and never navigates, fetches, or probes the destination.",
        },
        {
          question: "Why can a hostname be risky?",
          answer:
            "Punycode and mixed writing systems are legitimate, but they can also create look-alike names. Verify the Unicode and ASCII forms independently.",
        },
      ]}
      seoContent={
        <p>
          Inspect URL components, ordered query values, paths, fragments, IDN
          spellings, relative resolution, and common risky patterns without
          making a network request.
        </p>
      }
    />
  );
}
