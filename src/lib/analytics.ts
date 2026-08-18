"use client";
import {
  ANALYTICS_DISABLED_KEY,
  isSafeAnalyticsEvent,
  type SafeAnalyticsEvent,
} from "@/lib/privacy-tools";
import { getToolById } from "@/config/tool-registry";
export function analyticsEnabled() {
  if (typeof window === "undefined") return false;
  return (
    navigator.doNotTrack !== "1" &&
    localStorage.getItem(ANALYTICS_DISABLED_KEY) !== "true"
  );
}
export function setAnalyticsEnabled(enabled: boolean) {
  localStorage.setItem(ANALYTICS_DISABLED_KEY, String(!enabled));
  window.dispatchEvent(new Event("analytics-preference"));
}
export function trackSafeEvent(event: SafeAnalyticsEvent, toolId?: string) {
  if (
    !analyticsEnabled() ||
    !isSafeAnalyticsEvent(event) ||
    (toolId && !getToolById(toolId))
  )
    return;
  const body = JSON.stringify(toolId ? { event, toolId } : { event });
  if (navigator.sendBeacon)
    navigator.sendBeacon(
      "/api/analytics",
      new Blob([body], { type: "application/json" }),
    );
  else
    void fetch(new URL("/api/analytics", window.location.origin), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
}
