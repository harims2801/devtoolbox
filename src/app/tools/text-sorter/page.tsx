import { TextSorterTool } from "@/components/tools/text-sorter-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("text-sorter-deduplicator");

export default function TextSorterPage() {
  return <TextSorterTool />;
}
