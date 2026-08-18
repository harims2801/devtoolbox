import type { Metadata } from "next";
import { DiffCheckerTool } from "@/components/tools/diff-checker-tool";
export const metadata: Metadata = {
  title: "Text and JSON Diff Checker",
  description:
    "Compare text line-by-line or find semantic JSON differences locally.",
};
export default function TextDiffPage() {
  return <DiffCheckerTool />;
}
