import { Base64Tool } from "@/components/tools/base64-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("base64-encoder-decoder");

export default function Base64Page() {
  return <Base64Tool />;
}
