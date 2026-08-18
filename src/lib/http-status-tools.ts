import {
  HTTP_STATUS_CODES,
  type HttpStatusClassification,
} from "@/data/http-status-codes";

export interface HttpStatusFilters {
  categories?: number[];
  classifications?: HttpStatusClassification[];
}

export function normalizeStatusSearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function searchHttpStatuses(
  query: string,
  filters: HttpStatusFilters = {},
) {
  const terms = normalizeStatusSearch(query).split(" ").filter(Boolean);
  return HTTP_STATUS_CODES.filter((entry) => {
    if (
      filters.categories?.length &&
      !filters.categories.includes(entry.category)
    )
      return false;
    if (
      filters.classifications?.length &&
      !filters.classifications.includes(entry.classification)
    )
      return false;
    const haystack = normalizeStatusSearch(
      [
        entry.code,
        entry.title,
        entry.explanation,
        entry.troubleshooting,
        entry.reference,
        ...entry.keywords,
      ].join(" "),
    );
    return terms.every((term) => haystack.includes(term));
  });
}

export function unknownHttpStatus(code: number) {
  if (!Number.isInteger(code) || code < 100 || code > 599) return null;
  if (HTTP_STATUS_CODES.some((entry) => entry.code === code)) return null;
  return {
    code,
    category: Math.floor(code / 100),
    title: "Unassigned or unknown",
    explanation:
      "This code is not present in the bundled IANA snapshot or the curated commonly observed list.",
  };
}

export function formatHttpStatusEntry(
  entry: (typeof HTTP_STATUS_CODES)[number],
) {
  return [
    `${entry.code} ${entry.title}`,
    `Classification: ${entry.classification}`,
    `Reference: ${entry.reference}`,
    entry.explanation,
    `Troubleshooting: ${entry.troubleshooting}`,
    entry.cache ? `Cache: ${entry.cache}` : "",
    entry.auth ? `Authentication: ${entry.auth}` : "",
    entry.retry ? `Retry: ${entry.retry}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
