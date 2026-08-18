import type { Metadata } from "next";
import { EnvironmentParserTool } from "@/components/tools/environment-parser-tool";
export const metadata: Metadata = {
  title: "Environment Variable Parser and Converter",
  description:
    "Parse, validate, mask, and convert environment variables locally.",
};
export default function EnvironmentParserPage() {
  return <EnvironmentParserTool />;
}
