import { UserAgentParserTool } from "@/components/tools/user-agent-parser-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("user-agent-parser");

export default function UserAgentParserPage() {
  return <UserAgentParserTool />;
}
