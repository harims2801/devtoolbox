import type { Metadata } from "next";
import { RegexTesterTool } from "@/components/tools/regex-tester-tool";

export const metadata: Metadata = {
  title: "JavaScript Regular Expression Tester",
  description:
    "Test JavaScript-compatible regex patterns, flags, groups, and replacements locally.",
};
export default function RegexTesterPage() {
  return <RegexTesterTool />;
}
