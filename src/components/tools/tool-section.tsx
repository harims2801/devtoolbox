import { ToolGrid } from "@/components/tools/tool-grid";
import type { ToolDefinition } from "@/config/tool-registry";

export function ToolSection({
  id,
  title,
  description,
  tools,
}: {
  id: string;
  title: string;
  description: string;
  tools: readonly ToolDefinition[];
}) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight" id={id}>
          {title}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      <ToolGrid compact tools={tools} />
    </section>
  );
}
