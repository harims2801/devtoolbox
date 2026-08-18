"use client";
import { useEffect, useState } from "react";
import { analyticsEnabled, setAnalyticsEnabled } from "@/lib/analytics";
export function AnalyticsPreference() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setEnabled(analyticsEnabled()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <label className="flex items-center gap-3 rounded border p-4">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => {
          setAnalyticsEnabled(event.target.checked);
          setEnabled(event.target.checked);
        }}
      />
      <span>
        <strong>Privacy-friendly analytics</strong>
        <span className="text-muted-foreground block text-sm">
          Count page views, tool opens, and generic actions. Never include tool
          input, output, filenames, hostnames, tokens, or hashes.
        </span>
      </span>
    </label>
  );
}
