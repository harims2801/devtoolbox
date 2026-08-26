"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
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
  parseWebhookHeaderLines,
  type WebhookMethod,
  type WebhookReport,
} from "@/lib/webhook-shared";

const examplePayload = JSON.stringify(
  { event: "order.created", id: "evt_example_001", test: true },
  null,
  2,
);

export function WebhookTesterTool() {
  const tool = getToolById("webhook-payload-tester");
  if (!tool) throw new Error("Webhook tester metadata is missing");
  const [endpoint, setEndpoint] = useState(""),
    [method, setMethod] = useState<WebhookMethod>("POST"),
    [payload, setPayload] = useState("{}"),
    [headerLines, setHeaderLines] = useState(""),
    [consent, setConsent] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [report, setReport] = useState<WebhookReport>();

  const summary = useMemo(() => {
    try {
      const parsedPayload = JSON.parse(payload) as unknown,
        headers = parseWebhookHeaderLines(headerLines),
        bytes = new TextEncoder().encode(JSON.stringify(parsedPayload)).length;
      return { parsedPayload, headers, bytes, error: "" };
    } catch (caught) {
      return {
        parsedPayload: undefined,
        headers: [],
        bytes: 0,
        error:
          caught instanceof Error
            ? caught.message
            : "Enter a valid JSON payload and headers.",
      };
    }
  }, [headerLines, payload]);

  function changed(update: () => void) {
    update();
    setConsent(false);
    setReport(undefined);
    setError("");
  }

  async function send() {
    if (!consent || summary.error || summary.parsedPayload === undefined)
      return;
    setLoading(true);
    setError("");
    setReport(undefined);
    try {
      const response = await fetch("/api/webhook-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint,
          method,
          payload: summary.parsedPayload,
          headers: summary.headers,
          consent: true,
        }),
      });
      const body = (await response.json()) as WebhookReport & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(body.error || "The webhook request failed safely.");
      setReport(body);
      setConsent(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The webhook request failed safely.",
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setEndpoint("");
    setMethod("POST");
    setPayload("{}");
    setHeaderLines("");
    setConsent(false);
    setLoading(false);
    setError("");
    setReport(undefined);
  }

  const inputPanel = (
    <section className="bg-card min-h-80 space-y-4 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        Public HTTPS endpoint
        <input
          className="bg-background mt-2 h-11 w-full rounded-md border px-3 font-mono text-sm"
          placeholder="https://hooks.example.com/test"
          value={endpoint}
          onChange={(event) => changed(() => setEndpoint(event.target.value))}
        />
      </label>
      <label className="block text-sm font-medium">
        Method
        <select
          className="bg-background mt-2 h-10 w-full rounded-md border px-3"
          value={method}
          onChange={(event) =>
            changed(() => setMethod(event.target.value as WebhookMethod))
          }
        >
          <option>POST</option>
          <option>PUT</option>
          <option>PATCH</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        JSON payload
        <textarea
          className="bg-background mt-2 min-h-48 w-full resize-y rounded-md border p-3 font-mono text-sm"
          value={payload}
          onChange={(event) => changed(() => setPayload(event.target.value))}
        />
      </label>
      <label className="block text-sm font-medium">
        Safe custom headers{" "}
        <span className="text-muted-foreground font-normal">
          (one Name: value per line)
        </span>
        <textarea
          className="bg-background mt-2 min-h-24 w-full resize-y rounded-md border p-3 font-mono text-sm"
          placeholder="X-Event-Type: test\nIdempotency-Key: example-001"
          value={headerLines}
          onChange={(event) =>
            changed(() => setHeaderLines(event.target.value))
          }
        />
      </label>
      {summary.error ? (
        <p className="text-destructive text-sm" role="alert">
          {summary.error}
        </p>
      ) : null}
      <section className="rounded-lg border border-amber-400/50 bg-amber-500/10 p-4 text-sm">
        <h3 className="font-semibold">
          Confirm exactly what will leave this browser
        </h3>
        <p className="mt-2">
          DevToolbox will send the endpoint, {method} method, the exact parsed
          JSON payload ({summary.bytes.toLocaleString()} bytes), and{" "}
          {summary.headers.length} listed custom header
          {summary.headers.length === 1 ? "" : "s"} to its server. The server
          will forward them to the endpoint. Browser cookies are never included.
        </p>
        <label className="mt-3 flex items-start gap-2 font-medium">
          <input
            aria-label="Confirm webhook send"
            checked={consent}
            disabled={Boolean(summary.error) || !endpoint.trim()}
            onChange={(event) => setConsent(event.target.checked)}
            type="checkbox"
          />
          I confirm this endpoint, method, JSON payload, and these custom
          headers may be sent now.
        </label>
      </section>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );

  const serialized = report ? JSON.stringify(report, null, 2) : "";
  const outputPanel = (
    <OutputPanel
      title="Webhook response"
      emptyMessage="Confirm and send a bounded test request to view its safe response summary."
      isEmpty={!report}
      toolbar={
        report ? (
          <CopyButton label="Copy response report" text={serialized} />
        ) : null
      }
    >
      {report ? (
        <div className="space-y-4" data-testid="webhook-report">
          <section className="rounded-lg border p-4">
            <p className="text-xl font-semibold">
              {report.status} {report.statusText}
            </p>
            <p className="mt-1 font-mono text-sm break-all">
              {report.endpoint}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {report.method} · {report.timingMilliseconds} ms ·{" "}
              {report.redirects.length} redirects
            </p>
          </section>
          {report.redirects.length ? (
            <section>
              <h3 className="font-semibold">Validated redirect chain</h3>
              <ol className="mt-2 space-y-2 text-sm">
                {report.redirects.map((redirect, index) => (
                  <li
                    className="rounded border p-3 font-mono break-all"
                    key={`${index}-${redirect.url}`}
                  >
                    {redirect.status} {redirect.url} → {redirect.location}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <section>
            <h3 className="font-semibold">Selected response headers</h3>
            {report.responseHeaders.length ? (
              <dl className="mt-2 space-y-2 text-sm">
                {report.responseHeaders.map((header, index) => (
                  <div
                    className="rounded border p-3"
                    key={`${header.name}-${index}`}
                  >
                    <dt className="font-mono font-medium">{header.name}</dt>
                    <dd className="mt-1 font-mono break-all">{header.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">
                No selected headers returned.
              </p>
            )}
          </section>
          <section>
            <h3 className="font-semibold">
              Response preview · {report.preview.kind} ·{" "}
              {report.preview.bytesRead.toLocaleString()} bytes read
              {report.preview.truncated ? " · truncated" : ""}
            </h3>
            <pre className="bg-muted mt-2 max-h-96 overflow-auto rounded-lg border p-3 font-mono text-sm whitespace-pre-wrap">
              {report.preview.content || "(empty response)"}
            </pre>
          </section>
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={inputPanel}
      inputLabel="Outbound request"
      output={outputPanel}
      outputLabel="Safe response"
      toolbar={
        <>
          <Button
            disabled={!consent || loading || Boolean(summary.error)}
            onClick={send}
          >
            <Send /> {loading ? "Sending…" : "Send confirmed webhook"}
          </Button>
          <ExampleButton
            onLoad={() => {
              setEndpoint("https://example.com/webhook");
              setMethod("POST");
              setPayload(examplePayload);
              setHeaderLines(
                "X-Event-Type: order.created\nIdempotency-Key: evt_example_001",
              );
              setConsent(false);
              setReport(undefined);
              setError("");
            }}
          />
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Use only an endpoint you are authorized to test. POST is the default;
          PUT and PATCH support test endpoints that deliberately model those
          idempotent/update flows. Only method-preserving 307/308 redirects are
          followed; each one is revalidated and pinned before another request is
          sent. Other redirect responses are reported without replaying the
          payload.
        </p>
      }
      examples={[{ title: "Event delivery" }, { title: "Idempotent replay" }]}
      faqs={[
        {
          question: "Can this reach internal services?",
          answer:
            "No. HTTPS, hostname, every DNS answer, IP literal, port, and redirect are checked against private and special-use destinations before each request.",
        },
        {
          question: "Can I send Authorization or cookies?",
          answer:
            "No. Authorization, cookies, proxy headers, Host, Content-Length, hop-by-hop headers, and method-override headers are rejected.",
        },
      ]}
      seoContent={
        <p>
          Send bounded JSON test payloads to authorized public HTTPS webhook
          endpoints with explicit consent, SSRF-resistant routing, safe custom
          headers, and inert response previews.
        </p>
      }
    />
  );
}
