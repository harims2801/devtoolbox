"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackSafeEvent } from "@/lib/analytics";
export function PrivacyAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    trackSafeEvent("page_view");
  }, [pathname]);
  return null;
}
