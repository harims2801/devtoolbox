import { RegexTesterTool } from "@/components/tools/regex-tester-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("regex-tester");
export default function RegexTesterPage() {
  return <RegexTesterTool />;
}
