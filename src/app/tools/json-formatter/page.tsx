import { JsonFormatterTool } from "@/components/tools/json-formatter-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("json-formatter-validator");

export default function JsonFormatterPage() {
  return <JsonFormatterTool />;
}
