import type { Metadata } from "next";
import { CidrCalculatorTool } from "@/components/tools/cidr-calculator-tool";
export const metadata: Metadata = {
  title: "CIDR and IP Address Calculator",
  description:
    "Calculate IPv4 subnets and inspect IPv6 addresses locally with integer-safe operations.",
};
export default function CidrCalculatorPage() {
  return <CidrCalculatorTool />;
}
