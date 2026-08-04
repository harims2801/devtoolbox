export type TimestampUnit = "auto" | "seconds" | "milliseconds";

export interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface DateOutputs {
  local: string;
  selectedZone: string;
  utc: string;
  iso: string;
  rfc2822: string;
  relative: string;
  seconds: string;
  milliseconds: string;
}

const timestampPattern = /^-?\d+(?:\.\d+)?$/;
const localDateTimePattern =
  /^(\d{4,6})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

export const COMMON_TIME_ZONES = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

function validDate(milliseconds: number) {
  const date = new Date(milliseconds);
  if (!Number.isFinite(milliseconds) || Number.isNaN(date.getTime())) {
    throw new Error("Date is outside the supported JavaScript date range.");
  }
  return date;
}

export function detectTimestampUnit(
  value: number,
): Exclude<TimestampUnit, "auto"> {
  return Math.abs(value) >= 100_000_000_000 ? "milliseconds" : "seconds";
}

export function timestampToDate(input: string, unit: TimestampUnit = "auto") {
  const trimmed = input.trim();
  if (!timestampPattern.test(trimmed)) {
    throw new Error("Enter a valid Unix timestamp using digits only.");
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) throw new Error("Timestamp is out of range.");
  const resolvedUnit = unit === "auto" ? detectTimestampUnit(value) : unit;
  return {
    date: validDate(resolvedUnit === "seconds" ? value * 1000 : value),
    detectedUnit: resolvedUnit,
  };
}

function timeZoneParts(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.year!,
    month: values.month!,
    day: values.day!,
    hour: values.hour!,
    minute: values.minute!,
    second: values.second!,
  };
}

function sameParts(left: DateParts, right: DateParts) {
  return (Object.keys(left) as Array<keyof DateParts>).every(
    (key) => left[key] === right[key],
  );
}

export function parseLocalDateTime(value: string): DateParts {
  const match = value.match(localDateTimePattern);
  if (!match) {
    throw new Error(
      "Enter a complete date and time in YYYY-MM-DD HH:mm format.",
    );
  }
  const parts: DateParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };
  const candidate = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ),
  );
  const reconstructed: DateParts = {
    year: candidate.getUTCFullYear(),
    month: candidate.getUTCMonth() + 1,
    day: candidate.getUTCDate(),
    hour: candidate.getUTCHours(),
    minute: candidate.getUTCMinutes(),
    second: candidate.getUTCSeconds(),
  };
  if (!sameParts(parts, reconstructed)) {
    throw new Error("The selected calendar date or time is impossible.");
  }
  return parts;
}

export function zonedDateTimeToDate(value: string, timeZone: string) {
  const desired = parseLocalDateTime(value);
  const desiredUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
    desired.second,
  );
  let guess = desiredUtc;
  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const observed = timeZoneParts(validDate(guess), timeZone);
      const observedUtc = Date.UTC(
        observed.year,
        observed.month - 1,
        observed.day,
        observed.hour,
        observed.minute,
        observed.second,
      );
      guess -= observedUtc - desiredUtc;
    }
  } catch {
    throw new Error("The selected time zone is not supported by this browser.");
  }
  const result = validDate(guess);
  if (!sameParts(timeZoneParts(result, timeZone), desired)) {
    throw new Error(
      "This local time does not exist in the selected time zone, usually because of daylight saving time.",
    );
  }
  return result;
}

export function formatRelativeTime(date: Date, now = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const absolute = Math.abs(seconds);
  const [value, unit] =
    absolute >= 86_400
      ? [Math.round(seconds / 86_400), "day"]
      : absolute >= 3_600
        ? [Math.round(seconds / 3_600), "hour"]
        : absolute >= 60
          ? [Math.round(seconds / 60), "minute"]
          : [seconds, "second"];
  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
    value,
    unit as Intl.RelativeTimeFormatUnit,
  );
}

export function formatDateOutputs(
  date: Date,
  timeZone: string,
  now = new Date(),
): DateOutputs {
  validDate(date.getTime());
  const selectedZone = new Intl.DateTimeFormat(undefined, {
    timeZone,
    dateStyle: "full",
    timeStyle: "long",
  }).format(date);
  return {
    local: date.toLocaleString(),
    selectedZone,
    utc: date.toUTCString(),
    iso: date.toISOString(),
    rfc2822: date.toUTCString(),
    relative: formatRelativeTime(date, now),
    seconds: String(Math.trunc(date.getTime() / 1000)),
    milliseconds: String(date.getTime()),
  };
}

export function dateToTimestamps(value: string, timeZone: string) {
  const date = zonedDateTimeToDate(value, timeZone);
  return {
    date,
    seconds: Math.trunc(date.getTime() / 1000),
    milliseconds: date.getTime(),
  };
}

export function toDateTimeLocalValue(date: Date, timeZone: string) {
  const parts = timeZoneParts(date, timeZone);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
}
