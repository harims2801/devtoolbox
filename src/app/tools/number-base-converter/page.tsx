import { NumberBaseConverterTool } from "@/components/tools/number-base-converter-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("hex-binary-decimal-ascii-converter");

export default function NumberBaseConverterPage() {
  return <NumberBaseConverterTool />;
}
