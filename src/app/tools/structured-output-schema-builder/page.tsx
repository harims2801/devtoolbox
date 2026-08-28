import { StructuredOutputSchemaTool } from "@/components/tools/structured-output-schema-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("structured-output-schema-builder");

export default function StructuredOutputSchemaBuilderPage() {
  return <StructuredOutputSchemaTool />;
}
