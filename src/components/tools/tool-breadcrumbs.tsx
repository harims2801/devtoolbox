import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { getCategoryById, type ToolDefinition } from "@/config/tool-registry";

export function ToolBreadcrumbs({ tool }: { tool: ToolDefinition }) {
  const category = getCategoryById(tool.category);

  return (
    <Breadcrumbs
      items={[
        { label: "Tools", href: "/tools" },
        {
          label: category?.name ?? "Developer tools",
          href: category ? `/tools/category/${category.slug}` : "/tools",
        },
        { label: tool.name },
      ]}
    />
  );
}
