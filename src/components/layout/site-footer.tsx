import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.name}
        </p>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-5"
        >
          <Link className="hover:text-foreground" href="/tools">
            Tools
          </Link>
          <Link className="hover:text-foreground" href="/about">
            About
          </Link>
          <span>Built for developers. Privacy first.</span>
        </nav>
      </div>
    </footer>
  );
}
