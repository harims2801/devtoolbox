import { LoremIpsumTool } from "@/components/tools/lorem-ipsum-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("lorem-ipsum-generator");
export default function LoremIpsumPage() {
  return <LoremIpsumTool />;
}
