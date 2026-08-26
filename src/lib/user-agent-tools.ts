import parseWithLocalRules from "next/dist/compiled/ua-parser-js";

export const MAX_USER_AGENT_LENGTH = 4_096;
export const USER_AGENT_RULESET = "ua-parser-js rules bundled with Next.js";

export interface UserAgentReport {
  client: {
    family: string;
    version?: string;
    kind: "browser" | "cli" | "other";
  };
  engine: { name: string; version?: string };
  os: { name: string; version?: string };
  device: { class: string; vendor?: string; model?: string };
  architecture?: string;
  bot: { detected: boolean; indicator?: string };
  reduced: boolean;
  ambiguous: boolean;
  warnings: string[];
  parser: string;
  raw: string;
}

const cliRules: Array<{ pattern: RegExp; family: string }> = [
  { pattern: /\bcurl\/([\w.+-]+)/i, family: "curl" },
  { pattern: /\bWget\/([\w.+-]+)/i, family: "Wget" },
  { pattern: /\bHTTPie\/([\w.+-]+)/i, family: "HTTPie" },
  { pattern: /\bPostmanRuntime\/([\w.+-]+)/i, family: "Postman Runtime" },
  { pattern: /\bpython-requests\/([\w.+-]+)/i, family: "Python Requests" },
  { pattern: /\bGo-http-client\/([\w.+-]+)/i, family: "Go HTTP Client" },
  { pattern: /\bokhttp\/([\w.+-]+)/i, family: "OkHttp" },
];

const botRules: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bGooglebot(?:\/([\w.-]+))?/i, label: "Googlebot" },
  { pattern: /\bBingbot(?:\/([\w.-]+))?/i, label: "Bingbot" },
  { pattern: /\bDuckDuckBot(?:\/([\w.-]+))?/i, label: "DuckDuckBot" },
  { pattern: /\bGPTBot(?:\/([\w.-]+))?/i, label: "GPTBot" },
  {
    pattern: /\b(?:crawler|spider|slurp|bot)(?:\/([\w.-]+))?/i,
    label: "Generic bot token",
  },
];

function matchedRule<T extends { pattern: RegExp }>(rules: T[], input: string) {
  for (const rule of rules) {
    const match = rule.pattern.exec(input);
    if (match) return { rule, match };
  }
}

function hasConflictingPlatformMarkers(input: string) {
  const platforms = [
    /Windows NT/i.test(input),
    /Android/i.test(input),
    /(?:iPhone|iPad|iPod)/i.test(input),
    /CrOS/i.test(input),
  ].filter(Boolean).length;
  const conflictingEngines =
    /Firefox\//i.test(input) && /(?:Chrome|CriOS|Edg|OPR)\//i.test(input);
  return platforms > 1 || conflictingEngines;
}

function isReducedUserAgent(input: string) {
  return (
    /\b(?:Chrome|Chromium|Edg)\/\d+\.0\.0\.0\b/i.test(input) ||
    /Android 10; K\b/i.test(input)
  );
}

export function parseUserAgent(input: string): UserAgentReport {
  const raw = input.trim();
  if (!raw) throw new Error("Enter a User-Agent string.");
  if (raw.length > MAX_USER_AGENT_LENGTH)
    throw new Error(
      `User-Agent strings are limited to ${MAX_USER_AGENT_LENGTH.toLocaleString()} characters.`,
    );

  const parsed = parseWithLocalRules(raw),
    cli = matchedRule(cliRules, raw),
    bot = matchedRule(botRules, raw),
    reduced = isReducedUserAgent(raw),
    ambiguous = hasConflictingPlatformMarkers(raw),
    warnings = [
      "User-Agent results are best-effort: strings can be spoofed, altered, or reduced.",
    ];

  if (reduced)
    warnings.push(
      "This appears to be a reduced User-Agent, so exact version or device details may be unavailable.",
    );
  if (ambiguous)
    warnings.push(
      "Conflicting platform or browser markers make this string ambiguous.",
    );
  if (bot && parsed.browser.name)
    warnings.push(
      "A bot indicator appears alongside browser-like tokens; automation may be imitating a browser.",
    );

  const client = cli
      ? { family: cli.rule.family, version: cli.match[1], kind: "cli" as const }
      : {
          family: parsed.browser.name ?? (bot?.rule.label || "Unknown client"),
          version: parsed.browser.version,
          kind: parsed.browser.name ? ("browser" as const) : ("other" as const),
        },
    deviceClass =
      parsed.device.type ??
      (cli
        ? "CLI / automation"
        : bot
          ? "bot / crawler"
          : parsed.os.name
            ? "desktop or unknown"
            : "unknown");

  return {
    client,
    engine: {
      name: parsed.engine.name ?? "Unknown",
      version: parsed.engine.version,
    },
    os: { name: parsed.os.name ?? "Unknown", version: parsed.os.version },
    device: {
      class: deviceClass,
      vendor: parsed.device.vendor,
      model: parsed.device.model,
    },
    architecture: parsed.cpu.architecture,
    bot: { detected: Boolean(bot), indicator: bot?.rule.label },
    reduced,
    ambiguous,
    warnings,
    parser: USER_AGENT_RULESET,
    raw,
  };
}
