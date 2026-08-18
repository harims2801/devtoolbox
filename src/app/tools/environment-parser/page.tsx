import { EnvironmentParserTool } from "@/components/tools/environment-parser-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("environment-variable-parser");
export default function EnvironmentParserPage() {
  return <EnvironmentParserTool />;
}
