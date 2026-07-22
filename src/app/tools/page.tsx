import type { Metadata } from "next";
import {
  Binary,
  Braces,
  Clock3,
  FileJson,
  Fingerprint,
  GitCompareArrows,
  Hash,
  KeyRound,
  Regex,
  ScrollText,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { CategoryCard } from "@/components/tools/category-card";
import { ToolCard } from "@/components/tools/tool-card";
import { toolCategories } from "@/config/navigation";

export const metadata: Metadata = {
  title: "Tools",
  description: "Browse the developer utilities available in DevToolbox.",
  robots: { index: false, follow: true },
};

const plannedTools = [
  {
    name: "JSON Formatter",
    description:
      "Format, validate, minify, and inspect JSON safely in your browser.",
    categoryId: "formatting-validation",
    icon: FileJson,
  },
  {
    name: "YAML Converter",
    description: "Validate YAML and convert between YAML and JSON.",
    categoryId: "formatting-validation",
    icon: Braces,
  },
  {
    name: "Base64 Encoder",
    description: "Encode or decode UTF-8 text and local files.",
    categoryId: "encoding-decoding",
    icon: Binary,
  },
  {
    name: "JWT Decoder",
    description:
      "Inspect token headers, claims, dates, and status without uploading them.",
    categoryId: "encoding-decoding",
    icon: KeyRound,
  },
  {
    name: "UUID Generator",
    description: "Generate secure UUID v4 values individually or in batches.",
    categoryId: "generators",
    icon: Fingerprint,
  },
  {
    name: "Hash Generator",
    description: "Create SHA hashes for local text and files using Web Crypto.",
    categoryId: "generators",
    icon: Hash,
  },
  {
    name: "Timestamp Converter",
    description:
      "Convert Unix timestamps and human-readable dates across time zones.",
    categoryId: "date-time",
    icon: Clock3,
  },
  {
    name: "Cron Builder",
    description: "Build, validate, and explain standard Unix cron expressions.",
    categoryId: "date-time",
    icon: ScrollText,
  },
  {
    name: "Diff Checker",
    description: "Compare text or parsed JSON with clear semantic differences.",
    categoryId: "comparison-text",
    icon: GitCompareArrows,
  },
  {
    name: "Regex Tester",
    description:
      "Test JavaScript-compatible expressions and inspect each match.",
    categoryId: "comparison-text",
    icon: Regex,
  },
] as const;

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selectedCategory = toolCategories.find((item) => item.id === category);
  const visibleTools = selectedCategory
    ? plannedTools.filter((tool) => tool.categoryId === selectedCategory.id)
    : plannedTools;

  return (
    <main className="py-10 sm:py-12">
      <SectionHeader
        description="A growing collection of focused utilities designed for fast, private technical work. Tool implementations are being released incrementally."
        headingLevel={1}
        title={selectedCategory?.name ?? "All developer tools"}
      />

      {!selectedCategory ? (
        <section aria-labelledby="categories-heading" className="mt-10">
          <h2 className="text-lg font-semibold" id="categories-heading">
            Browse by category
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {toolCategories.map((item) => (
              <CategoryCard
                description={item.description}
                href={`/tools?category=${item.id}`}
                icon={item.icon}
                key={item.id}
                name={item.name}
                toolCount={
                  plannedTools.filter((tool) => tool.categoryId === item.id)
                    .length
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="planned-tools-heading" className="mt-12">
        <h2 className="text-lg font-semibold" id="planned-tools-heading">
          {selectedCategory
            ? `${selectedCategory.name} tools`
            : "Initial release tools"}
        </h2>
        {visibleTools.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleTools.map((tool) => {
              const categoryName =
                toolCategories.find((item) => item.id === tool.categoryId)
                  ?.name ?? "Developer tool";

              return (
                <ToolCard
                  category={categoryName}
                  description={tool.description}
                  icon={tool.icon}
                  key={tool.name}
                  name={tool.name}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            description="Tools in this category will be added after the first browser-only utilities are complete."
            title="No tools released yet"
          />
        )}
      </section>
    </main>
  );
}
