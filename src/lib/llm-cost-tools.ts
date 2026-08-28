import type { PricingPlan } from "@/lib/pricing-page-shared";

export interface TokenBreakdown {
  system: number;
  user: number;
  tools: number;
  context: number;
  total: number;
}

export interface CostUsage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  requests: number;
}

export interface CostEstimate {
  uncachedInputCost: number;
  cachedInputCost: number;
  outputCost: number;
  totalCost: number;
}

/**
 * Provider-neutral estimate for planning. It deliberately does not claim to be
 * an exact provider tokenizer: ASCII runs average about four characters per
 * token while non-ASCII graphemes receive a higher weight.
 */
export function estimateTokens(text: string) {
  if (!text) return 0;
  let ascii = 0,
    nonAscii = 0;
  for (const character of text.normalize("NFC")) {
    if (character.codePointAt(0)! <= 0x7f) ascii += 1;
    else nonAscii += 1;
  }
  return Math.max(1, Math.ceil(ascii / 4 + nonAscii / 1.5));
}

export function tokenBreakdown(parts: {
  system: string;
  user: string;
  tools: string;
  context: string;
}): TokenBreakdown {
  const result = {
    system: estimateTokens(parts.system),
    user: estimateTokens(parts.user),
    tools: estimateTokens(parts.tools),
    context: estimateTokens(parts.context),
  };
  return { ...result, total: Object.values(result).reduce((a, b) => a + b, 0) };
}

function finiteNonNegative(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`${name} must be a non-negative number.`);
}

export function calculateLlmCost(
  plan: PricingPlan,
  usage: CostUsage,
): CostEstimate {
  finiteNonNegative(usage.inputTokens, "Input tokens");
  finiteNonNegative(usage.cachedInputTokens, "Cached input tokens");
  finiteNonNegative(usage.outputTokens, "Output tokens");
  finiteNonNegative(usage.requests, "Requests");
  if (usage.cachedInputTokens > usage.inputTokens)
    throw new Error("Cached input tokens cannot exceed total input tokens.");
  if (!Number.isInteger(usage.requests))
    throw new Error("Requests must be a whole number.");
  for (const [name, value] of [
    ["Input price", plan.inputPrice],
    ["Output price", plan.outputPrice],
    ["Cached input price", plan.cachedInputPrice ?? plan.inputPrice],
  ] as const)
    finiteNonNegative(value, name);

  const divisor = plan.unitTokens,
    cachedRate = plan.cachedInputPrice ?? plan.inputPrice,
    uncachedInputCost =
      ((usage.inputTokens - usage.cachedInputTokens) / divisor) *
      plan.inputPrice *
      usage.requests,
    cachedInputCost =
      (usage.cachedInputTokens / divisor) * cachedRate * usage.requests,
    outputCost =
      (usage.outputTokens / divisor) * plan.outputPrice * usage.requests;
  return {
    uncachedInputCost,
    cachedInputCost,
    outputCost,
    totalCost: uncachedInputCost + cachedInputCost + outputCost,
  };
}

export function sortCostComparisons(
  plans: readonly PricingPlan[],
  usage: CostUsage,
) {
  return plans
    .map((plan) => ({ plan, estimate: calculateLlmCost(plan, usage) }))
    .toSorted(
      (a, b) =>
        a.estimate.totalCost - b.estimate.totalCost ||
        a.plan.provider.localeCompare(b.plan.provider) ||
        a.plan.model.localeCompare(b.plan.model),
    );
}
