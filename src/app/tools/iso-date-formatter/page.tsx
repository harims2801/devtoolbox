import { IsoDateFormatterTool } from "@/components/tools/iso-date-formatter-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("iso-date-formatter");

export default function IsoDateFormatterPage() {
  return <IsoDateFormatterTool />;
}
