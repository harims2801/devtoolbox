import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.name}
        </p>
        <p>Built for developers. Privacy first.</p>
      </div>
    </footer>
  );
}
