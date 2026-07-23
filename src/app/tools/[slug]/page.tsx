import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Construction } from "lucide-react";

import { PrivacyBadge } from "@/components/shared/privacy-badge";
import { FavoriteButton } from "@/components/tools/favorite-button";
import { RecentToolTracker } from "@/components/tools/recent-tool-tracker";
import { RelatedTools } from "@/components/tools/related-tools";
import { ToolBreadcrumbs } from "@/components/tools/tool-breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  getCategoryById,
  getToolBySlug,
  toolRegistry,
} from "@/config/tool-registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return toolRegistry.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const tool = getToolBySlug((await params).slug);
  if (!tool) return {};

  return {
    title: tool.name,
    description: tool.description,
    robots:
      tool.availability === "available"
        ? { index: true, follow: true }
        : { index: false, follow: true },
  };
}

export default async function PlannedToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const tool = getToolBySlug((await params).slug);
  if (!tool) notFound();

  const category = getCategoryById(tool.category);

  return (
    <main className="py-8 sm:py-10">
      <RecentToolTracker toolId={tool.id} />
      <ToolBreadcrumbs tool={tool} />

      <header className="mt-6 border-b pb-7">
        <p className="text-muted-foreground text-sm font-medium">
          {category?.name}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {tool.name}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-3xl leading-7">
          {tool.longDescription}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <PrivacyBadge label={tool.privacyLabel} />
          <FavoriteButton showLabel toolId={tool.id} toolName={tool.name} />
        </div>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section
          aria-labelledby="planned-tool-heading"
          className="bg-card rounded-xl border p-8 text-center shadow-xs"
        >
          <Construction
            aria-hidden="true"
            className="text-muted-foreground mx-auto size-8"
          />
          <h2 className="mt-4 text-xl font-semibold" id="planned-tool-heading">
            Tool implementation coming soon
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm leading-6">
            This route and its product metadata are ready. The interactive tool
            will be added in its dedicated development phase.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link href="/tools">
              <ArrowLeft aria-hidden="true" />
              Browse all tools
            </Link>
          </Button>
        </section>

        <aside aria-labelledby="related-tools-heading">
          <h2 className="text-sm font-semibold" id="related-tools-heading">
            Related tools
          </h2>
          <div className="mt-3">
            <RelatedTools tool={tool} />
          </div>
        </aside>
      </div>
    </main>
  );
}
