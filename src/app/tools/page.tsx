import type { Metadata } from "next";

import { SectionHeader } from "@/components/shared/section-header";
import { CategoryCard } from "@/components/tools/category-card";
import { ToolFilters } from "@/components/tools/tool-filters";
import { ToolGrid } from "@/components/tools/tool-grid";
import { ToolSection } from "@/components/tools/tool-section";
import {
  filterTools,
  getPopularTools,
  getRecentlyAddedTools,
  isToolCategoryId,
  sortTools,
  toolCategories,
  type ProcessingType,
  type ToolSort,
} from "@/config/tool-registry";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Browse privacy-focused developer utilities by category and processing type.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string | string[];
    processing?: string | string[];
    sort?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const categoryParam = first(params.category);
  const processingParam = first(params.processing);
  const sortParam = first(params.sort);
  const category =
    categoryParam && isToolCategoryId(categoryParam)
      ? categoryParam
      : undefined;
  const processingType: ProcessingType | undefined =
    processingParam === "browser" || processingParam === "server-assisted"
      ? processingParam
      : undefined;
  const sort: ToolSort =
    sortParam === "popularity" ? "popularity" : "alphabetical";
  const tools = sortTools(filterTools({ category, processingType }), sort);
  const hasFilters = Boolean(category || processingType || sortParam);

  return (
    <main className="py-10 sm:py-12">
      <SectionHeader
        description="Browse every planned DevToolbox utility from one typed registry. Filter by category or where processing happens."
        headingLevel={1}
        title="All developer tools"
      />

      {!hasFilters ? (
        <>
          <section aria-labelledby="categories-heading" className="mt-10">
            <h2 className="text-lg font-semibold" id="categories-heading">
              Browse by category
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {toolCategories.map((categoryDefinition) => (
                <CategoryCard
                  category={categoryDefinition}
                  key={categoryDefinition.id}
                  toolCount={
                    filterTools({
                      category: categoryDefinition.id,
                    }).length
                  }
                />
              ))}
            </div>
          </section>

          <div className="mt-12 space-y-12">
            <ToolSection
              description="Frequently used utilities, ordered by product popularity."
              id="popular-tools-heading"
              title="Popular tools"
              tools={getPopularTools(3)}
            />
            <ToolSection
              description="The newest entries added to the DevToolbox roadmap."
              id="recent-tools-heading"
              title="Recently added"
              tools={getRecentlyAddedTools(3)}
            />
          </div>
        </>
      ) : null}

      <section aria-labelledby="tool-directory-heading" className="mt-12">
        <div>
          <h2 className="text-xl font-semibold" id="tool-directory-heading">
            Tool directory
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {tools.length} {tools.length === 1 ? "tool" : "tools"} found
          </p>
        </div>

        <div className="mt-5">
          <ToolFilters
            category={category}
            processingType={processingType}
            sort={sort}
          />
        </div>

        <div className="mt-5">
          <ToolGrid tools={tools} />
        </div>
      </section>
    </main>
  );
}
