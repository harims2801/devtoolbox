import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  toolCategories,
  type ProcessingType,
  type ToolCategoryId,
  type ToolSort,
} from "@/config/tool-registry";

export function ToolFilters({
  category,
  processingType,
  sort,
}: {
  category?: ToolCategoryId;
  processingType?: ProcessingType;
  sort: ToolSort;
}) {
  return (
    <form
      action="/tools"
      className="bg-card grid gap-4 rounded-xl border p-4 sm:grid-cols-3 sm:items-end"
    >
      <label className="grid gap-1.5 text-sm font-medium">
        Category
        <select
          className="bg-background focus-visible:outline-ring h-10 rounded-md border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
          defaultValue={category ?? ""}
          name="category"
        >
          <option value="">All categories</option>
          {toolCategories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-sm font-medium">
        Processing
        <select
          className="bg-background focus-visible:outline-ring h-10 rounded-md border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
          defaultValue={processingType ?? ""}
          name="processing"
        >
          <option value="">All processing types</option>
          <option value="browser">Browser only</option>
          <option value="server-assisted">Server assisted</option>
        </select>
      </label>

      <label className="grid gap-1.5 text-sm font-medium">
        Sort
        <select
          className="bg-background focus-visible:outline-ring h-10 rounded-md border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
          defaultValue={sort}
          name="sort"
        >
          <option value="alphabetical">Alphabetical</option>
          <option value="popularity">Popularity</option>
        </select>
      </label>

      <div className="flex flex-wrap gap-2 sm:col-span-3">
        <Button type="submit">Apply filters</Button>
        <Button asChild type="button" variant="ghost">
          <Link href="/tools">Clear</Link>
        </Button>
      </div>
    </form>
  );
}
