import { SensitiveDataMaskerTool } from "@/components/tools/sensitive-data-masker-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("sensitive-data-masker");
export default function SensitiveDataMaskerPage() {
  return <SensitiveDataMaskerTool />;
}
