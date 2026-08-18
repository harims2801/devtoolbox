import { TestDataGeneratorTool } from "@/components/tools/test-data-generator-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("fake-test-data-generator");
export default function TestDataGeneratorPage() {
  return <TestDataGeneratorTool />;
}
