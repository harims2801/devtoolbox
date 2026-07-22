import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li
              className="flex items-center gap-1"
              key={`${item.label}-${index}`}
            >
              {index > 0 ? (
                <ChevronRight aria-hidden="true" className="size-3.5" />
              ) : null}
              {item.href && !isCurrent ? (
                <Link
                  className="hover:text-foreground rounded-sm hover:underline"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className={isCurrent ? "text-foreground" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
