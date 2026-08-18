import { CronBuilderTool } from "@/components/tools/cron-builder-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("cron-expression-builder");

export default function CronBuilderPage() {
  return <CronBuilderTool />;
}
