export interface IsoDateComponents {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  fractionalSecond?: string;
  offset?: string;
}

export type IsoDateResult =
  | {
      kind: "date";
      canonical: string;
      components: IsoDateComponents;
    }
  | {
      kind: "instant";
      canonical: string;
      utc: string;
      preservedOffset: string;
      unixSeconds: number;
      unixMilliseconds: number;
      fractionalPrecision: number;
      components: IsoDateComponents;
    };

const yearPattern = "([+-]\\d{6}|\\d{4})",
  datePattern = new RegExp(`^${yearPattern}-(\\d{2})-(\\d{2})$`),
  instantPattern = new RegExp(
    `^${yearPattern}-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})(?::(\\d{2})(?:\\.(\\d{1,9}))?)?(Z|[+-]\\d{2}:\\d{2})$`,
    "i",
  );

function pad(value: number, size = 2) {
  return String(value).padStart(size, "0");
}

function formatYear(year: number) {
  if (year >= 0 && year <= 9999) return pad(year, 4);
  return `${year < 0 ? "-" : "+"}${pad(Math.abs(year), 6)}`;
}

function parseYear(value: string) {
  return Number(value);
}

function validateDate(year: number, month: number, day: number) {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  )
    throw new Error("The ISO calendar date is out of range or does not exist.");
  return date;
}

function offsetMinutes(value: string) {
  if (value.toUpperCase() === "Z") return 0;
  const sign = value[0] === "-" ? -1 : 1,
    hours = Number(value.slice(1, 3)),
    minutes = Number(value.slice(4, 6));
  if (hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0))
    throw new Error("The ISO offset must be between -14:00 and +14:00.");
  return sign * (hours * 60 + minutes);
}

function utcWithPrecision(instant: number, fraction?: string) {
  const base = new Date(instant).toISOString(),
    whole = base.slice(0, base.indexOf("."));
  return fraction ? `${whole}.${fraction}Z` : `${whole}Z`;
}

export function parseIsoDate(value: string): IsoDateResult {
  if (value !== value.trim())
    throw new Error("Remove surrounding whitespace from the ISO value.");
  const dateMatch = datePattern.exec(value);
  if (dateMatch) {
    const components = {
      year: parseYear(dateMatch[1]!),
      month: Number(dateMatch[2]),
      day: Number(dateMatch[3]),
    };
    validateDate(components.year, components.month, components.day);
    return {
      kind: "date",
      canonical: `${formatYear(components.year)}-${pad(components.month)}-${pad(components.day)}`,
      components,
    };
  }

  const match = instantPattern.exec(value);
  if (!match) {
    if (/^.+T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value))
      throw new Error(
        "A date-time must include Z or an explicit numeric offset; a zone-less wall time is ambiguous.",
      );
    throw new Error(
      "Enter an ISO 8601 calendar date or date-time with Z or an explicit offset.",
    );
  }
  const components: IsoDateComponents = {
      year: parseYear(match[1]!),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: Number(match[4]),
      minute: Number(match[5]),
      second: Number(match[6] ?? 0),
      fractionalSecond: match[7],
      offset: match[8]!.toUpperCase(),
    },
    date = validateDate(components.year, components.month, components.day);
  if (
    components.hour! > 23 ||
    components.minute! > 59 ||
    components.second! > 59
  )
    throw new Error("The ISO time is out of range.");
  const milliseconds = Number(
    (components.fractionalSecond ?? "").slice(0, 3).padEnd(3, "0"),
  );
  date.setUTCHours(
    components.hour!,
    components.minute!,
    components.second!,
    milliseconds,
  );
  const instant = date.getTime() - offsetMinutes(components.offset!) * 60_000;
  if (!Number.isFinite(instant))
    throw new Error("The ISO instant is out of range.");
  const datePart = `${formatYear(components.year)}-${pad(components.month)}-${pad(components.day)}`,
    timePart = `${pad(components.hour!)}:${pad(components.minute!)}:${pad(components.second!)}`,
    fraction = components.fractionalSecond
      ? `.${components.fractionalSecond}`
      : "",
    preservedOffset = `${datePart}T${timePart}${fraction}${components.offset}`;
  return {
    kind: "instant",
    canonical: preservedOffset,
    utc: utcWithPrecision(instant, components.fractionalSecond),
    preservedOffset,
    unixSeconds: instant / 1000,
    unixMilliseconds: instant,
    fractionalPrecision: components.fractionalSecond?.length ?? 0,
    components,
  };
}

export function describeRelativeInstant(instant: number, now = Date.now()) {
  const seconds = Math.round((instant - now) / 1000),
    absolute = Math.abs(seconds),
    formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (absolute < 60) return formatter.format(seconds, "second");
  if (absolute < 3600)
    return formatter.format(Math.round(seconds / 60), "minute");
  if (absolute < 86_400)
    return formatter.format(Math.round(seconds / 3600), "hour");
  if (absolute < 31_536_000)
    return formatter.format(Math.round(seconds / 86_400), "day");
  return formatter.format(Math.round(seconds / 31_536_000), "year");
}
