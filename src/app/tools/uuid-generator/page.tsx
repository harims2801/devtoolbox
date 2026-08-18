import type { Metadata } from "next";
import { UuidGeneratorTool } from "@/components/tools/uuid-generator-tool";
export const metadata: Metadata = {
  title: "Secure UUID v4 Generator",
  description:
    "Generate up to 1,000 cryptographically secure UUID v4 identifiers locally.",
};
export default function UuidGeneratorPage() {
  return <UuidGeneratorTool />;
}
