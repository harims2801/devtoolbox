import { describe, expect, it } from "vitest";
import {
  calculateLlmCost,
  estimateTokens,
  sortCostComparisons,
  tokenBreakdown,
} from "@/lib/llm-cost-tools";
import type { PricingPlan } from "@/lib/pricing-page-shared";

const plan: PricingPlan = {
  id: "a",
  provider: "Example AI",
  model: "model-a",
  currency: "USD",
  unitTokens: 1_000_000,
  inputPrice: 2,
  cachedInputPrice: 0.5,
  outputPrice: 8,
};

describe("LLM token and cost calculations", () => {
  it("returns deterministic provider-neutral token estimates", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("12345678")).toBe(2);
    expect(estimateTokens("வணக்கம்")).toBeGreaterThan(1);
    expect(
      tokenBreakdown({ system: "1234", user: "1234", tools: "", context: "" }),
    ).toEqual({
      system: 1,
      user: 1,
      tools: 0,
      context: 0,
      total: 2,
    });
  });

  it("calculates uncached, cached, output, and multi-request cost", () => {
    expect(
      calculateLlmCost(plan, {
        inputTokens: 1_000_000,
        cachedInputTokens: 250_000,
        outputTokens: 500_000,
        requests: 2,
      }),
    ).toEqual({
      uncachedInputCost: 3,
      cachedInputCost: 0.25,
      outputCost: 8,
      totalCost: 11.25,
    });
  });

  it("uses input pricing when no cached rate is published", () => {
    const withoutCache = { ...plan, cachedInputPrice: undefined };
    expect(
      calculateLlmCost(withoutCache, {
        inputTokens: 1_000_000,
        cachedInputTokens: 1_000_000,
        outputTokens: 0,
        requests: 1,
      }).totalCost,
    ).toBe(2);
  });

  it("validates invalid usage rather than producing misleading totals", () => {
    expect(() =>
      calculateLlmCost(plan, {
        inputTokens: 10,
        cachedInputTokens: 11,
        outputTokens: 0,
        requests: 1,
      }),
    ).toThrow(/cannot exceed/);
    expect(() =>
      calculateLlmCost(plan, {
        inputTokens: 10,
        cachedInputTokens: 0,
        outputTokens: 0,
        requests: 1.5,
      }),
    ).toThrow(/whole number/);
  });

  it("ranks comparisons deterministically without mutating plans", () => {
    const expensive = { ...plan, id: "b", provider: "Other", inputPrice: 20 };
    const plans = [expensive, plan];
    expect(
      sortCostComparisons(plans, {
        inputTokens: 1_000_000,
        cachedInputTokens: 0,
        outputTokens: 0,
        requests: 1,
      })[0]?.plan.id,
    ).toBe("a");
    expect(plans[0]?.id).toBe("b");
  });
});
