import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PrivacyBadge } from "@/components/shared/privacy-badge";
import { FavoriteButton } from "@/components/tools/favorite-button";
import type { ToolDefinition } from "@/config/tool-registry";
import { cn } from "@/lib/utils";

export interface ToolCardProps {
  tool: ToolDefinition;
  categoryName: string;
  compact?: boolean;
}

export function ToolCard({
  tool,
  categoryName,
  compact = false,
}: ToolCardProps) {
  const {
    availability,
    description,
    icon: Icon,
    isNew,
    name,
    privacyLabel,
    route,
  } = tool;
  return (
    <article
      className={cn(
        "group bg-card text-card-foreground hover:border-foreground/20 flex flex-col rounded-xl border p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md",
        compact ? "min-h-56" : "min-h-64",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="bg-muted/50 rounded-lg border p-2.5">
          <Icon aria-hidden="true" className="size-5" />
        </div>
        <div className="flex items-center gap-1">
          <FavoriteButton toolId={tool.id} toolName={name} />
          <ArrowUpRight
            aria-hidden="true"
            className="text-muted-foreground size-4"
          />
        </div>
      </div>
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold tracking-tight">
            <Link
              className="focus-visible:outline-ring rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              href={route}
            >
              {name}
            </Link>
          </h3>
          {isNew ? (
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
              NEW
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground mt-1 text-xs font-medium">
          {categoryName}
        </p>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {description}
        </p>
      </div>
      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <PrivacyBadge label={privacyLabel} />
          {availability === "planned" ? (
            <span className="text-muted-foreground rounded-full border px-2 py-1 text-xs">
              Coming soon
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
