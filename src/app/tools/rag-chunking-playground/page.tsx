import { RagChunkingPlaygroundTool } from "@/components/tools/rag-chunking-playground-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("rag-chunking-playground");

export default function RagChunkingPlaygroundPage() {
  return <RagChunkingPlaygroundTool />;
}
