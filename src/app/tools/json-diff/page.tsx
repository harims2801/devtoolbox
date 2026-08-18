import { JsonDiffTool } from "@/components/tools/json-diff-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("json-diff-checker");

export default function JsonDiffPage() {
  return <JsonDiffTool />;
}
