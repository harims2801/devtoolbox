import { LlmTokenCostTool } from "@/components/tools/llm-token-cost-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("llm-token-cost-calculator");

export default function LlmTokenCostCalculatorPage() {
  return <LlmTokenCostTool />;
}
