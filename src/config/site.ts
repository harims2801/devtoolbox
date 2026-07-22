import { env } from "@/config/env";

export const siteConfig = {
  name: "DevToolbox",
  description:
    "Privacy-focused browser utilities for developers, DevOps engineers, SREs, testers, and technical teams.",
  url: env.NEXT_PUBLIC_APP_URL,
} as const;
