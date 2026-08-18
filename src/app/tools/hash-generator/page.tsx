import type { Metadata } from "next";
import { HashGeneratorTool } from "@/components/tools/hash-generator-tool";
export const metadata: Metadata = {
  title: "Browser Hash Generator",
  description:
    "Generate SHA-1, SHA-256, SHA-384, and SHA-512 hashes for text and local files.",
};
export default function HashGeneratorPage() {
  return <HashGeneratorTool />;
}
