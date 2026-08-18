import type { Metadata } from "next";
import { LogAnalyzerTool } from "@/components/tools/log-analyzer-tool";
export const metadata: Metadata = {
  title: "Log Formatter and Analyzer",
  description: "Parse, filter, group, and inspect common log formats locally.",
};
export default function LogAnalyzerPage() {
  return <LogAnalyzerTool />;
}
