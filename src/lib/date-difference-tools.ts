import {
  parseLocalDateTime,
  resolveZonedDateTime,
  type LocalDateTimeParts,
  type TimeDisambiguation,
} from "@/lib/time-zone-tools";

const DAY = 86_400_000;

export interface DateDifferenceEndpoint {
  value: string;
  zone: string;
  disambiguation?: TimeDisambiguation;
}

export interface CalendarDifference {
  years: number;
  months: number;
  days: number;
}

export interface DateDifferenceResult {
  startInstant: number;
  endInstant: number;
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  calendar: CalendarDifference;
  inclusiveCalendarDays?: number;
}

function dateParts(value: string, dateOnly: boolean) {
  return parseLocalDateTime(dateOnly ? `${value}T00:00` : value);
}

function resolveEndpoint(
  endpoint: DateDifferenceEndpoint,
  dateOnly: boolean,
  label: string,
) {
  const value = dateOnly ? `${endpoint.value}T00:00` : endpoint.value;
  const resolution = resolveZonedDateTime(
    value,
    endpoint.zone,
    endpoint.disambiguation,
  );
  if (resolution.status === "nonexistent")
    throw new Error(
      `${label} does not exist in ${endpoint.zone} because of a daylight-saving clock change.`,
    );
  if (resolution.status === "ambiguous" && resolution.instant === undefined)
    throw new Error(
      `${label} occurs twice in ${endpoint.zone}. Choose the earlier or later occurrence.`,
    );
  return resolution.instant!;
}

function utcDate(parts: Pick<LocalDateTimeParts, "year" | "month" | "day">) {
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonthsClamped(
  parts: Pick<LocalDateTimeParts, "year" | "month" | "day">,
  months: number,
) {
  const index = parts.year * 12 + parts.month - 1 + months,
    year = Math.floor(index / 12),
    month = (((index % 12) + 12) % 12) + 1;
  return {
    year,
    month,
    day: Math.min(parts.day, daysInMonth(year, month)),
  };
}

export function calculateCalendarDifference(
  start: Pick<LocalDateTimeParts, "year" | "month" | "day">,
  end: Pick<LocalDateTimeParts, "year" | "month" | "day">,
): CalendarDifference {
  const startValue = utcDate(start),
    endValue = utcDate(end);
  if (startValue === endValue) return { years: 0, months: 0, days: 0 };
  const sign = startValue < endValue ? 1 : -1,
    earlier = sign > 0 ? start : end,
    later = sign > 0 ? end : start;
  let months = (later.year - earlier.year) * 12 + later.month - earlier.month,
    cursor = addMonthsClamped(earlier, months);
  if (utcDate(cursor) > utcDate(later)) {
    months -= 1;
    cursor = addMonthsClamped(earlier, months);
  }
  const days = Math.round((utcDate(later) - utcDate(cursor)) / DAY);
  const signed = (value: number) => (value === 0 ? 0 : sign * value);
  return {
    years: signed(Math.floor(months / 12)),
    months: signed(months % 12),
    days: signed(days),
  };
}

export function calculateDateDifference(
  start: DateDifferenceEndpoint,
  end: DateDifferenceEndpoint,
  options: { dateOnly?: boolean; inclusive?: boolean } = {},
): DateDifferenceResult {
  const dateOnly = options.dateOnly ?? false,
    startParts = dateParts(start.value, dateOnly),
    endParts = dateParts(end.value, dateOnly),
    startInstant = resolveEndpoint(start, dateOnly, "Start time"),
    endInstant = resolveEndpoint(end, dateOnly, "End time"),
    milliseconds = endInstant - startInstant,
    calendar = calculateCalendarDifference(startParts, endParts),
    result: DateDifferenceResult = {
      startInstant,
      endInstant,
      milliseconds,
      seconds: milliseconds / 1000,
      minutes: milliseconds / 60_000,
      hours: milliseconds / 3_600_000,
      days: milliseconds / DAY,
      calendar,
    };
  if (dateOnly && options.inclusive) {
    const calendarDistance = Math.round(
      (utcDate(endParts) - utcDate(startParts)) / DAY,
    );
    result.inclusiveCalendarDays =
      calendarDistance === 0
        ? 1
        : calendarDistance + Math.sign(calendarDistance);
  }
  return result;
}

export function formatDateDifference(result: DateDifferenceResult) {
  const calendar = result.calendar,
    lines = [
      `Elapsed milliseconds: ${result.milliseconds}`,
      `Elapsed seconds: ${result.seconds}`,
      `Elapsed minutes: ${result.minutes}`,
      `Elapsed hours: ${result.hours}`,
      `Elapsed days: ${result.days}`,
      `Calendar difference: ${calendar.years} years, ${calendar.months} months, ${calendar.days} days`,
    ];
  if (result.inclusiveCalendarDays !== undefined)
    lines.push(`Inclusive calendar days: ${result.inclusiveCalendarDays}`);
  return lines.join("\n");
}
