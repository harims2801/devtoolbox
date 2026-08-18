import { LogAnalyzerTool } from "@/components/tools/log-analyzer-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("log-formatter-analyzer");
export default function LogAnalyzerPage() {
  return <LogAnalyzerTool />;
}
