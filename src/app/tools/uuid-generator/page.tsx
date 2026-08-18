import { UuidGeneratorTool } from "@/components/tools/uuid-generator-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("uuid-generator");
export default function UuidGeneratorPage() {
  return <UuidGeneratorTool />;
}
