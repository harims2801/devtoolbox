import { CertificateCheckerTool } from "@/components/tools/certificate-checker-tool";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("certificate-expiry-checker");
export default function CertificateCheckerPage() {
  return <CertificateCheckerTool />;
}
