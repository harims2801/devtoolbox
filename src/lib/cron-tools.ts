export const CRON_FIELDS = [
  { name: "minute", label: "Minute", min: 0, max: 59 },
  { name: "hour", label: "Hour", min: 0, max: 23 },
  { name: "dayOfMonth", label: "Day of month", min: 1, max: 31 },
  { name: "month", label: "Month", min: 1, max: 12 },
  { name: "dayOfWeek", label: "Day of week", min: 0, max: 7 },
] as const;

export const CRON_PRESETS = [
  ["Every minute", "* * * * *"],
  ["Every 5 minutes", "*/5 * * * *"],
  ["Hourly", "0 * * * *"],
  ["Daily", "0 0 * * *"],
  ["Weekdays", "0 9 * * 1-5"],
  ["Weekly", "0 0 * * 0"],
  ["Monthly", "0 0 1 * *"],
] as const;

type ParsedField = { values: Set<number>; wildcard: boolean };
export type ParsedCron = {
  expression: string;
  fields: [ParsedField, ParsedField, ParsedField, ParsedField, ParsedField];
};

function integer(value: string, field: (typeof CRON_FIELDS)[number]) {
  if (!/^\d+$/.test(value))
    throw new Error(`${field.label} contains an invalid value.`);
  const number = Number(value);
  if (number < field.min || number > field.max)
    throw new Error(
      `${field.label} must be between ${field.min} and ${field.max}.`,
    );
  return number;
}

function parseField(
  source: string,
  field: (typeof CRON_FIELDS)[number],
): ParsedField {
  const values = new Set<number>();
  for (const item of source.split(",")) {
    if (!item) throw new Error(`${field.label} contains an empty list item.`);
    const parts = item.split("/");
    if (parts.length > 2)
      throw new Error(`${field.label} has an invalid step.`);
    const base = parts[0]!;
    const step = parts[1] === undefined ? 1 : Number(parts[1]);
    if (!Number.isInteger(step) || step < 1)
      throw new Error(`${field.label} step must be a positive integer.`);
    let start: number;
    let end: number;
    if (base === "*") {
      start = field.min;
      end = field.max;
    } else if (base.includes("-")) {
      const range = base.split("-");
      if (range.length !== 2)
        throw new Error(`${field.label} has an invalid range.`);
      start = integer(range[0]!, field);
      end = integer(range[1]!, field);
      if (start > end)
        throw new Error(`${field.label} range must run from low to high.`);
    } else {
      start = integer(base, field);
      end = parts[1] === undefined ? start : field.max;
    }
    for (let value = start; value <= end; value += step) values.add(value);
  }
  return { values, wildcard: source === "*" };
}

export function parseCron(expression: string): ParsedCron {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5)
    throw new Error(
      "Use exactly five fields: minute hour day-of-month month day-of-week.",
    );
  return {
    expression: parts.join(" "),
    fields: CRON_FIELDS.map((field, index) =>
      parseField(parts[index]!, field),
    ) as ParsedCron["fields"],
  };
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();
function zonedParts(date: Date, timeZone: string) {
  if (timeZone === "UTC") {
    return {
      minute: date.getUTCMinutes(),
      hour: date.getUTCHours(),
      day: date.getUTCDate(),
      month: date.getUTCMonth() + 1,
      weekday: date.getUTCDay(),
    };
  }
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
      weekday: "short",
    });
    formatterCache.set(timeZone, formatter);
  }
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    minute: Number(parts.minute),
    hour: Number(parts.hour),
    day: Number(parts.day),
    month: Number(parts.month),
    weekday: weekdays[parts.weekday!]!,
  };
}

export function cronMatches(parsed: ParsedCron, date: Date, timeZone = "UTC") {
  const [minute, hour, dom, month, dow] = parsed.fields;
  const value = zonedParts(date, timeZone);
  const dowMatch =
    dow.values.has(value.weekday) || (value.weekday === 0 && dow.values.has(7));
  const dayMatch = dom.wildcard
    ? dowMatch
    : dow.wildcard
      ? dom.values.has(value.day)
      : dom.values.has(value.day) || dowMatch;
  return (
    minute.values.has(value.minute) &&
    hour.values.has(value.hour) &&
    month.values.has(value.month) &&
    dayMatch
  );
}

export function nextCronRuns(
  expression: string,
  options: { from?: Date; timeZone?: string; count?: number } = {},
) {
  const parsed = parseCron(expression);
  const [, , dom, month, dow] = parsed.fields;
  if (!dom.wildcard && dow.wildcard) {
    const possible = [...month.values].some((monthValue) => {
      const days = new Date(Date.UTC(2000, monthValue, 0)).getUTCDate();
      return [...dom.values].some((day) => day <= days);
    });
    if (!possible)
      throw new Error(
        "This schedule is impossible for the selected month and day-of-month.",
      );
  }
  const count = options.count ?? 10;
  const timeZone = options.timeZone ?? "UTC";
  let cursor = new Date(options.from ?? Date.now());
  cursor = new Date(Math.floor(cursor.getTime() / 60_000) * 60_000 + 60_000);
  const results: Date[] = [];
  const limit = cursor.getTime() + 8 * 366 * 24 * 60 * 60_000;
  while (cursor.getTime() <= limit && results.length < count) {
    if (cronMatches(parsed, cursor, timeZone)) results.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + 60_000);
  }
  if (!results.length)
    throw new Error(
      "This schedule has no possible run in the next eight years.",
    );
  return results;
}

function describeField(source: string, label: string) {
  if (source === "*") return `${label}: every value`;
  if (source.startsWith("*/")) return `${label}: every ${source.slice(2)}`;
  if (source.includes(",")) return `${label}: ${source.split(",").join(", ")}`;
  if (source.includes("-"))
    return `${label}: ${source.replace("-", " through ")}`;
  return `${label}: ${source}`;
}

export function explainCron(expression: string) {
  const parsed = parseCron(expression);
  const parts = parsed.expression.split(" ");
  const known: Record<string, string> = {
    "* * * * *": "Every minute",
    "*/5 * * * *": "Every 5 minutes",
    "0 * * * *": "At minute 0 of every hour",
    "0 0 * * *": "Every day at 00:00",
    "0 9 * * 1-5": "At 09:00, Monday through Friday",
    "0 0 * * 0": "Every Sunday at 00:00",
    "0 0 1 * *": "On day 1 of every month at 00:00",
  };
  return {
    summary:
      known[parsed.expression] ??
      `At schedules matching “${parsed.expression}”`,
    fields: CRON_FIELDS.map((field, index) =>
      describeField(parts[index]!, field.label),
    ),
  };
}

export function simpleCronFields(expression: string) {
  const parsed = parseCron(expression);
  const parts = parsed.expression.split(" ");
  return parts.every((part) => part === "*" || /^\d+$/.test(part))
    ? parts
    : undefined;
}
