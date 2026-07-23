import { EmptyState } from "@/components/shared/empty-state";
import { ToolCard } from "@/components/tools/tool-card";
import { getCategoryById, type ToolDefinition } from "@/config/tool-registry";

export function ToolGrid({
  tools,
  emptyTitle = "No tools match these filters",
  emptyDescription = "Try a different category, processing type, or sort order.",
  compact = false,
}: {
  tools: readonly ToolDefinition[];
  emptyTitle?: string;
  emptyDescription?: string;
  compact?: boolean;
}) {
  if (!tools.length) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard
          categoryName={
            getCategoryById(tool.category)?.name ?? "Developer tool"
          }
          compact={compact}
          key={tool.id}
          tool={tool}
        />
      ))}
    </div>
  );
}
