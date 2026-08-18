import type { Metadata } from "next";

import { Base64Tool } from "@/components/tools/base64-tool";

export const metadata: Metadata = {
  title: "Base64 Encoder and Decoder",
  description:
    "Encode and decode Unicode text, Base64URL values, and local files safely in your browser.",
};

export default function Base64Page() {
  return <Base64Tool />;
}
