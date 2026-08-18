import type { Metadata } from "next";

import { CronBuilderTool } from "@/components/tools/cron-builder-tool";

export const metadata: Metadata = {
  title: "Cron Expression Builder and Explainer",
  description:
    "Build, validate, explain, and preview standard five-field Unix cron schedules in your browser.",
};

export default function CronBuilderPage() {
  return <CronBuilderTool />;
}
