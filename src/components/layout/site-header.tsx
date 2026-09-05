import Link from "next/link";
import { Blocks } from "lucide-react";

import { KauCow } from "@/components/layout/kau-cow";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchButton } from "@/components/shared/search-button";
import { ThemeSelector } from "@/components/shared/theme-selector";
import { env } from "@/config/env";
import { mainNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2 font-semibold" href="/">
          <Blocks aria-hidden="true" className="size-5" />
          <span>{siteConfig.name}</span>
        </Link>
        {env.NEXT_PUBLIC_ENABLE_KAU_COW ? <KauCow /> : null}
        <div className="flex items-center gap-2">
          <nav
            aria-label="Primary navigation"
            className="mr-2 hidden items-center gap-5 text-sm md:flex"
          >
            {mainNavigation.slice(1).map((item) => (
              <Link
                className="text-muted-foreground hover:text-foreground transition-colors"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <SearchButton />
          <div className="hidden sm:block">
            <ThemeSelector />
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
