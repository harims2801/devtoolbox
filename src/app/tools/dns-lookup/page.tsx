import { DnsLookupTool } from "@/components/tools/dns-lookup-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("dns-lookup");

export default function DnsLookupPage() {
  return <DnsLookupTool />;
}
