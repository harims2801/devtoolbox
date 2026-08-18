import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SectionHeader } from "@/components/shared/section-header";
import { ToolGrid } from "@/components/tools/tool-grid";
import {
  getCategoryBySlug,
  getToolsByCategory,
  sortTools,
  toolCategories,
} from "@/config/tool-registry";

export function generateStaticParams() {
  return toolCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const category = getCategoryBySlug((await params).slug);

  if (!category) return {};

  return {
    title: `${category.name} Tools`,
    description: category.description,
  };
}

export default async function ToolCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const category = getCategoryBySlug((await params).slug);
  if (!category) notFound();

  const tools = sortTools(getToolsByCategory(category.id));

  return (
    <main className="py-10 sm:py-12">
      <Breadcrumbs
        items={[{ label: "Tools", href: "/tools" }, { label: category.name }]}
      />
      <div className="mt-6">
        <SectionHeader
          description={category.description}
          headingLevel={1}
          title={category.name}
        />
      </div>

      <section aria-labelledby="category-tools-heading" className="mt-10">
        <h2 className="text-lg font-semibold" id="category-tools-heading">
          {tools.length} {tools.length === 1 ? "tool" : "tools"} in this
          category
        </h2>
        <div className="mt-4">
          <ToolGrid tools={tools} />
        </div>
      </section>
    </main>
  );
}
