import Link from "next/link";
import { Blocks } from "lucide-react";

import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2 font-semibold" href="/">
          <Blocks aria-hidden="true" className="size-5" />
          <span>{siteConfig.name}</span>
        </Link>
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-5 text-sm"
        >
          <Link
            className="text-muted-foreground hover:text-foreground transition-colors"
            href="/tools"
          >
            Tools
          </Link>
          <Link
            className="text-muted-foreground hover:text-foreground transition-colors"
            href="/about"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
