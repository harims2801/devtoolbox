import { QueryStringBuilderTool } from "@/components/tools/query-string-builder-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("query-string-builder");

export default function QueryStringBuilderPage() {
  return <QueryStringBuilderTool />;
}
