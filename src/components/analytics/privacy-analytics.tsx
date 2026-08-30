"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";

import { analyticsEnabled, trackSafeEvent } from "@/lib/analytics";

export function PrivacyAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    trackSafeEvent("page_view");
  }, [pathname]);

  return (
    <Analytics beforeSend={(event) => (analyticsEnabled() ? event : null)} />
  );
}
