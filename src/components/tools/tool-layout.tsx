"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { useEffect } from "react";
import { StructuredData } from "@/components/seo/structured-data";
import { PrivacyBadge } from "@/components/shared/privacy-badge";
import { FavoriteButton } from "@/components/tools/favorite-button";
import { RecentToolTracker } from "@/components/tools/recent-tool-tracker";
import { RelatedTools } from "@/components/tools/related-tools";
import { ResponsiveWorkspace } from "@/components/tools/responsive-workspace";
import { getCategoryById, type ToolDefinition } from "@/config/tool-registry";
import { faqStructuredData, toolStructuredData } from "@/lib/seo";
import { trackSafeEvent } from "@/lib/analytics";

export interface ToolExample {
  title: string;
  description?: string;
}

export interface ToolFaq {
  question: string;
  answer: React.ReactNode;
}

export interface ToolLayoutProps {
  title: string;
  description: string;
  category: string;
  categoryHref?: string;
  privacyLabel?: string;
  input: React.ReactNode;
  output: React.ReactNode;
  inputLabel?: string;
  outputLabel?: string;
  toolbar?: React.ReactNode;
  instructions?: React.ReactNode;
  examples?: ToolExample[];
  faqs?: ToolFaq[];
  relatedTools?: React.ReactNode;
  seoContent?: React.ReactNode;
}

export type RegisteredToolLayoutProps = Omit<
  ToolLayoutProps,
  | "title"
  | "description"
  | "category"
  | "categoryHref"
  | "privacyLabel"
  | "relatedTools"
> & {
  tool: ToolDefinition;
};

export function ToolLayout({
  title,
  description,
  category,
  categoryHref = "/tools",
  privacyLabel = "Processed locally",
  input,
  output,
  inputLabel,
  outputLabel,
  toolbar,
  instructions,
  examples,
  faqs,
  relatedTools,
  seoContent,
}: ToolLayoutProps) {
  return (
    <main className="py-8 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Tools", href: "/tools" },
          { label: category, href: categoryHref },
          { label: title },
        ]}
      />

      <header className="mt-6 border-b pb-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-muted-foreground text-sm font-medium">
              {category}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="text-muted-foreground mt-3 text-base leading-7">
              {description}
            </p>
          </div>
          <PrivacyBadge className="w-fit shrink-0" label={privacyLabel} />
        </div>
      </header>

      {toolbar ? (
        <div className="my-5 flex flex-wrap items-center gap-2">{toolbar}</div>
      ) : null}

      <ResponsiveWorkspace
        className={toolbar ? undefined : "mt-6"}
        input={input}
        inputLabel={inputLabel}
        output={output}
        outputLabel={outputLabel}
      />

      <div className="mt-12 grid gap-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-10">
          {instructions ? (
            <section aria-labelledby="instructions-heading">
              <h2 className="text-xl font-semibold" id="instructions-heading">
                How to use this tool
              </h2>
              <div className="text-muted-foreground mt-4 text-sm leading-7">
                {instructions}
              </div>
            </section>
          ) : null}

          {examples?.length ? (
            <section aria-labelledby="examples-heading">
              <h2 className="text-xl font-semibold" id="examples-heading">
                Examples
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {examples.map((example) => (
                  <article
                    className="bg-card rounded-lg border p-4"
                    key={example.title}
                  >
                    <h3 className="font-medium">{example.title}</h3>
                    {example.description ? (
                      <p className="text-muted-foreground mt-2 text-sm leading-6">
                        {example.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {faqs?.length ? (
            <section aria-labelledby="faq-heading">
              <h2 className="text-xl font-semibold" id="faq-heading">
                Frequently asked questions
              </h2>
              <div className="bg-card mt-4 divide-y rounded-xl border px-5">
                {faqs.map((faq) => (
                  <details className="group py-4" key={faq.question}>
                    <summary className="cursor-pointer list-none font-medium marker:hidden">
                      {faq.question}
                    </summary>
                    <div className="text-muted-foreground mt-3 text-sm leading-7">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {seoContent ? (
            <section aria-labelledby="about-tool-heading">
              <h2 className="text-xl font-semibold" id="about-tool-heading">
                About this tool
              </h2>
              <div className="text-muted-foreground mt-4 text-sm leading-7">
                {seoContent}
              </div>
            </section>
          ) : null}
        </div>

        {relatedTools ? (
          <aside aria-labelledby="related-tools-heading">
            <h2 className="text-sm font-semibold" id="related-tools-heading">
              Related tools
            </h2>
            <div className="mt-3 space-y-3">{relatedTools}</div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}

export function RegisteredToolLayout({
  tool,
  toolbar,
  ...workspace
}: RegisteredToolLayoutProps) {
  const category = getCategoryById(tool.category);
  useEffect(() => {
    trackSafeEvent("tool_open", tool.id);
  }, [tool.id]);

  return (
    <>
      <StructuredData value={toolStructuredData(tool)} />
      {workspace.faqs?.length ? (
        <StructuredData value={faqStructuredData(workspace.faqs)} />
      ) : null}
      <RecentToolTracker toolId={tool.id} />
      <ToolLayout
        {...workspace}
        category={category?.name ?? "Developer tools"}
        categoryHref={category ? `/tools/category/${category.slug}` : "/tools"}
        description={tool.longDescription}
        privacyLabel={tool.privacyLabel}
        relatedTools={<RelatedTools tool={tool} />}
        title={tool.name}
        toolbar={
          <>
            <FavoriteButton showLabel toolId={tool.id} toolName={tool.name} />
            {toolbar}
          </>
        }
      />
    </>
  );
}
