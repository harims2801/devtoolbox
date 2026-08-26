export type WebhookMethod = "POST" | "PUT" | "PATCH";

export interface WebhookHeader {
  name: string;
  value: string;
}

export interface WebhookRedirect {
  url: string;
  status: number;
  location: string;
}

export interface WebhookReport {
  endpoint: string;
  method: WebhookMethod;
  status: number;
  statusText: string;
  timingMilliseconds: number;
  redirects: WebhookRedirect[];
  responseHeaders: WebhookHeader[];
  contentType?: string;
  preview: {
    kind: "json" | "text" | "omitted";
    content: string;
    truncated: boolean;
    bytesRead: number;
  };
}

export function parseWebhookHeaderLines(input: string): WebhookHeader[] {
  if (!input.trim()) return [];
  const lines = input.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length > 20) throw new Error("Use no more than 20 custom headers.");
  return lines.map((line, index) => {
    const colon = line.indexOf(":");
    if (colon < 1)
      throw new Error(`Header line ${index + 1} must use Name: value format.`);
    return {
      name: line.slice(0, colon).trim(),
      value: line.slice(colon + 1).trim(),
    };
  });
}
