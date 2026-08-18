"use client";
import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
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
import {
  KUBERNETES_RULES,
  KUBERNETES_VERSIONS,
  validateKubernetes,
  type KubernetesRule,
} from "@/lib/kubernetes-tools";
const sample = `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\nspec:\n  selector:\n    matchLabels:\n      app: api\n  template:\n    metadata:\n      labels:\n        app: api\n    spec:\n      containers:\n        - name: api\n          image: example/api:latest\n`;
export function KubernetesValidatorTool() {
  const tool = getToolById("kubernetes-yaml-validator");
  if (!tool) throw new Error("Kubernetes validator metadata is missing");
  const [input, setInput] = useState(sample),
    [version, setVersion] = useState("1.30"),
    [disabled, setDisabled] = useState<KubernetesRule[]>([]);
  const result = useMemo(() => {
    try {
      return {
        report: validateKubernetes(input, version, disabled),
        error: "",
      };
    } catch (error) {
      return {
        report: null,
        error:
          error instanceof Error
            ? error.message
            : "Could not validate this manifest.",
      };
    }
  }, [input, version, disabled]);
  const report = result.report,
    json = JSON.stringify(report, null, 2);
  const toggle = (id: KubernetesRule) =>
    setDisabled((values) =>
      values.includes(id) ? values.filter((x) => x !== id) : [...values, id],
    );
  return (
    <RegisteredToolLayout
      tool={tool}
      inputLabel="Kubernetes YAML"
      outputLabel="Validation report"
      toolbar={
        <>
          <Button>
            <CheckCircle2 />
            Validate locally
          </Button>
          <ExampleButton onLoad={() => setInput(sample)} />
          <ResetButton label="Clear" onReset={() => setInput("")} />
        </>
      }
      input={
        <section
          aria-label="Manifest input"
          className="bg-card min-h-80 space-y-4 rounded-xl border p-5"
        >
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            Passing local validation does not make a manifest secure and is not
            a server-side dry run.
          </div>
          <label htmlFor="k8s-input" className="text-sm font-medium">
            Paste or upload Kubernetes YAML
          </label>
          <textarea
            id="k8s-input"
            className="bg-background min-h-72 w-full rounded border p-3 font-mono text-sm"
            maxLength={1000000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <input
            type="file"
            accept=".yaml,.yml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void file.text().then(setInput);
            }}
          />
          <label htmlFor="k8s-version">Target Kubernetes version</label>
          <select
            id="k8s-version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          >
            {KUBERNETES_VERSIONS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          {result.error ? (
            <p role="alert" className="text-destructive">
              {result.error}
            </p>
          ) : null}
          <fieldset>
            <legend className="font-medium">Best-practice rules</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {KUBERNETES_RULES.map((rule) => (
                <label className="text-sm" key={rule.id}>
                  <input
                    className="mr-2"
                    type="checkbox"
                    checked={!disabled.includes(rule.id)}
                    onChange={() => toggle(rule.id)}
                  />
                  {rule.label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      }
      output={
        <OutputPanel
          title="Validation report"
          isEmpty={!report}
          toolbar={
            <>
              {report ? (
                <>
                  <CopyButton
                    label="Copy formatted YAML"
                    text={report.formatted}
                  />
                  <DownloadButton
                    content={report.formatted}
                    filename="manifest.yaml"
                    label="YAML"
                  />
                  <DownloadButton
                    content={json}
                    filename="kubernetes-report.json"
                    label="JSON report"
                  />
                </>
              ) : null}
            </>
          }
        >
          <>
            {report ? (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded border p-2">
                    {report.resources.length}
                    <br />
                    Resources
                  </div>
                  <div className="rounded border p-2">
                    {report.errors.length}
                    <br />
                    Schema/syntax errors
                  </div>
                  <div className="rounded border p-2">
                    {report.recommendations.length}
                    <br />
                    Recommendations
                  </div>
                </div>
                <section>
                  <h3 className="font-semibold">Schema and syntax errors</h3>
                  {report.errors.length ? (
                    report.errors.map((item, i) => (
                      <p className="mt-2 text-sm" key={i}>
                        Document {item.document} · {item.kind ?? "Unknown"}/
                        {item.name ?? "Unnamed"} · {item.path}: {item.message}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm">
                      No bundled-schema or syntax errors found.
                    </p>
                  )}
                </section>
                <section>
                  <h3 className="font-semibold">Opinionated recommendations</h3>
                  {report.recommendations.map((item, i) => (
                    <p className="mt-2 text-sm" key={i}>
                      Document {item.document} · {item.path}: {item.message}
                    </p>
                  ))}
                </section>
              </div>
            ) : null}
          </>
        </OutputPanel>
      }
      instructions={
        <div>
          <p>
            Validation is entirely local. Syntax/schema errors are shown
            separately from opinionated recommendations. Bundled schemas cover
            common built-in resources for Kubernetes {version}; custom resources
            may require a CRD-specific custom schema in a future extension.
          </p>
          <p className="mt-3">
            Unsafe YAML tags, excessive aliases, inputs above 1 MB, and
            manifests nested beyond 40 levels are rejected.
          </p>
        </div>
      }
    />
  );
}
