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
import {
  DNS_RECORD_TYPES,
  type DnsLookupResponse,
  type DnsRecordType,
} from "@/lib/dns-shared";

export function DnsLookupTool() {
  const tool = getToolById("dns-lookup");
  if (!tool) throw new Error("DNS lookup metadata is missing");
  const [query, setQuery] = useState(""),
    [types, setTypes] = useState<DnsRecordType[]>(["A", "AAAA"]),
    [result, setResult] = useState<DnsLookupResponse>(),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);

  async function lookup() {
    setLoading(true);
    setError("");
    setResult(undefined);
    try {
      const response = await fetch("/api/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, recordTypes: types }),
      });
      const payload = (await response.json()) as DnsLookupResponse & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error || "DNS lookup failed safely.");
      setResult(payload);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "DNS lookup failed safely.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggle(type: DnsRecordType) {
    setTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
    setResult(undefined);
  }

  function reset() {
    setQuery("");
    setTypes(["A", "AAAA"]);
    setResult(undefined);
    setError("");
  }

  const report = result ? JSON.stringify(result, null, 2) : "";
  const input = (
    <section className="bg-card min-h-80 space-y-4 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        Public hostname or IP for PTR
        <input
          className="bg-background mt-2 h-11 w-full rounded-md border px-3 font-mono"
          placeholder="example.com"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setResult(undefined);
            setError("");
          }}
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Record types</legend>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {DNS_RECORD_TYPES.map((type) => (
            <label className="rounded-md border p-2 text-sm" key={type}>
              <input
                className="mr-2"
                type="checkbox"
                checked={types.includes(type)}
                onChange={() => toggle(type)}
              />
              {type}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-muted-foreground text-sm">
        Uses the server-configured recursive resolver. Results are recursive,
        not proof of an authoritative response. Resolver choice, ports,
        protocols, local names, and private/special-use targets are blocked.
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
      emptyMessage="Run a bounded DNS query to view records."
      isEmpty={!result}
      title="DNS records"
      toolbar={
        result ? (
          <>
            <CopyButton label="Copy report" text={report} />
            <DownloadButton
              label="Download JSON"
              content={report}
              filename="dns-lookup.json"
              mimeType="application/json"
            />
          </>
        ) : null
      }
    >
      {result ? (
        <div className="space-y-4" data-testid="dns-output">
          <div className="rounded-lg border p-4 text-sm">
            <p>
              <strong>{result.normalizedName}</strong> · {result.records.length}{" "}
              records · {result.cached ? "cache hit" : "fresh query"}
            </p>
            <p className="text-muted-foreground mt-1">
              {result.resolver.name} · recursive answer · not authoritative ·{" "}
              {result.queriedAt}
            </p>
          </div>
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Value</th>
                  <th className="p-3">TTL</th>
                  <th className="p-3">Priority</th>
                </tr>
              </thead>
              <tbody>
                {result.records.map((record, index) => (
                  <tr
                    className="border-t"
                    key={`${record.type}-${record.value}-${index}`}
                  >
                    <td className="p-3 font-medium">{record.type}</td>
                    <td className="p-3 font-mono break-all">{record.value}</td>
                    <td className="p-3">{record.ttl ?? "Unavailable"}</td>
                    <td className="p-3">{record.priority ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="DNS query"
      output={output}
      outputLabel="Recursive answer"
      toolbar={
        <>
          <Button
            disabled={loading || !query || !types.length}
            onClick={lookup}
          >
            {loading ? "Looking up…" : "Look up"}
          </Button>
          <ExampleButton
            onLoad={() => {
              setQuery("example.com");
              setTypes(["A", "AAAA", "MX", "TXT"]);
              setResult(undefined);
              setError("");
            }}
          />
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Enter a public IDNA hostname and choose forward record types, or enter
          a public IP and select PTR only. The server bounds, caches, and
          rate-limits recursive lookups.
        </p>
      }
      examples={[{ title: "Mail routing" }, { title: "Public reverse DNS" }]}
      faqs={[
        {
          question: "Are these answers authoritative?",
          answer:
            "No. They come from a recursive resolver and include TTL only where its API exposes one.",
        },
        {
          question: "Why are local and private targets blocked?",
          answer:
            "The tool is intentionally limited to public DNS and does not expose internal infrastructure or let users choose a resolver.",
        },
      ]}
      seoContent={
        <p>
          Query bounded public DNS records through a rate-limited recursive
          resolver with IDNA normalization, TTL metadata, safe caching, and
          private-network protections.
        </p>
      }
    />
  );
}
