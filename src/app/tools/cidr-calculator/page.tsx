import { CidrCalculatorTool } from "@/components/tools/cidr-calculator-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("cidr-ip-calculator");
export default function CidrCalculatorPage() {
  return <CidrCalculatorTool />;
}
