import type { Metadata } from "next";

import { YamlFormatterTool } from "@/components/tools/yaml-formatter-tool";

export const metadata: Metadata = {
  title: "YAML Formatter, Validator and JSON Converter",
  description:
    "Safely validate and format YAML, convert YAML and JSON, inspect multiple documents, and process local files entirely in your browser.",
};

export default function YamlFormatterPage() {
  return <YamlFormatterTool />;
}
