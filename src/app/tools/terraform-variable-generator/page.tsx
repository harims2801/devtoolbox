import type { Metadata } from "next";
import { TerraformVariableGeneratorTool } from "@/components/tools/terraform-variable-generator-tool";
export const metadata: Metadata = {
  title: "Terraform Variable Generator",
  description:
    "Infer Terraform variable declarations and tfvars files from structured examples locally.",
};
export default function TerraformVariableGeneratorPage() {
  return <TerraformVariableGeneratorTool />;
}
