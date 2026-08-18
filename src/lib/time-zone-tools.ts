export type TimeDisambiguation = "earlier" | "later";
export interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}
export interface ZonedResolution {
  status: "valid" | "ambiguous" | "nonexistent";
  candidates: number[];
  instant?: number;
}
function formatter(zone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}
export function assertTimeZone(zone: string) {
  try {
    formatter(zone).format(0);
  } catch {
    throw new Error(`Unsupported IANA time zone "${zone}".`);
  }
  return zone;
}
export function parseLocalDateTime(value: string): LocalDateTimeParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value,
  );
  if (!match) throw new Error("Enter a complete local date and time.");
  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };
  const check = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ),
  );
  if (
    check.getUTCFullYear() !== parts.year ||
    check.getUTCMonth() + 1 !== parts.month ||
    check.getUTCDate() !== parts.day ||
    parts.hour > 23 ||
    parts.minute > 59 ||
    parts.second > 59
  )
    throw new Error("The local date or time is invalid.");
  return parts;
}
function localParts(instant: number, zone: string) {
  const values: Record<string, string> = {};
  for (const part of formatter(zone).formatToParts(new Date(instant)))
    if (part.type !== "literal") values[part.type] = part.value;
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}
function same(a: LocalDateTimeParts, b: LocalDateTimeParts) {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute &&
    a.second === b.second
  );
}
export function getTimeZoneOffsetMilliseconds(instant: number, zone: string) {
  assertTimeZone(zone);
  const parts = localParts(instant, zone);
  const rounded = Math.floor(instant / 1000) * 1000;
  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ) - rounded
  );
}
export function resolveZonedDateTime(
  value: string,
  zone: string,
  disambiguation?: TimeDisambiguation,
): ZonedResolution {
  assertTimeZone(zone);
  const desired = parseLocalDateTime(value),
    naive = Date.UTC(
      desired.year,
      desired.month - 1,
      desired.day,
      desired.hour,
      desired.minute,
      desired.second,
    );
  const offsets = new Set<number>();
  for (let delta = -36 * 3600000; delta <= 36 * 3600000; delta += 6 * 3600000)
    offsets.add(getTimeZoneOffsetMilliseconds(naive + delta, zone));
  const candidates = Array.from(offsets, (value) => naive - value)
    .filter((value) => same(localParts(value, zone), desired))
    .sort((a, b) => a - b);
  const unique = Array.from(new Set(candidates));
  if (!unique.length) return { status: "nonexistent", candidates: [] };
  if (unique.length > 1)
    return {
      status: "ambiguous",
      candidates: unique,
      instant:
        disambiguation === "earlier"
          ? unique[0]
          : disambiguation === "later"
            ? unique.at(-1)
            : undefined,
    };
  return { status: "valid", candidates: unique, instant: unique[0] };
}
function pad(value: number) {
  return String(value).padStart(2, "0");
}
export function formatOffset(milliseconds: number) {
  const sign = milliseconds < 0 ? "-" : "+",
    absolute = Math.abs(milliseconds),
    hours = Math.floor(absolute / 3600000),
    minutes = Math.floor((absolute % 3600000) / 60000);
  return `UTC${sign}${pad(hours)}:${pad(minutes)}`;
}
export function formatZonedInstant(
  instant: number,
  zone: string,
  locale = "en-US",
) {
  assertTimeZone(zone);
  const parts = localParts(instant, zone);
  return {
    zone,
    iso: new Date(instant).toISOString(),
    local: `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`,
    offset: formatOffset(getTimeZoneOffsetMilliseconds(instant, zone)),
    localized: new Intl.DateTimeFormat(locale, {
      timeZone: zone,
      dateStyle: "full",
      timeStyle: "long",
    }).format(new Date(instant)),
  };
}
export function getSupportedTimeZones(
  browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  const supported =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [];
  return Array.from(
    new Set(["UTC", browserZone, ...supported].filter(Boolean)),
  ).sort();
}
