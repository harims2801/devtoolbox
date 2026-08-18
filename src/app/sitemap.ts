import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { toolCategories, toolRegistry } from "@/config/tool-registry";
import { absoluteUrl } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/tools", "/about", "/privacy"].map((url) => ({
    url: absoluteUrl(url),
    lastModified: new Date("2026-08-18"),
    changeFrequency: "monthly" as const,
    priority: url === "/" ? 1 : 0.7,
  }));
  const categories = toolCategories.map((category) => ({
    url: absoluteUrl(`/tools/category/${category.slug}`),
    lastModified: new Date("2026-08-18"),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  const tools = toolRegistry
    .filter((tool) => tool.availability === "available")
    .map((tool) => ({
      url: new URL(tool.route, siteConfig.url).toString(),
      lastModified: new Date(tool.addedAt),
      changeFrequency: "monthly" as const,
      priority: tool.isFeatured ? 0.9 : 0.8,
    }));
  return [...staticRoutes, ...categories, ...tools];
}
