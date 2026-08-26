import { WebhookTesterTool } from "@/components/tools/webhook-tester-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("webhook-payload-tester");

export default function WebhookTesterPage() {
  return <WebhookTesterTool />;
}
