import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

import { PrivacyBadge } from "@/components/shared/privacy-badge";
import { cn } from "@/lib/utils";

export interface ToolCardProps {
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
  href?: string;
  isNew?: boolean;
  processingLabel?: string;
}

export function ToolCard({
  name,
  description,
  category,
  icon: Icon,
  href,
  isNew = false,
  processingLabel,
}: ToolCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="bg-muted/50 rounded-lg border p-2.5">
          <Icon aria-hidden="true" className="size-5" />
        </div>
        {href ? (
          <ArrowUpRight
            aria-hidden="true"
            className="text-muted-foreground size-4"
          />
        ) : null}
      </div>
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold tracking-tight">{name}</h3>
          {isNew ? (
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
              NEW
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground mt-1 text-xs font-medium">
          {category}
        </p>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {description}
        </p>
      </div>
      <div className="mt-auto pt-5">
        {processingLabel ? (
          <PrivacyBadge label={processingLabel} />
        ) : (
          <span className="text-muted-foreground text-xs">Coming soon</span>
        )}
      </div>
    </>
  );

  const classes = cn(
    "group flex min-h-64 flex-col rounded-xl border bg-card p-5 text-card-foreground shadow-xs transition-all",
    href && "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
  );

  return href ? (
    <Link aria-label={`Open ${name}`} className={classes} href={href}>
      {content}
    </Link>
  ) : (
    <article className={classes}>{content}</article>
  );
}
