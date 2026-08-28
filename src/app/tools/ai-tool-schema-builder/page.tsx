import { AiToolSchemaBuilderTool } from "@/components/tools/ai-tool-schema-builder-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("ai-tool-schema-builder");

export default function AiToolSchemaBuilderPage() {
  return <AiToolSchemaBuilderTool />;
}
