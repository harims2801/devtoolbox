import { request as httpsRequest } from "node:https";
import type { LookupFunction } from "node:net";
import type {
  ExtractionConfidence,
  PricingImportResult,
  PricingPlan,
} from "@/lib/pricing-page-shared";
import {
  type HostLookup,
  SafeNetworkError,
  defaultHostLookup,
  resolvePublicHostname,
  withTimeout,
} from "@/lib/server/network-security";

const MAX_BODY_BYTES = 1_500_000,
  MAX_REDIRECTS = 3,
  REQUEST_TIMEOUT_MS = 7_000,
  USER_AGENT = "DevToolbox-Pricing-Importer/1.0";

export interface PricingPageResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export type PricingTransport = (
  url: URL,
  address: string,
  family: number,
) => Promise<PricingPageResponse>;

function publicPricingUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new SafeNetworkError(
      "INVALID_INPUT",
      "Enter a valid HTTPS pricing URL.",
    );
  }
  if (url.protocol !== "https:")
    throw new SafeNetworkError(
      "BLOCKED_TARGET",
      "Only public HTTPS pricing pages are allowed.",
    );
  if (url.username || url.password || (url.port && url.port !== "443"))
    throw new SafeNetworkError(
      "BLOCKED_TARGET",
      "Credentials and non-standard ports are not allowed.",
    );
  url.hash = "";
  return url;
}

