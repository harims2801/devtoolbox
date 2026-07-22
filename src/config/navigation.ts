import {
  Binary,
  Braces,
  CalendarClock,
  GitCompareArrows,
  Network,
  ServerCog,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavigationCategory {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

export const toolCategories: NavigationCategory[] = [
  {
    id: "formatting-validation",
    name: "Formatting & Validation",
    description: "Format, validate, and inspect structured data.",
    icon: Braces,
  },
  {
    id: "encoding-decoding",
    name: "Encoding & Decoding",
    description: "Translate data between common transport formats.",
    icon: Binary,
  },
  {
    id: "generators",
    name: "Generators",
    description: "Create identifiers, hashes, and safe sample data.",
    icon: Sparkles,
  },
  {
    id: "date-time",
    name: "Date & Time",
    description: "Convert timestamps, dates, zones, and schedules.",
    icon: CalendarClock,
  },
  {
    id: "comparison-text",
    name: "Comparison & Text",
    description: "Compare, transform, and analyze text.",
    icon: GitCompareArrows,
  },
  {
    id: "devops-sre",
    name: "DevOps & SRE",
    description: "Inspect infrastructure configuration and operational data.",
    icon: ServerCog,
  },
  {
    id: "networking-web",
    name: "Networking & Web",
    description: "Understand addresses, URLs, headers, and web behavior.",
    icon: Network,
  },
];

export const mainNavigation = [
  { label: "Home", href: "/" },
  { label: "All tools", href: "/tools" },
  { label: "About", href: "/about" },
] as const;
