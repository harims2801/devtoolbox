import { CaseConverterTool } from "@/components/tools/case-converter-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("case-converter");

export default function CaseConverterPage() {
  return <CaseConverterTool />;
}
