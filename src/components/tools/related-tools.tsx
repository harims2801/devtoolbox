import Link from "next/link";

import { getRelatedTools, type ToolDefinition } from "@/config/tool-registry";

export function RelatedTools({
  tool,
  limit = 4,
}: {
  tool: ToolDefinition;
  limit?: number;
}) {
  const relatedTools = getRelatedTools(tool, limit);

  if (!relatedTools.length) return null;

  return (
    <ul className="space-y-2">
      {relatedTools.map((relatedTool) => (
        <li key={relatedTool.id}>
          <Link
            className="hover:bg-accent block rounded-lg border p-3"
            href={relatedTool.route}
          >
            <p className="text-sm font-medium">{relatedTool.shortName}</p>
            {relatedTool.availability === "planned" ? (
              <p className="text-muted-foreground mt-1 text-xs">Coming soon</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
