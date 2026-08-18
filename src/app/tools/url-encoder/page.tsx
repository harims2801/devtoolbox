import { UrlEncoderTool } from "@/components/tools/url-encoder-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("url-encoder-decoder");

export default function UrlEncoderPage() {
  return <UrlEncoderTool />;
}
