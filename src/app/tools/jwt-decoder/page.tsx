import type { Metadata } from "next";

import { JwtInspectorTool } from "@/components/tools/jwt-inspector-tool";

export const metadata: Metadata = {
  title: "JWT Decoder and Inspector",
  description:
    "Decode JWT header and payload data, inspect claims and expiration locally, with a clear warning that decoding does not verify authenticity.",
};

export default function JwtDecoderPage() {
  return <JwtInspectorTool />;
}
