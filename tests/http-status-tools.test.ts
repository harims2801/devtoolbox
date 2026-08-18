import { describe, expect, it } from "vitest";
import {
  HTTP_STATUS_CODES,
  HTTP_STATUS_REGISTRY_SOURCE,
} from "@/data/http-status-codes";
import {
  normalizeStatusSearch,
  searchHttpStatuses,
  unknownHttpStatus,
} from "@/lib/http-status-tools";

describe("HTTP status reference data", () => {
  it("contains the versioned IANA snapshot with unique assigned codes", () => {
    const standard = HTTP_STATUS_CODES.filter(
        (entry) => entry.classification !== "non-standard",
      ),
      codes = standard.map((entry) => entry.code);
    expect(HTTP_STATUS_REGISTRY_SOURCE.lastUpdated).toBe("2025-09-15");
    expect(standard.length).toBeGreaterThanOrEqual(60);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toEqual(
      expect.arrayContaining([100, 104, 200, 308, 404, 429, 451, 511]),
    );
  });

  it("provides explanations and troubleshooting for representative categories", () => {
    for (const code of [100, 200, 301, 401, 404, 429, 503]) {
      const entry = HTTP_STATUS_CODES.find((item) => item.code === code)!;
      expect(entry.explanation.length).toBeGreaterThan(30);
      expect(entry.troubleshooting.length).toBeGreaterThan(30);
    }
    expect(HTTP_STATUS_CODES.find((item) => item.code === 401)?.auth).toContain(
      "WWW-Authenticate",
    );
    expect(
      HTTP_STATUS_CODES.find((item) => item.code === 503)?.retry,
    ).toContain("Retry-After");
    expect(
      HTTP_STATUS_CODES.find((item) => item.code === 304)?.cache,
    ).toContain("cached");
  });

  it("searches by code, phrase, category, keyword, and normalized punctuation", () => {
    expect(searchHttpStatuses("404").map((entry) => entry.code)).toEqual([404]);
    expect(
      searchHttpStatuses("upstream gateway").map((entry) => entry.code),
    ).toEqual(expect.arrayContaining([502, 504]));
    expect(
      searchHttpStatuses("non_authoritative").map((entry) => entry.code),
    ).toContain(203);
    expect(normalizeStatusSearch("  Too—Many_Requests ")).toBe(
      "too many requests",
    );
  });

  it("filters categories and classifications", () => {
    expect(
      searchHttpStatuses("", { categories: [1] }).every(
        (entry) => entry.category === 1,
      ),
    ).toBe(true);
    const deprecated = searchHttpStatuses("", {
      classifications: ["deprecated"],
    });
    expect(deprecated.map((entry) => entry.code)).toEqual([305, 306, 418, 510]);
    const observed = searchHttpStatuses("", {
      classifications: ["non-standard"],
    });
    expect(observed.map((entry) => entry.code)).toEqual(
      expect.arrayContaining([419, 444, 499, 520]),
    );
  });

  it("identifies unknown and out-of-range codes", () => {
    expect(unknownHttpStatus(599)).toMatchObject({
      code: 599,
      title: "Unassigned or unknown",
    });
    expect(unknownHttpStatus(99)).toBeNull();
    expect(unknownHttpStatus(404)).toBeNull();
  });
});
