import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function CategoryCard({
  name,
  description,
  icon: Icon,
  href,
  toolCount,
}: {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  toolCount?: number;
}) {
  return (
    <Link
      className="group bg-card hover:border-foreground/20 flex items-start gap-4 rounded-xl border p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
      href={href}
    >
      <div className="bg-muted/50 rounded-lg border p-2.5">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">{name}</h3>
          <ArrowRight
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
          />
        </div>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          {description}
        </p>
        {typeof toolCount === "number" ? (
          <p className="text-muted-foreground mt-3 text-xs font-medium">
            {toolCount} {toolCount === 1 ? "tool" : "tools"}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
