import { HtmlEntitiesTool } from "@/components/tools/html-entities-tool";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("html-entity-encoder-decoder");
export default function HtmlEntitiesPage() {
  return <HtmlEntitiesTool />;
}
