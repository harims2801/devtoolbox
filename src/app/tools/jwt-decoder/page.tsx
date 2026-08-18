import { JwtInspectorTool } from "@/components/tools/jwt-inspector-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("jwt-decoder-inspector");

export default function JwtDecoderPage() {
  return <JwtInspectorTool />;
}
