import { YamlFormatterTool } from "@/components/tools/yaml-formatter-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("yaml-formatter-converter");

export default function YamlFormatterPage() {
  return <YamlFormatterTool />;
}
