export type ExtractionConfidence = "high" | "medium" | "low";

export interface PricingPlan {
  id: string;
  provider: string;
  model: string;
  currency: "USD" | "EUR" | "GBP";
  unitTokens: 1_000 | 1_000_000;
  inputPrice: number;
  cachedInputPrice?: number;
  outputPrice: number;
  sourceUrl?: string;
  retrievedAt?: string;
  confidence?: ExtractionConfidence;
}

export interface PricingImportResult {
  sourceUrl: string;
  finalUrl: string;
  retrievedAt: string;
  provider: string;
  plans: PricingPlan[];
  warnings: string[];
}
