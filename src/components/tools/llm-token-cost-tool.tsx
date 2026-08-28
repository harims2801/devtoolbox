"use client";

import { useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { OutputPanel } from "@/components/tools/output-panel";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  sortCostComparisons,
  tokenBreakdown,
  type CostUsage,
} from "@/lib/llm-cost-tools";
import type {
  PricingImportResult,
  PricingPlan,
} from "@/lib/pricing-page-shared";

export const SAVED_LLM_PRICING_KEY = "devtoolbox:llm-pricing:v1";

const presets = [
  ["OpenAI", "https://developers.openai.com/api/docs/pricing"],
  ["Anthropic", "https://platform.claude.com/docs/en/about-claude/pricing"],
  ["Google AI", "https://ai.google.dev/gemini-api/docs/pricing"],
  ["Amazon Bedrock", "https://aws.amazon.com/bedrock/pricing/"],
  [
    "Microsoft Azure",
    "https://azure.microsoft.com/en-us/pricing/details/azure-openai/",
  ],
  ["Custom URL", ""],
] as const;

function blankPlan(): PricingPlan {
  return {
    id: "draft",
    provider: "",
    model: "",
    currency: "USD",
    unitTokens: 1_000_000,
    inputPrice: 0,
    outputPrice: 0,
  };
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function money(value: number, currency: PricingPlan["currency"]) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value < 0.01 ? 6 : 4,
  }).format(value);
}

