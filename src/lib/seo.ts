import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import {
  getCategoryById,
  getToolById,
  type ToolDefinition,
} from "@/config/tool-registry";
export function absoluteUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}
export function buildToolMetadata(tool: ToolDefinition): Metadata {
  const title = tool.name,
    description = tool.longDescription,
    url = absoluteUrl(tool.route);
  return {
    title,
    description,
    keywords: [...tool.keywords, tool.category, "developer tool"],
    alternates: { canonical: url },
    robots:
      tool.availability === "available"
        ? { index: true, follow: true }
        : { index: false, follow: true },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: siteConfig.name,
    },
    twitter: { card: "summary", title, description },
  };
}
export function getToolMetadata(id: string): Metadata {
  const tool = getToolById(id);
  if (!tool) throw new Error(`Missing SEO metadata for ${id}`);
  return buildToolMetadata(tool);
}
export function toolStructuredData(tool: ToolDefinition) {
  const category = getCategoryById(tool.category);
  return {
    "@context": "https://schema.org",
    "@type":
      tool.processingType === "browser"
        ? "WebApplication"
        : "SoftwareApplication",
    name: tool.name,
    description: tool.longDescription,
    url: absoluteUrl(tool.route),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    browserRequirements: "Requires a modern web browser",
    featureList: tool.keywords.join(", "),
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Tools",
          item: absoluteUrl("/tools"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: category?.name ?? "Developer tools",
          item: absoluteUrl(`/tools/category/${category?.slug ?? ""}`),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: tool.name,
          item: absoluteUrl(tool.route),
        },
      ],
    },
  };
}
export function faqStructuredData(
  faqs: { question: string; answer: React.ReactNode }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text:
          typeof item.answer === "string"
            ? item.answer
            : "See the visible answer on this page.",
      },
    })),
  };
}
