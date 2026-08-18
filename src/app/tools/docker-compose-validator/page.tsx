import { DockerComposeValidatorTool } from "@/components/tools/docker-compose-validator-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("docker-compose-validator");

export default function DockerComposeValidatorPage() {
  return <DockerComposeValidatorTool />;
}