export function LlmTokenCostTool() {
  const tool = getToolById("llm-token-cost-calculator");
  if (!tool) throw new Error("LLM token and cost metadata is missing");
  const [parts, setParts] = useState({
      system: "",
      user: "",
      tools: "",
      context: "",
    }),
    tokens = useMemo(() => tokenBreakdown(parts), [parts]),
    [inputTokens, setInputTokens] = useState<number | undefined>(),
    [cachedInputTokens, setCachedInputTokens] = useState(0),
    [outputTokens, setOutputTokens] = useState(500),
    [requests, setRequests] = useState(1),
    [pricingUrl, setPricingUrl] = useState<string>(presets[0][1]),
    [draft, setDraft] = useState<PricingPlan>(blankPlan),
    [reviewed, setReviewed] = useState(false),
    [importResult, setImportResult] = useState<PricingImportResult>(),
    [importError, setImportError] = useState(""),
    [loading, setLoading] = useState(false),
    {
      value: savedPlans,
      setValue: setSavedPlans,
      isHydrated,
    } = useLocalStorage<PricingPlan[]>(SAVED_LLM_PRICING_KEY, []),
    usage: CostUsage = {
      inputTokens: inputTokens ?? tokens.total,
      cachedInputTokens,
      outputTokens,
      requests,
    };

  const comparisons = (() => {
      try {
        return sortCostComparisons(savedPlans, usage);
      } catch {
        return [];
      }
    })(),
    comparableCurrency =
      new Set(savedPlans.map((plan) => plan.currency)).size <= 1;

  function updatePart(key: keyof typeof parts, value: string) {
    setParts((current) => ({ ...current, [key]: value }));
  }

  async function importPricing() {
    setLoading(true);
    setImportError("");
    setImportResult(undefined);
    setReviewed(false);
    try {
      const response = await fetch("/api/ai-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pricingUrl }),
      });
      const payload = (await response.json()) as PricingImportResult & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error || "Pricing import failed safely.");
      setImportResult(payload);
      const first = payload.plans[0];
      if (first) setDraft({ ...first, id: "draft" });
      else
        setDraft({
          ...blankPlan(),
          provider: payload.provider,
          sourceUrl: payload.finalUrl,
          retrievedAt: payload.retrievedAt,
        });
    } catch (caught) {
      setImportError(
        caught instanceof Error
          ? caught.message
          : "Pricing import failed safely.",
      );
    } finally {
      setLoading(false);
    }
  }

  function saveDraft() {
    if (!reviewed || !draft.provider.trim() || !draft.model.trim()) return;
    const saved = { ...draft, id: `pricing-${Date.now()}` };
    setSavedPlans((current) => [...current, saved].slice(-50));
    setReviewed(false);
  }

  const input = (
    <div className="space-y-5">
      <section className="bg-card space-y-4 rounded-xl border p-5">
        <div>
          <h2 className="font-semibold">1. Estimate prompt tokens</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Provider-neutral planning estimate; use an API usage value or
            provider tokenizer when exact billing tokens matter.
          </p>
        </div>
        {(
          [
            ["system", "System instructions"],
            ["user", "User prompt"],
            ["tools", "Tool definitions"],
            ["context", "Retrieved context / history"],
          ] as const
        ).map(([key, label]) => (
          <label className="block text-sm font-medium" key={key}>
            {label}{" "}
            <span className="text-muted-foreground font-normal">
              · ~{tokens[key].toLocaleString()} tokens
            </span>
            <textarea
              className="bg-background mt-2 min-h-24 w-full rounded-md border p-3 font-mono text-sm"
              value={parts[key]}
              onChange={(event) => updatePart(key, event.target.value)}
            />
          </label>
        ))}
      </section>

      <section className="bg-card space-y-4 rounded-xl border p-5">
        <div>
          <h2 className="font-semibold">2. Workload</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Override the estimated input when you have an exact token count.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="Input tokens per request"
            value={inputTokens ?? tokens.total}
            onChange={setInputTokens}
          />
          <NumberField
            label="Cached input tokens"
            value={cachedInputTokens}
            onChange={setCachedInputTokens}
          />
          <NumberField
            label="Output tokens per request"
            value={outputTokens}
            onChange={setOutputTokens}
          />
          <NumberField
            label="Number of requests"
            value={requests}
            onChange={setRequests}
            minimum={1}
          />
        </div>
        {cachedInputTokens > usage.inputTokens ? (
          <p className="text-destructive text-sm" role="alert">
            Cached input cannot exceed total input.
          </p>
        ) : null}
        {inputTokens !== undefined ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setInputTokens(undefined)}
          >
            Use prompt estimate
          </Button>
        ) : null}
      </section>

      <section className="bg-card space-y-4 rounded-xl border p-5">
        <div>
          <h2 className="font-semibold">3. Import or enter provider pricing</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            The server retrieves only a public HTTPS page with pinned DNS, size
            limits, timeouts, and validated redirects. Imported values must be
            reviewed.
          </p>
        </div>
        <label className="block text-sm font-medium">
          Pricing source
          <select
            className="bg-background mt-2 h-11 w-full rounded-md border px-3"
            value={
              presets.find(([, url]) => url === pricingUrl)?.[0] ?? "Custom URL"
            }
            onChange={(event) => {
              const selected = presets.find(
                ([name]) => name === event.target.value,
              );
              setPricingUrl(selected?.[1] ?? "");
            }}
          >
            {presets.map(([name]) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Public HTTPS pricing-page URL
          <input
            className="bg-background mt-2 h-11 w-full rounded-md border px-3 font-mono text-sm"
            value={pricingUrl}
            onChange={(event) => setPricingUrl(event.target.value)}
            placeholder="https://provider.example/pricing"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={importPricing}
            disabled={loading || !pricingUrl.trim()}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />{" "}
            {loading ? "Importing…" : "Import pricing"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(blankPlan());
              setImportResult(undefined);
              setImportError("");
              setReviewed(false);
            }}
          >
            <Plus /> Enter manually
          </Button>
        </div>
        {importError ? (
          <p className="text-destructive text-sm" role="alert">
            {importError}
          </p>
        ) : null}
        {importResult ? (
          <div className="space-y-3 rounded-lg border p-3 text-sm">
            <p>
              <strong>{importResult.plans.length}</strong> complete pricing rows
              extracted from{" "}
              <span className="font-mono break-all">
                {importResult.finalUrl}
              </span>
              .
            </p>
            {importResult.plans.length ? (
              <label className="block font-medium">
                Extracted row
                <select
                  className="bg-background mt-2 h-10 w-full rounded-md border px-2"
                  onChange={(event) => {
                    const plan = importResult.plans[Number(event.target.value)];
                    if (plan) {
                      setDraft({ ...plan, id: "draft" });
                      setReviewed(false);
                    }
                  }}
                >
                  {importResult.plans.map((plan, index) => (
                    <option value={index} key={`${plan.id}-${index}`}>
                      {plan.model} · {plan.currency} {plan.inputPrice}/
                      {plan.outputPrice}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {importResult.warnings.map((warning) => (
              <p className="text-amber-700 dark:text-amber-300" key={warning}>
                Review: {warning}
              </p>
            ))}
          </div>
        ) : null}
        <PricingEditor
          plan={draft}
          setPlan={(plan) => {
            setDraft(plan);
            setReviewed(false);
          }}
        />
        <label className="flex items-start gap-2 text-sm">
          <input
            className="mt-1"
            type="checkbox"
            checked={reviewed}
            onChange={(event) => setReviewed(event.target.checked)}
          />
          I verified the model, currency, unit and prices against the linked
          provider page.
        </label>
        <Button
          type="button"
          onClick={saveDraft}
          disabled={!reviewed || !draft.provider.trim() || !draft.model.trim()}
        >
          <Save /> Save for comparison
        </Button>
      </section>
    </div>
  );

  const output = (
    <OutputPanel
      title="Cost comparison"
      emptyMessage="Save at least one reviewed pricing option to compare costs."
      isEmpty={!isHydrated || !savedPlans.length}
    >
      <div className="space-y-4" data-testid="llm-cost-comparison">
        <section className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="Estimated prompt tokens"
            value={tokens.total.toLocaleString()}
          />
          <Metric
            label="Costed input tokens"
            value={usage.inputTokens.toLocaleString()}
          />
          <Metric label="Requests" value={usage.requests.toLocaleString()} />
        </section>
        {savedPlans.length && !comparisons.length ? (
          <p className="text-destructive text-sm" role="alert">
            Fix the workload values before calculating costs.
          </p>
        ) : null}
        <div className="overflow-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Provider / model</th>
                <th className="p-3">Input</th>
                <th className="p-3">Cached</th>
                <th className="p-3">Output</th>
                <th className="p-3">Estimated total</th>
                <th className="p-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map(({ plan, estimate }, index) => (
                <tr className="border-t" key={plan.id}>
                  <td className="p-3">
                    <strong>{plan.provider}</strong>
                    <span className="block">{plan.model}</span>
                    <span className="text-muted-foreground block text-xs">
                      per {plan.unitTokens.toLocaleString()} tokens
                      {index === 0 && comparableCurrency ? " · lowest" : ""}
                    </span>
                  </td>
                  <td className="p-3">
                    {money(estimate.uncachedInputCost, plan.currency)}
                  </td>
                  <td className="p-3">
                    {money(estimate.cachedInputCost, plan.currency)}
                  </td>
                  <td className="p-3">
                    {money(estimate.outputCost, plan.currency)}
                  </td>
                  <td className="p-3 font-semibold">
                    {money(estimate.totalCost, plan.currency)}
                  </td>
                  <td className="p-3">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${plan.provider} ${plan.model}`}
                      onClick={() =>
                        setSavedPlans((current) =>
                          current.filter((item) => item.id !== plan.id),
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground text-sm">
          Comparisons are meaningful only when currency, billing tier, region,
          token unit and caching rules match. Saved pricing stays in this
          browser; prompt text is never saved.
        </p>
        {!comparableCurrency ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Mixed currencies are shown without a cheapest label; convert them to
            one currency before comparing totals.
          </p>
        ) : null}
      </div>
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      output={output}
      instructions={[
        "Paste prompt sections to get a clearly labelled provider-neutral token estimate.",
        "Import a public pricing page or enter rates manually, then verify every value before saving.",
        "Add multiple reviewed plans to compare the same workload side by side.",
      ]}
      faqs={[
        {
          question: "Is the token count exact?",
          answer:
            "No. It is a provider-neutral planning estimate. For billing reconciliation, enter the exact usage value reported by the provider or its official tokenizer.",
        },
        {
          question: "Can every pricing page be parsed?",
          answer:
            "No. Pricing pages change and some render data with JavaScript or contain tiered rules. The importer extracts conventional HTML tables and always requires review; manual entry remains available.",
        },
        {
          question: "What is saved?",
          answer:
            "Only pricing plans you explicitly save are stored in localStorage. Prompt text, imported page bodies, and calculations are not persisted or added to the URL.",
        },
      ]}
    />
  );
}

function NumberField({
  label,
  value,
  onChange,
  minimum = 0,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  minimum?: number;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        className="bg-background mt-2 h-11 w-full rounded-md border px-3 font-mono"
        type="number"
        min={minimum}
        step="1"
        value={value}
        onChange={(event) => onChange(numberValue(event.target.value))}
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function PricingEditor({
  plan,
  setPlan,
}: {
  plan: PricingPlan;
  setPlan: (plan: PricingPlan) => void;
}) {
  const field =
    (key: "inputPrice" | "cachedInputPrice" | "outputPrice") =>
    (value: string) =>
      setPlan({
        ...plan,
        [key]:
          value === "" && key === "cachedInputPrice"
            ? undefined
            : numberValue(value),
      });
  return (
    <fieldset className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
      <legend className="px-1 text-sm font-semibold">
        Reviewable pricing draft
      </legend>
      <label className="text-sm font-medium">
        Provider
        <input
          className="bg-background mt-2 h-10 w-full rounded-md border px-2"
          value={plan.provider}
          onChange={(event) =>
            setPlan({ ...plan, provider: event.target.value })
          }
        />
      </label>
      <label className="text-sm font-medium">
        Model / tier
        <input
          className="bg-background mt-2 h-10 w-full rounded-md border px-2"
          value={plan.model}
          onChange={(event) => setPlan({ ...plan, model: event.target.value })}
        />
      </label>
      <label className="text-sm font-medium">
        Currency
        <select
          className="bg-background mt-2 h-10 w-full rounded-md border px-2"
          value={plan.currency}
          onChange={(event) =>
            setPlan({
              ...plan,
              currency: event.target.value as PricingPlan["currency"],
            })
          }
        >
          {["USD", "EUR", "GBP"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Price unit
        <select
          className="bg-background mt-2 h-10 w-full rounded-md border px-2"
          value={plan.unitTokens}
          onChange={(event) =>
            setPlan({
              ...plan,
              unitTokens: Number(
                event.target.value,
              ) as PricingPlan["unitTokens"],
            })
          }
        >
          <option value={1000000}>1 million tokens</option>
          <option value={1000}>1,000 tokens</option>
        </select>
      </label>
      <label className="text-sm font-medium">
        Input price
        <input
          className="bg-background mt-2 h-10 w-full rounded-md border px-2"
          type="number"
          min="0"
          step="any"
          value={plan.inputPrice}
          onChange={(event) => field("inputPrice")(event.target.value)}
        />
      </label>
      <label className="text-sm font-medium">
        Cached input price (optional)
        <input
          className="bg-background mt-2 h-10 w-full rounded-md border px-2"
          type="number"
          min="0"
          step="any"
          value={plan.cachedInputPrice ?? ""}
          onChange={(event) => field("cachedInputPrice")(event.target.value)}
        />
      </label>
      <label className="text-sm font-medium">
        Output price
        <input
          className="bg-background mt-2 h-10 w-full rounded-md border px-2"
          type="number"
          min="0"
          step="any"
          value={plan.outputPrice}
          onChange={(event) => field("outputPrice")(event.target.value)}
        />
      </label>
      <div className="text-muted-foreground self-end text-xs">
        {plan.sourceUrl ? (
          <>
            Source:{" "}
            <span className="font-mono break-all">{plan.sourceUrl}</span>
          </>
        ) : (
          "Manual pricing entry"
        )}
      </div>
    </fieldset>
  );
}