export const nodePricingTransport: PricingTransport = (url, address, family) =>
  new Promise((resolve, reject) => {
    const pinnedLookup = ((
      _hostname: string,
      options: { all?: boolean },
      callback: (...args: unknown[]) => void,
    ) => {
      if (options?.all) callback(null, [{ address, family }]);
      else callback(null, address, family);
    }) as LookupFunction;
    const request = httpsRequest(
      url,
      {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,text/plain;q=0.5",
          "Accept-Encoding": "identity",
          "User-Agent": USER_AGENT,
        },
        lookup: pinnedLookup,
        maxHeaderSize: 24 * 1024,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
      (response) => {
        const contentLength = Number(response.headers["content-length"] ?? 0);
        if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
          response.destroy();
          reject(
            new SafeNetworkError(
              "TOO_LARGE",
              "The pricing page is too large to import safely.",
              413,
            ),
          );
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BODY_BYTES) {
            response.destroy(
              new SafeNetworkError(
                "TOO_LARGE",
                "The pricing page is too large to import safely.",
                413,
              ),
            );
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          const headers: Record<string, string> = {};
          for (const [name, value] of Object.entries(response.headers))
            if (typeof value === "string") headers[name.toLowerCase()] = value;
            else if (value) headers[name.toLowerCase()] = value.join(", ");
          resolve({
            status: response.statusCode ?? 0,
            headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    request.on("error", reject);
    request.end();
  });

function decodeHtml(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
      if (entity[0] !== "#") return named[entity.toLowerCase()] ?? match;
      const hexadecimal = entity[1]?.toLowerCase() === "x";
      const point = Number.parseInt(
        entity.slice(hexadecimal ? 2 : 1),
        hexadecimal ? 16 : 10,
      );
      return Number.isSafeInteger(point) && point >= 0 && point <= 0x10ffff
        ? String.fromCodePoint(point)
        : match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function providerFromUrl(url: string) {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname === "openai.com" || hostname.endsWith(".openai.com"))
    return "OpenAI";
  if (hostname === "anthropic.com" || hostname.endsWith(".anthropic.com"))
    return "Anthropic";
  if (hostname === "google.dev" || hostname.endsWith(".google.dev"))
    return "Google AI";
  if (hostname === "amazon.com" || hostname.endsWith(".amazon.com"))
    return "Amazon Bedrock";
  if (hostname === "microsoft.com" || hostname.endsWith(".microsoft.com"))
    return "Microsoft Azure";
  return new URL(url).hostname;
}

function price(value: string) {
  const currency: PricingPlan["currency"] = value.includes("€")
    ? "EUR"
    : value.includes("£")
      ? "GBP"
      : "USD";
  const match = value.match(/(?:US\s*)?[$€£]\s*([\d,.]+)/i);
  if (!match) return undefined;
  const amount = Number(match[1]!.replaceAll(",", ""));
  return Number.isFinite(amount) ? { amount, currency } : undefined;
}

function columnIndex(headers: string[], patterns: RegExp[]) {
  return headers.findIndex((header) =>
    patterns.some((pattern) => pattern.test(header)),
  );
}

export function extractPricingPlans(
  html: string,
  sourceUrl: string,
  retrievedAt = new Date().toISOString(),
) {
  const provider = providerFromUrl(sourceUrl),
    plans: PricingPlan[] = [],
    warnings: string[] = [],
    tables = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/gi) ?? [];
  for (const table of tables.slice(0, 30)) {
    const rows = table.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
    const cells = rows.map((row) =>
      (row.match(/<(?:th|td)\b[^>]*>[\s\S]*?<\/(?:th|td)>/gi) ?? []).map(
        decodeHtml,
      ),
    );
    if (cells.length < 2) continue;
    const headerRow = cells.findIndex(
        (row) =>
          row.some((cell) => /\binput\b/i.test(cell)) &&
          row.some((cell) => /\boutput\b/i.test(cell)),
      ),
      headers =
        headerRow >= 0
          ? cells[headerRow]!.map((cell) => cell.toLowerCase())
          : [];
    if (headerRow < 0) continue;
    const modelIndex = Math.max(0, columnIndex(headers, [/model/, /name/])),
      inputIndex = columnIndex(headers, [/\binput\b(?!.*cache)/]),
      cachedIndex = columnIndex(headers, [/cache.*input/, /input.*cache/]),
      outputIndex = columnIndex(headers, [/\boutput\b/]),
      tableText = decodeHtml(table),
      unitTokens: 1_000 | 1_000_000 = /(?:1m|million)\s*tokens?/i.test(
        tableText,
      )
        ? 1_000_000
        : 1_000,
      confidence: ExtractionConfidence =
        /(?:1m|million|1k|thousand)\s*tokens?/i.test(tableText)
          ? "high"
          : "medium";
    if (inputIndex < 0 || outputIndex < 0) continue;
    for (const row of cells.slice(headerRow + 1)) {
      const input = price(row[inputIndex] ?? ""),
        output = price(row[outputIndex] ?? ""),
        cached = cachedIndex >= 0 ? price(row[cachedIndex] ?? "") : undefined,
        model = (row[modelIndex] ?? "").trim().slice(0, 160);
      if (!model || !input || !output || input.currency !== output.currency)
        continue;
      plans.push({
        id: `${provider}-${model}-${plans.length}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 120),
        provider,
        model,
        currency: input.currency,
        unitTokens,
        inputPrice: input.amount,
        cachedInputPrice:
          cached?.currency === input.currency ? cached.amount : undefined,
        outputPrice: output.amount,
        sourceUrl,
        retrievedAt,
        confidence,
      });
    }
  }
  const unique = [
    ...new Map(
      plans.map((plan) => [
        `${plan.provider}|${plan.model}|${plan.currency}|${plan.unitTokens}|${plan.inputPrice}|${plan.outputPrice}`,
        plan,
      ]),
    ).values(),
  ].slice(0, 100);
  if (!tables.length)
    warnings.push("No HTML pricing table was found on this page.");
  if (!unique.length)
    warnings.push(
      "No complete model/input/output rows could be extracted. Enter the published prices manually and verify them against the source page.",
    );
  warnings.push(
    "Imported prices are untrusted draft data. Review the model, unit, currency, and rates before saving.",
  );
  return { provider, plans: unique, warnings };
}

export class PricingPageImporter {
  constructor(
    private readonly lookup: HostLookup = defaultHostLookup,
    private readonly transport: PricingTransport = nodePricingTransport,
  ) {}

  async import(input: string): Promise<PricingImportResult> {
    const source = publicPricingUrl(input);
    let current = source;
    try {
      for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const resolved = await resolvePublicHostname(
            current.hostname,
            this.lookup,
          ),
          target = resolved.addresses[0]!,
          response = await withTimeout(
            this.transport(current, target.address, target.family),
            REQUEST_TIMEOUT_MS,
            "The pricing page request timed out.",
          );
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.location;
          if (!location)
            throw new SafeNetworkError(
              "UPSTREAM_FAILURE",
              "The pricing page returned an invalid redirect.",
              502,
            );
          if (hop === MAX_REDIRECTS)
            throw new SafeNetworkError(
              "UPSTREAM_FAILURE",
              "The pricing page redirected too many times.",
              502,
            );
          current = publicPricingUrl(new URL(location, current).toString());
          continue;
        }
        if (response.status < 200 || response.status >= 300)
          throw new SafeNetworkError(
            "UPSTREAM_FAILURE",
            `The pricing page returned HTTP ${response.status}.`,
            502,
          );
        const contentType =
          response.headers["content-type"]?.toLowerCase() ?? "";
        if (
          !/(?:text\/html|application\/xhtml\+xml|text\/plain)/.test(
            contentType,
          )
        )
          throw new SafeNetworkError(
            "UPSTREAM_FAILURE",
            "The URL did not return an HTML pricing page.",
            415,
          );
        const retrievedAt = new Date().toISOString(),
          extracted = extractPricingPlans(
            response.body,
            current.toString(),
            retrievedAt,
          );
        return {
          sourceUrl: source.toString(),
          finalUrl: current.toString(),
          retrievedAt,
          ...extracted,
        };
      }
    } catch (caught) {
      if (caught instanceof SafeNetworkError) throw caught;
      throw new SafeNetworkError(
        "UPSTREAM_FAILURE",
        "The pricing page could not be imported safely.",
        502,
      );
    }
    throw new SafeNetworkError(
      "UPSTREAM_FAILURE",
      "The pricing page could not be imported safely.",
      502,
    );
  }
}
