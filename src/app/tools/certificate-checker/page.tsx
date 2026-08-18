import type { Metadata } from "next";
import { CertificateCheckerTool } from "@/components/tools/certificate-checker-tool";
export const metadata: Metadata = {
  title: "TLS Certificate Expiry Checker",
  description:
    "Inspect public TLS certificate validity, hostname matching, and expiry status.",
};
export default function CertificateCheckerPage() {
  return <CertificateCheckerTool />;
}
