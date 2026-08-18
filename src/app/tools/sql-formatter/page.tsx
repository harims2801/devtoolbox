import { SqlFormatterTool } from "@/components/tools/sql-formatter-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("sql-formatter");

export default function SqlFormatterPage() {
  return <SqlFormatterTool />;
}
