import type { Metadata } from "next";

import { TimestampConverterTool } from "@/components/tools/timestamp-converter-tool";

export const metadata: Metadata = {
  title: "Unix Timestamp and Date Converter",
  description:
    "Convert Unix seconds, milliseconds, and zoned dates into local, UTC, ISO, RFC, and relative formats in your browser.",
};

export default function TimestampConverterPage() {
  return <TimestampConverterTool />;
}
