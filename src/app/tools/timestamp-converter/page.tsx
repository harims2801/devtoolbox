import { TimestampConverterTool } from "@/components/tools/timestamp-converter-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("unix-timestamp-converter");

export default function TimestampConverterPage() {
  return <TimestampConverterTool />;
}
