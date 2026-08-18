export { toolCategories } from "@/config/tool-registry";

export const mainNavigation = [
  { label: "Home", href: "/" },
  { label: "All tools", href: "/tools" },
  { label: "Favorites", href: "/favorites" },
  { label: "About", href: "/about" },
] as const;
