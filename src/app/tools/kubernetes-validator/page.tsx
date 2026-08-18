import type { Metadata } from "next";
import { KubernetesValidatorTool } from "@/components/tools/kubernetes-validator-tool";
export const metadata: Metadata = {
  title: "Kubernetes YAML Validator",
  description:
    "Validate Kubernetes YAML structure and review best-practice recommendations locally.",
};
export default function KubernetesValidatorPage() {
  return <KubernetesValidatorTool />;
}
