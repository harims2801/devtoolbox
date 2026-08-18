import { TimeZoneConverterTool } from "@/components/tools/time-zone-converter-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("time-zone-converter");
export default function TimeZoneConverterPage() {
  return <TimeZoneConverterTool />;
}
