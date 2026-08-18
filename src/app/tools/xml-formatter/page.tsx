import { XmlFormatterTool } from "@/components/tools/xml-formatter-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("xml-formatter-validator");

export default function XmlFormatterPage() {
  return <XmlFormatterTool />;
}
