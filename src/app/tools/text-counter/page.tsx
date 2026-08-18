import { TextCounterTool } from "@/components/tools/text-counter-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("text-counter");

export default function TextCounterPage() {
  return <TextCounterTool />;
}
