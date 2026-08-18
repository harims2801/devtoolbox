import { DateDifferenceTool } from "@/components/tools/date-difference-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("date-difference-calculator");

export default function DateDifferencePage() {
  return <DateDifferenceTool />;
}
