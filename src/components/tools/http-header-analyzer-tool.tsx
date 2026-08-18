"use client";

import { useState } from "react";
import {
  CopyButton,
  DownloadButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { OutputPanel } from "@/components/tools/output-panel";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import type {
  HeaderRequestMethod,
  HttpHeaderReport,
} from "@/lib/http-header-shared";

export function HttpHeaderAnalyzerTool() {
  const tool = getToolById("http-header-analyzer");
  if (!tool) throw new Error("HTTP header analyzer metadata is missing");
  const [url, setUrl] = useState(""),
    [method, setMethod] = useState<HeaderRequestMethod>("HEAD"),
    [report, setReport] = useState<HttpHeaderReport>(),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    setError("");
    setReport(undefined);
    try {
      const response = await fetch("/api/http-headers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, method }),
      });
      const payload = (await response.json()) as HttpHeaderReport & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error || "Header analysis failed safely.");
      setReport(payload);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Header analysis failed safely.",
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setUrl("");
    setMethod("HEAD");
    setReport(undefined);
    setError("");
  }

  const serialized = report ? JSON.stringify(report, null, 2) : "";
  const input = (
    <section className="bg-card min-h-80 space-y-4 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        Public HTTP or HTTPS URL
        <input
          className="bg-background mt-2 h-11 w-full rounded-md border px-3 font-mono"
          placeholder="https://example.com"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setReport(undefined);
            setError("");
          }}
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Request method</legend>
        <div className="mt-2 flex gap-3">
          {(["HEAD", "GET"] as const).map((option) => (
            <label className="rounded-md border px-3 py-2 text-sm" key={option}>
              <input
                className="mr-2"
                type="radio"
                name="method"
                checked={method === option}
                onChange={() => setMethod(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-muted-foreground text-sm">
        Requests use standard ports, short timeouts, pinned public DNS answers,
        and at most five validated redirects. Bodies and secret header values
        are never returned.
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
      title="Header report"
      emptyMessage="Analyze a public URL to inspect its response headers."
      isEmpty={!report}
      toolbar={
        report ? (
          <>
            <CopyButton label="Copy report" text={serialized} />
            <DownloadButton
              label="Download JSON"
              content={serialized}
              filename="http-header-report.json"
              mimeType="application/json"
            />
          </>
        ) : null
      }
    >
      {report ? (
        <div className="space-y-4" data-testid="header-report">
          <section className="rounded-lg border p-4 text-sm">
            <p className="text-lg font-semibold">
              {report.status} {report.statusText}
            </p>
            <p className="mt-1 font-mono break-all">{report.finalUrl}</p>
            <p className="text-muted-foreground mt-1">
              {report.method} · {report.redirects.length} redirects · analyzed{" "}
              {report.analyzedAt}
            </p>
          </section>
          <section>
            <h3 className="mb-2 font-semibold">Security headers</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {report.security.map((finding) => (
                <div
                  className="rounded-lg border p-3 text-sm"
                  key={finding.header}
                >
                  <p className="font-mono font-medium">
                    {finding.status === "pass" ? "Pass" : "Review"} ·{" "}
                    {finding.header}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {finding.message}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3 text-sm">
              <strong>Content type</strong>
              <p className="mt-1 break-all">
                {report.contentType ?? "Not declared"}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <strong>Compression</strong>
              <p className="mt-1">{report.compression ?? "None declared"}</p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <strong>Cookies</strong>
              <p className="mt-1">{report.cookies.length} metadata records</p>
            </div>
          </section>
          {report.redirects.length ? (
            <section>
              <h3 className="mb-2 font-semibold">Redirect chain</h3>
              <ol className="space-y-2 text-sm">
                {report.redirects.map((hop) => (
                  <li
                    className="rounded-lg border p-3"
                    key={`${hop.url}-${hop.status}`}
                  >
                    <span className="font-semibold">{hop.status}</span>{" "}
                    <span className="font-mono break-all">{hop.url}</span>
                    <span className="block font-mono break-all">
                      → {hop.location}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <section>
            <h3 className="mb-2 font-semibold">Normalized response headers</h3>
            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3">Header</th>
                    <th className="p-3">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {report.headers.map((header) => (
                    <tr className="border-t" key={header.name}>
                      <td className="p-3 font-mono font-medium">
                        {header.name}
                      </td>
                      <td className="p-3 font-mono break-all">
                        {header.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {report.cookies.length ? (
            <section>
              <h3 className="mb-2 font-semibold">
                Cookie metadata (values hidden)
              </h3>
              <ul className="space-y-2 text-sm">
                {report.cookies.map((cookie, index) => (
                  <li
                    className="rounded-lg border p-3"
                    key={`${cookie.name}-${index}`}
                  >
                    <span className="font-mono font-medium">{cookie.name}</span>{" "}
                    · {cookie.secure ? "Secure" : "not Secure"} ·{" "}
                    {cookie.httpOnly ? "HttpOnly" : "not HttpOnly"} · SameSite{" "}
                    {cookie.sameSite ?? "unspecified"}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Request"
      output={output}
      outputLabel="Analysis"
      toolbar={
        <>
          <Button disabled={loading || !url.trim()} onClick={analyze}>
            {loading ? "Analyzing…" : "Analyze headers"}
          </Button>
          <ExampleButton
            onLoad={() => {
              setUrl("https://example.com");
              setMethod("HEAD");
              setReport(undefined);
              setError("");
            }}
          />
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Enter a public URL and choose HEAD or GET. GET responses are stopped
          after headers; response bodies are not collected or displayed.
        </p>
      }
      examples={[{ title: "Security audit" }, { title: "Cache inspection" }]}
      faqs={[
        {
          question: "Can this reach local services?",
          answer:
            "No. Each hostname and redirect is resolved, checked against private and special-use ranges, and pinned to the validated address.",
        },
        {
          question: "Are cookie values shown?",
          answer:
            "No. The report retains only cookie names and security-attribute metadata.",
        },
      ]}
      seoContent={
        <p>
          Inspect normalized HTTP response headers, redirects, caching,
          compression, cookie flags, and common browser security controls using
          a bounded SSRF-resistant server fetch.
        </p>
      }
    />
  );
}
