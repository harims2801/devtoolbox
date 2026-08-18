import { PasswordGeneratorTool } from "@/components/tools/password-generator-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("random-password-generator");
export default function PasswordGeneratorPage() {
  return <PasswordGeneratorTool />;
}
