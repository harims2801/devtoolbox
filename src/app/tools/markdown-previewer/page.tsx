import { MarkdownPreviewerTool } from "@/components/tools/markdown-previewer-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("markdown-previewer");

export default function MarkdownPreviewerPage() {
  return <MarkdownPreviewerTool />;
}
