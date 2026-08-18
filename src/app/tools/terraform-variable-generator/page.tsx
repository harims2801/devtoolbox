import { TerraformVariableGeneratorTool } from "@/components/tools/terraform-variable-generator-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("terraform-variable-generator");
export default function TerraformVariableGeneratorPage() {
  return <TerraformVariableGeneratorTool />;
}
