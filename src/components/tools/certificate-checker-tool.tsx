"use client";
import { useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  validateCertificateHostname,
  type CertificateResult,
} from "@/lib/certificate-shared";
export function CertificateCheckerTool() {
  const tool = getToolById("certificate-expiry-checker");
  if (!tool) throw new Error("Certificate checker metadata is missing");
  const [hostname, setHostname] = useState("example.com"),
    [result, setResult] = useState<CertificateResult | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const online = useOnlineStatus();
  async function check() {
    try {
      validateCertificateHostname(hostname);
      setLoading(true);
      setError("");
      const response = await fetch("/api/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname, port: 443 }),
      });
      const data = (await response.json()) as CertificateResult & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error ?? "Could not check this certificate.");
      setResult(data);
    } catch (error) {
      setResult(null);
      setError(
        error instanceof Error
          ? error.message
          : "Could not check this certificate.",
      );
    } finally {
      setLoading(false);
    }
  }
  const copy = result ? JSON.stringify(result, null, 2) : "";
  return (
    <RegisteredToolLayout
      tool={tool}
      inputLabel="TLS endpoint"
      outputLabel="Certificate details"
      toolbar={
        <>
          <Button disabled={loading || !online} onClick={() => void check()}>
            {loading ? <Loader2 className="animate-spin" /> : <BadgeCheck />}
            {loading ? "Checking…" : "Check certificate"}
          </Button>
          <ExampleButton onLoad={() => setHostname("example.com")} />
          <ResetButton
            label="Clear"
            onReset={() => {
              setHostname("");
              setResult(null);
              setError("");
            }}
          />
        </>
      }
      input={
        <section
          aria-label="Certificate target"
          className="bg-card min-h-80 space-y-4 rounded-xl border p-5"
        >
          <div className="rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-950">
            This server-assisted tool connects only to public hostnames on TLS
            port 443. Do not enter URLs or sensitive internal names.
          </div>
          {!online ? (
            <p role="status" className="text-sm text-amber-700">
              Reconnect to check a certificate.
            </p>
          ) : null}
          <label htmlFor="certificate-hostname">Hostname</label>
          <input
            id="certificate-hostname"
            className="bg-background h-10 w-full rounded border px-3"
            placeholder="example.com"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
          />
          <label htmlFor="certificate-port">Port</label>
          <input
            id="certificate-port"
            className="bg-muted h-10 w-full rounded border px-3"
            disabled
            value="443"
          />
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <div className="rounded border border-dashed p-4">
            <p className="font-medium">Expiry reminder</p>
            <p className="text-muted-foreground text-sm">
              Email reminders are planned but are not implemented. No hostname
              is saved for reminders.
            </p>
          </div>
        </section>
      }
      output={
        <OutputPanel
          title="Certificate details"
          isEmpty={!result}
          emptyMessage="Check a public hostname to inspect its TLS certificate."
          toolbar={
            <CopyButton disabled={!result} label="Copy results" text={copy} />
          }
        >
          {result ? (
            <div className="space-y-4">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${result.expired ? "bg-red-100 text-red-800" : result.expiringSoon ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}
              >
                {result.expired
                  ? "Expired"
                  : result.expiringSoon
                    ? "Expiring soon"
                    : "Valid"}
              </span>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Common Name", result.commonName],
                  ["Issuer", result.issuer],
                  ["Valid from", result.validFrom],
                  ["Valid until", result.validUntil],
                  ["Remaining days", String(result.remainingDays)],
                  ["Hostname match", result.hostnameMatch ? "Yes" : "No"],
                  ["Serial number", result.serialNumber ?? "Unavailable"],
                  [
                    "Signature algorithm",
                    result.signatureAlgorithm ?? "Unavailable",
                  ],
                  ["TLS protocol", result.protocol ?? "Unavailable"],
                  [
                    "Subject Alternative Names",
                    result.subjectAlternativeNames.join(", ") || "None",
                  ],
                ].map(([label, value]) => (
                  <div className="rounded border p-3" key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-medium break-all">{value}</dd>
                  </div>
                ))}
              </dl>
              <section>
                <h3 className="font-semibold">Certificate chain</h3>
                {result.chain.map((item, index) => (
                  <p className="mt-2 text-sm" key={index}>
                    {index + 1}. {item.commonName} · issuer {item.issuer} ·
                    until {item.validUntil}
                  </p>
                ))}
              </section>
            </div>
          ) : null}
        </OutputPanel>
      }
      instructions={
        <p>
          Enter a public hostname without a scheme, path, credentials, query
          string, or fragment. DNS results and the final connection address are
          checked to block private, loopback, link-local, documentation,
          metadata, and internal destinations. Results are short-lived and
          errors intentionally omit network internals.
        </p>
      }
    />
  );
}
