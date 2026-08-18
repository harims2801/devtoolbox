"use client";

import { useMemo, useState } from "react";
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
  formatComposeReport,
  validateDockerCompose,
  type ComposeReport,
  type ComposeSeverity,
} from "@/lib/docker-compose-tools";

const example = `services:
  web:
    build: .
    image: example/web:1.0
    ports:
      - "8080:80"
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: \${DATABASE_URL}
    networks: [app]
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
    volumes:
      - data:/var/lib/postgresql/data
    networks: [app]
volumes:
  data: {}
networks:
  app: {}
`;

export function DockerComposeValidatorTool() {
  const tool = getToolById("docker-compose-validator");
  if (!tool) throw new Error("Docker Compose validator metadata is missing");
  const [source, setSource] = useState(""),
    [report, setReport] = useState<ComposeReport>(),
    [error, setError] = useState(""),
    [filters, setFilters] = useState<Record<ComposeSeverity, boolean>>({
      error: true,
      warning: true,
      info: true,
    }),
    visible = useMemo(
      () =>
        report?.findings.filter((finding) => filters[finding.severity]) ?? [],
      [filters, report],
    );

  function validate() {
    try {
      setReport(validateDockerCompose(source));
      setError("");
    } catch (caught) {
      setReport(undefined);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not validate this Compose file.",
      );
    }
  }
  async function loadFile(file: File | undefined) {
    if (!file) return;
    setSource(await file.text());
    setReport(undefined);
    setError("");
  }
  function reset() {
    setSource("");
    setReport(undefined);
    setError("");
    setFilters({ error: true, warning: true, info: true });
  }

  const input = (
    <section className="bg-card min-h-80 space-y-4 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        Compose YAML
        <textarea
          className="bg-background mt-2 min-h-96 w-full rounded-md border p-3 font-mono text-sm"
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            setReport(undefined);
            setError("");
          }}
        />
      </label>
      <label className="text-sm font-medium">
        Load .yml or .yaml file
        <input
          className="mt-1 block text-xs"
          type="file"
          accept=".yml,.yaml,application/yaml,text/yaml"
          onChange={(event) => void loadFile(event.target.files?.[0])}
        />
      </label>
      <p className="text-muted-foreground text-sm">
        Static only: this tool never runs Docker, pulls images, resolves remote
        files, reads host secrets, or expands environment values.
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
      emptyMessage="Validate Compose YAML to see formatted output and static findings."
      isEmpty={!report}
      title="Compose validation"
      toolbar={
        report ? (
          <>
            <CopyButton
              label="Copy report"
              text={formatComposeReport(report)}
            />
            <DownloadButton
              label="Download report"
              content={formatComposeReport(report)}
              filename="compose-validation.json"
              mimeType="application/json"
            />
          </>
        ) : null
      }
    >
      {report ? (
        <div className="space-y-5" data-testid="compose-output">
          <div className="grid grid-cols-3 gap-3 text-sm">
            {(["error", "warning", "info"] as const).map((severity) => (
              <label className="rounded-lg border p-3" key={severity}>
                <input
                  className="mr-2"
                  type="checkbox"
                  checked={filters[severity]}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      [severity]: event.target.checked,
                    }))
                  }
                />
                <span className="font-semibold">
                  {report.summary[severity]}
                </span>{" "}
                {severity}
              </label>
            ))}
          </div>
          <p className="text-sm">
            Services: {report.services.join(", ") || "none"}
          </p>
          <section>
            <h3 className="font-medium">Findings ({visible.length})</h3>
            <div className="mt-3 space-y-2">
              {visible.length ? (
                visible.map((finding, index) => (
                  <article
                    className="rounded-lg border p-3"
                    key={`${finding.path}-${index}`}
                  >
                    <div className="flex justify-between gap-3 text-sm">
                      <code>{finding.path}</code>
                      <span className="uppercase">{finding.severity}</span>
                    </div>
                    <p className="mt-2 text-sm">{finding.message}</p>
                  </article>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  No findings match the selected severities.
                </p>
              )}
            </div>
          </section>
          {report.formatted ? (
            <section>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">Formatted YAML</h3>
                <CopyButton
                  label="Copy formatted YAML"
                  text={report.formatted}
                />
              </div>
              <pre className="bg-muted mt-3 max-h-96 overflow-auto rounded-lg border p-4 font-mono text-sm whitespace-pre-wrap">
                {report.formatted}
              </pre>
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
      inputLabel="Compose file"
      output={output}
      outputLabel="Static report"
      toolbar={
        <>
          <Button onClick={validate}>Validate</Button>
          <ExampleButton
            onLoad={() => {
              setSource(example);
              setReport(undefined);
              setError("");
            }}
          />
          <ResetButton onReset={reset} />
        </>
      }
      instructions={
        <p>
          Paste or load Compose YAML, run the bounded local parser and
          common-spec checks, filter findings, and copy formatted YAML or export
          the report.
        </p>
      }
      examples={[
        { title: "Multi-service application" },
        { title: "CI configuration review" },
      ]}
      faqs={[
        {
          question: "Does this run Docker?",
          answer:
            "No. Validation is static and browser-only; images, files, variables, and secrets are never resolved.",
        },
        {
          question: "Is this a complete engine validation?",
          answer:
            "No. It checks common current Compose fields and relationships, while runtime-specific behavior still requires Docker Compose in your own environment.",
        },
      ]}
      seoContent={
        <p>
          Validate Docker Compose YAML locally with bounded alias handling,
          semantic service and resource checks, severity filters, formatted
          YAML, and privacy-safe reports.
        </p>
      }
    />
  );
}
