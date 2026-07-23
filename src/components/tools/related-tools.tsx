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
          {relatedTool.availability === "available" ? (
            <Link
              className="hover:bg-accent block rounded-lg border p-3 text-sm font-medium"
              href={relatedTool.route}
            >
              {relatedTool.shortName}
            </Link>
          ) : (
            <div className="bg-muted/30 rounded-lg border p-3">
              <p className="text-sm font-medium">{relatedTool.shortName}</p>
              <p className="text-muted-foreground mt-1 text-xs">Coming soon</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
