import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how DevToolbox approaches privacy and browser-based data processing.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        About DevToolbox
      </h1>
      <p className="text-muted-foreground mt-5 text-lg leading-8">
        DevToolbox is being built as a free collection of focused utilities for
        technical work. Whenever possible, processing happens locally in the
        browser so input does not need to be uploaded to a server.
      </p>
    </main>
  );
}
