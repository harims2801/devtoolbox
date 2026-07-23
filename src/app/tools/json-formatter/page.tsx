import type { Metadata } from "next";

import { JsonFormatterTool } from "@/components/tools/json-formatter-tool";

export const metadata: Metadata = {
  title: "JSON Formatter and Validator",
  description:
    "Format, validate, minify, sort, search, and inspect JSON locally in your browser.",
  keywords: [
    "JSON formatter",
    "JSON validator",
    "JSON minifier",
    "sort JSON keys",
    "JSON tree viewer",
  ],
};

export default function JsonFormatterPage() {
  return <JsonFormatterTool />;
}
