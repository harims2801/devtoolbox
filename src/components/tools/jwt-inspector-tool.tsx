"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { CodeTextarea } from "@/components/tools/code-textarea";
import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import type { JsonValue } from "@/lib/json-tools";
import {
  createExampleJwt,
  formatJwtTimestamp,
  formatRemainingLifetime,
  inspectJwt,
  type JwtInspection,
} from "@/lib/jwt-tools";
import { cn } from "@/lib/utils";

const commonClaims = [
  ["iss", "Issuer"],
  ["sub", "Subject"],
  ["aud", "Audience"],
  ["iat", "Issued at"],
  ["nbf", "Not before"],
  ["exp", "Expiration"],
  ["jti", "JWT ID"],
] as const;

function renderClaim(value: JsonValue | undefined) {
  if (value === undefined) return "Not present";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function JsonBlock({ value }: { value: Record<string, JsonValue> }) {
  return (
    <pre className="bg-muted/50 max-h-80 overflow-auto rounded-lg p-4 text-xs leading-5 break-all whitespace-pre-wrap">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function JwtInspectorTool() {
  const tool = getToolById("jwt-decoder-inspector");
  if (!tool) throw new Error("JWT inspector metadata is missing");

  const [token, setToken] = useState("");
  const [masked, setMasked] = useState(true);
  const [inspection, setInspection] = useState<JwtInspection>();
  const [error, setError] = useState("");
  const decodedResult = useMemo(
    () =>
      inspection
        ? JSON.stringify(
            {
              header: inspection.header,
              payload: inspection.payload,
              signature: inspection.signature,
              status: inspection.status,
            },
            null,
            2,
          )
        : "",
    [inspection],
  );

  function decode() {
    const result = inspectJwt(token);
    if (!result.ok) {
      setInspection(undefined);
      setError(result.error);
      return;
    }
    setInspection(result.value);
    setError("");
    toast.success("JWT decoded locally — signature not verified");
  }

  const inputPanel = (
    <div className="space-y-3">
      <div className="border-warning/50 bg-warning/10 flex gap-3 rounded-xl border p-4 text-sm leading-6">
        <ShieldAlert
          aria-hidden="true"
          className="text-warning-foreground mt-0.5 size-5 shrink-0"
        />
        <div>
          <p className="font-semibold">Decoding does not verify authenticity</p>
          <p className="text-muted-foreground mt-1">
            Do not paste production tokens containing credentials, personal
            data, or other secrets. This tool does not validate the signature.
          </p>
        </div>
      </div>
      <CodeTextarea
        autoComplete="off"
        className={cn(masked && "[-webkit-text-security:disc]")}
        description="The token is masked by default and remains only in component memory."
        error={error}
        label="JWT input"
        onChange={(event) => {
          setToken(event.target.value);
          if (error) setError("");
        }}
        placeholder="Paste a three-segment JWT"
        toolbar={
          <Button
            aria-pressed={!masked}
            onClick={() => setMasked((current) => !current)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {masked ? (
              <Eye aria-hidden="true" />
            ) : (
              <EyeOff aria-hidden="true" />
            )}
            {masked ? "Reveal token" : "Mask token"}
          </Button>
        }
        value={token}
      />
    </div>
  );

  const outputPanel = (
    <OutputPanel
      emptyMessage="Decode a structurally valid JWT to inspect its header, payload, and claims."
      isEmpty={!inspection}
      title="Decoded JWT"
      toolbar={
        inspection ? (
          <>
            <CopyButton
              label="Copy header"
              text={JSON.stringify(inspection.header, null, 2)}
            />
            <CopyButton
              label="Copy payload"
              text={JSON.stringify(inspection.payload, null, 2)}
            />
            <CopyButton label="Copy all" text={decodedResult} />
          </>
        ) : null
      }
    >
      {inspection ? (
        <div className="space-y-6" data-testid="jwt-inspection">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Algorithm</p>
              <p className="mt-1 font-mono">
                {inspection.algorithm ?? "Unknown"}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Token type</p>
              <p className="mt-1 font-mono">
                {inspection.tokenType ?? "Unknown"}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Apparent status</p>
              <p
                className={cn(
                  "mt-1 font-semibold capitalize",
                  inspection.status === "expired" && "text-destructive",
                  inspection.status === "not-active-yet" &&
                    "text-warning-foreground",
                  inspection.status === "active" && "text-success",
                )}
              >
                {inspection.status.replaceAll("-", " ")}
              </p>
            </div>
          </div>

          <p className="text-muted-foreground text-sm">
            Remaining lifetime:{" "}
            <strong className="text-foreground">
              {formatRemainingLifetime(inspection.remainingSeconds)}
            </strong>
          </p>

          {inspection.algorithm?.toLocaleLowerCase() === "none" ? (
            <p
              className="text-destructive rounded-lg border p-3 text-sm"
              role="alert"
            >
              The token declares the unsupported “none” algorithm. It is decoded
              only and must never be treated as verified.
            </p>
          ) : null}

          <section>
            <h3 className="mb-2 font-medium">Header</h3>
            <JsonBlock value={inspection.header} />
          </section>

          <section>
            <h3 className="mb-2 font-medium">Payload</h3>
            <JsonBlock value={inspection.payload} />
          </section>

          <section>
            <h3 className="mb-3 font-medium">Common claims</h3>
            <dl className="divide-y rounded-lg border">
              {commonClaims.map(([key, label]) => {
                const value = inspection.payload[key];
                const timestamp = ["iat", "nbf", "exp"].includes(key)
                  ? formatJwtTimestamp(value)
                  : undefined;
                return (
                  <div
                    className="grid gap-1 p-3 sm:grid-cols-[8rem_1fr]"
                    key={key}
                  >
                    <dt className="text-muted-foreground text-sm">{label}</dt>
                    <dd className="min-w-0 text-sm break-all">
                      <span>{renderClaim(value)}</span>
                      {timestamp ? (
                        <span className="text-muted-foreground mt-1 block text-xs leading-5">
                          Local: {timestamp.local}
                          <br />
                          UTC: {timestamp.utc}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section>
            <h3 className="mb-2 font-medium">Signature segment</h3>
            <pre className="bg-muted/50 overflow-auto rounded-lg p-3 text-xs break-all whitespace-pre-wrap">
              {inspection.signature}
            </pre>
            <p className="text-muted-foreground mt-2 text-xs">
              Displayed for inspection only. No signature verification was
              performed.
            </p>
          </section>
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      examples={[
        {
          title: "Active demo token",
          description:
            "Load a locally generated token with common claims and a one-hour lifetime.",
        },
        {
          title: "Expiration review",
          description:
            "Inspect exp and nbf to see apparent token status and readable dates.",
        },
      ]}
      faqs={[
        {
          question: "Does decoding verify the token?",
          answer:
            "No. Anyone can construct JWT header and payload segments. Trust a token only after server-side verification with an expected algorithm and trusted key.",
        },
        {
          question: "Is the token saved?",
          answer:
            "No. It is not written to localStorage, cookies, URLs, analytics, or the browser console.",
        },
      ]}
      input={inputPanel}
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Use a non-production or sanitized JWT whenever possible.</li>
          <li>Paste the three-segment value and select Decode JWT.</li>
          <li>
            Review header fields, claims, dates, and apparent time status.
          </li>
          <li>
            Remember that no authenticity or signature check is performed.
          </li>
        </ol>
      }
      output={outputPanel}
      seoContent={
        <p>
          Inspect JWT header and payload JSON, common claims, readable
          NumericDate values, and apparent expiration status locally. Decoding
          is not cryptographic verification.
        </p>
      }
      tool={tool}
      toolbar={
        <>
          <Button onClick={decode} type="button">
            Decode JWT
          </Button>
          <ExampleButton
            onLoad={() => {
              setToken(createExampleJwt());
              setInspection(undefined);
              setError("");
            }}
          />
          <ResetButton
            label="Clear"
            onReset={() => {
              setToken("");
              setInspection(undefined);
              setError("");
              setMasked(true);
            }}
          />
        </>
      }
    />
  );
}
