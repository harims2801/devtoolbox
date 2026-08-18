import { HttpHeaderAnalyzerTool } from "@/components/tools/http-header-analyzer-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("http-header-analyzer");

export default function HttpHeaderAnalyzerPage() {
  return <HttpHeaderAnalyzerTool />;
}
