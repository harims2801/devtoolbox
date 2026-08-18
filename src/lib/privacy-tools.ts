const SECRET_PATTERNS: [RegExp, string][] = [
  [
    /\b(?:Bearer\s+)?eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gi,
    "[REDACTED:token]",
  ],
  [/\b(?:sk|pk|ghp|github_pat|AKIA)[-_A-Za-z0-9]{12,}\b/g, "[REDACTED:key]"],
  [/(password|secret|token|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]"],
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED:email]"],
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[REDACTED:ip]"],
];
export function redactErrorReport(value: unknown) {
  let text =
    value instanceof Error ? `${value.name}: ${value.message}` : String(value);
  for (const [pattern, replacement] of SECRET_PATTERNS)
    text = text.replace(pattern, replacement);
  return text.slice(0, 1000);
}
export const ANALYTICS_DISABLED_KEY = "devtoolbox.analytics.disabled";
export const SAFE_ANALYTICS_EVENTS = [
  "page_view",
  "tool_open",
  "format_clicked",
  "copy_clicked",
  "download_clicked",
  "install_clicked",
] as const;
export type SafeAnalyticsEvent = (typeof SAFE_ANALYTICS_EVENTS)[number];
export function isSafeAnalyticsEvent(
  value: string,
): value is SafeAnalyticsEvent {
  return SAFE_ANALYTICS_EVENTS.includes(value as SafeAnalyticsEvent);
}
