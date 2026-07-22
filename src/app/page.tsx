import Link from "next/link";
import { ArrowRight, Braces, LockKeyhole, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

const principles = [
  {
    title: "Private by default",
    description:
      "Tool inputs stay in your browser whenever processing can happen locally.",
    icon: LockKeyhole,
  },
  {
    title: "Built for daily work",
    description:
      "Focused utilities for formatting, decoding, validating, and generating data.",
    icon: Braces,
  },
  {
    title: "Fast and accessible",
    description:
      "A responsive, keyboard-friendly experience without login or unnecessary steps.",
    icon: Zap,
  },
] as const;

export default function Home() {
  return (
    <main>
      <section className="border-b">
        <div className="mx-auto flex min-h-[34rem] max-w-6xl flex-col items-start justify-center px-4 py-20 sm:px-6 lg:px-8">
          <p className="bg-muted/50 text-muted-foreground mb-5 rounded-full border px-3 py-1 text-sm font-medium">
            Developer utilities, processed locally
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Useful developer tools without sending your data away.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8 text-pretty">
            DevToolbox is a privacy-focused collection of browser-based tools
            for developers, DevOps engineers, SREs, testers, and technical
            teams.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/tools">
                Explore tools
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/about">About the project</Link>
            </Button>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="principles-heading"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <h2
          id="principles-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          Designed around trust and speed
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {principles.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="bg-card text-card-foreground rounded-xl border p-6 shadow-xs"
            >
              <Icon aria-hidden="true" className="size-5" />
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
