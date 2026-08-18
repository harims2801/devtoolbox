export type LogLevel = "error" | "warn" | "info" | "debug" | "unknown";

export interface LogEntry {
  id: number;
  timestamp?: string;
  level: LogLevel;
  message: string;
  service?: string;
  host?: string;
  traceId?: string;
  spanId?: string;
  requestId?: string;
  raw: unknown;
}

export interface LogParseResult {
  format: "json-array" | "jsonl" | "key-value" | "plain";
  entries: LogEntry[];
  skipped: number;
  errors: string[];
}

const aliases: Record<string, keyof LogEntry> = {
  timestamp: "timestamp",
  time: "timestamp",
  ts: "timestamp",
  datetime: "timestamp",
  level: "level",
  severity: "level",
  loglevel: "level",
  message: "message",
  msg: "message",
  service: "service",
  service_name: "service",
  app: "service",
  host: "host",
  hostname: "host",
  traceid: "traceId",
  trace_id: "traceId",
  spanid: "spanId",
  span_id: "spanId",
  requestid: "requestId",
  request_id: "requestId",
};

function levelOf(value: unknown): LogLevel {
  const text = String(value ?? "unknown").toLowerCase();
  if (text === "err" || text === "fatal") return "error";
  if (text === "warning") return "warn";
  return ["error", "warn", "info", "debug"].includes(text)
    ? (text as LogLevel)
    : "unknown";
}

function fromObject(value: Record<string, unknown>, id: number): LogEntry {
  const normalized: Partial<LogEntry> = {};
  for (const [key, item] of Object.entries(value)) {
    const target = aliases[key.toLowerCase()];
    if (target) (normalized as Record<string, unknown>)[target] = item;
  }
  return {
    id,
    timestamp: normalized.timestamp ? String(normalized.timestamp) : undefined,
    level: levelOf(normalized.level),
    message: normalized.message
      ? String(normalized.message)
      : JSON.stringify(value),
    service: normalized.service ? String(normalized.service) : undefined,
    host: normalized.host ? String(normalized.host) : undefined,
    traceId: normalized.traceId ? String(normalized.traceId) : undefined,
    spanId: normalized.spanId ? String(normalized.spanId) : undefined,
    requestId: normalized.requestId ? String(normalized.requestId) : undefined,
    raw: value,
  };
}

function keyValues(line: string) {
  const result: Record<string, unknown> = {};
  for (const match of line.matchAll(
    /([\w.-]+)=("(?:[^"\\]|\\.)*"|'[^']*'|\S+)/g,
  )) {
    result[match[1]!] = match[2]!.replace(/^(["'])|(["'])$/g, "");
  }
  return result;
}

function fromPlain(line: string, id: number): LogEntry {
  const timestamp = line.match(/^\[?((?:\d{4}-\d\d-\d\d[T ][^\]\s]+))/)?.[1];
  const levelMatch = line.match(
    /\b(error|err|fatal|warn|warning|info|debug|trace)\b/i,
  );
  return {
    id,
    timestamp,
    level: levelOf(levelMatch?.[1]),
    message: line,
    raw: line,
  };
}

export function detectLogFormat(source: string): LogParseResult["format"] {
  const text = source.trim();
  if (text.startsWith("[")) return "json-array";
  const lines = text.split(/\r?\n/).filter(Boolean).slice(0, 10);
  if (
    lines.length &&
    lines.filter((line) => {
      try {
        return Boolean(JSON.parse(line));
      } catch {
        return false;
      }
    }).length >= Math.ceil(lines.length / 2)
  )
    return "jsonl";
  if (lines.some((line) => Object.keys(keyValues(line)).length >= 2))
    return "key-value";
  return "plain";
}

export function parseLogs(source: string, limit = 10000): LogParseResult {
  if (source.length > 2_000_000)
    throw new Error("Log input exceeds the 2 MB local limit.");
  const format = detectLogFormat(source),
    entries: LogEntry[] = [],
    errors: string[] = [];
  let skipped = 0;
  if (format === "json-array") {
    const value = JSON.parse(source) as unknown;
    if (!Array.isArray(value))
      throw new Error("Structured JSON input must be an array.");
    value.slice(0, limit).forEach((item, index) => {
      if (item && typeof item === "object" && !Array.isArray(item))
        entries.push(fromObject(item as Record<string, unknown>, index));
      else {
        skipped++;
        errors.push(`Entry ${index + 1} is not an object.`);
      }
    });
  } else {
    source
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(0, limit)
      .forEach((line, index) => {
        try {
          if (format === "jsonl") {
            const value = JSON.parse(line) as unknown;
            if (!value || typeof value !== "object" || Array.isArray(value))
              throw new Error("expected an object");
            entries.push(fromObject(value as Record<string, unknown>, index));
          } else if (format === "key-value")
            entries.push(fromObject(keyValues(line), index));
          else entries.push(fromPlain(line, index));
        } catch (error) {
          skipped++;
          errors.push(
            `Line ${index + 1}: ${error instanceof Error ? error.message : "malformed log"}`,
          );
        }
      });
  }
  return { format, entries, skipped, errors };
}

export function filterLogs(
  entries: LogEntry[],
  options: {
    level?: string;
    search?: string;
    service?: string;
    from?: string;
    to?: string;
  },
) {
  const search = options.search?.toLowerCase();
  return entries.filter((entry) => {
    const time = entry.timestamp ? Date.parse(entry.timestamp) : NaN;
    return (
      (!options.level ||
        options.level === "all" ||
        entry.level === options.level) &&
      (!search ||
        entry.message.toLowerCase().includes(search) ||
        JSON.stringify(entry.raw).toLowerCase().includes(search)) &&
      (!options.service ||
        options.service === "all" ||
        entry.service === options.service) &&
      (!options.from ||
        Number.isNaN(time) ||
        time >= Date.parse(options.from)) &&
      (!options.to || Number.isNaN(time) || time <= Date.parse(options.to))
    );
  });
}

export function logStats(entries: LogEntry[]) {
  const levels = { error: 0, warn: 0, info: 0, debug: 0, unknown: 0 };
  entries.forEach((entry) => levels[entry.level]++);
  const groups = [
    ...entries.reduce(
      (map, entry) => map.set(entry.message, (map.get(entry.message) ?? 0) + 1),
      new Map<string, number>(),
    ),
  ]
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count);
  const timeline = [
    ...entries.reduce((map, entry) => {
      const bucket =
        entry.timestamp && !Number.isNaN(Date.parse(entry.timestamp))
          ? new Date(entry.timestamp).toISOString().slice(0, 16)
          : "No timestamp";
      map.set(bucket, (map.get(bucket) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ].map(([bucket, count]) => ({ bucket, count }));
  return { total: entries.length, levels, groups, timeline };
}
