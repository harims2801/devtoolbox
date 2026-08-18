import type { Metadata } from "next";
import { SensitiveDataMaskerTool } from "@/components/tools/sensitive-data-masker-tool";
export const metadata: Metadata = {
  title: "Sensitive Data Masker",
  description:
    "Detect and locally redact common secrets and personal identifiers in logs and text.",
};
export default function SensitiveDataMaskerPage() {
  return <SensitiveDataMaskerTool />;
}
