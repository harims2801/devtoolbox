import { UrlParserTool } from "@/components/tools/url-parser-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("url-parser");

export default function UrlParserPage() {
  return <UrlParserTool />;
}
