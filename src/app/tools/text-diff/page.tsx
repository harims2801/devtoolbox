import { DiffCheckerTool } from "@/components/tools/diff-checker-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("text-diff-checker");
export default function TextDiffPage() {
  return <DiffCheckerTool />;
}
