"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { toolCategories } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function ToolSidebar() {
  const selectedCategory = useSearchParams().get("category");

  return (
    <aside
      aria-label="Tool category navigation"
      className="hidden w-64 shrink-0 lg:block"
    >
      <div className="sticky top-20 space-y-1 py-8 pr-5">
        <Link
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
            !selectedCategory
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/60",
          )}
          href="/tools"
        >
          <LayoutGrid aria-hidden="true" className="size-4" />
          All tools
        </Link>
        <p className="text-muted-foreground px-3 pt-5 pb-2 text-xs font-semibold tracking-wider uppercase">
          Categories
        </p>
        {toolCategories.map(({ id, name, icon: Icon }) => (
          <Link
            aria-current={selectedCategory === id ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              selectedCategory === id
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
            href={`/tools?category=${id}`}
            key={id}
          >
            <Icon aria-hidden="true" className="size-4" />
            {name}
          </Link>
        ))}
      </div>
    </aside>
  );
}
