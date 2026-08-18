import { HttpStatusReferenceTool } from "@/components/tools/http-status-reference-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("http-status-code-reference");

export default function HttpStatusCodesPage() {
  return <HttpStatusReferenceTool />;
}
