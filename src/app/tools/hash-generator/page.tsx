import { HashGeneratorTool } from "@/components/tools/hash-generator-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("hash-generator");
export default function HashGeneratorPage() {
  return <HashGeneratorTool />;
}
