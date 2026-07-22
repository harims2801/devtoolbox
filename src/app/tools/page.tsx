import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools",
  description: "Browse the developer utilities available in DevToolbox.",
  robots: { index: false, follow: true },
};

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-muted-foreground text-sm font-medium">
        Development preview
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Tools are coming next
      </h1>
      <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
        The project foundation is ready. Tool discovery and the shared registry
        will be implemented in the upcoming phases before individual utilities
        are released.
      </p>
    </main>
  );
}
