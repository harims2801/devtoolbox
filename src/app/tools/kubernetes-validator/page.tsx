import { KubernetesValidatorTool } from "@/components/tools/kubernetes-validator-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("kubernetes-yaml-validator");
export default function KubernetesValidatorPage() {
  return <KubernetesValidatorTool />;
}
