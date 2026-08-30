import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PrivacyAnalytics } from "@/components/analytics/privacy-analytics";
import { ANALYTICS_DISABLED_KEY } from "@/lib/privacy-tools";

let beforeSend:
  ((event: { url: string }) => { url: string } | null) | undefined;

vi.mock("next/navigation", () => ({ usePathname: () => "/tools" }));
vi.mock("@vercel/analytics/next", () => ({
  Analytics: (props: {
    beforeSend: (event: { url: string }) => { url: string } | null;
  }) => {
    beforeSend = props.beforeSend;
    return null;
  },
}));

describe("PrivacyAnalytics", () => {
  beforeEach(() => {
    localStorage.clear();
    beforeSend = undefined;
    Object.defineProperty(navigator, "doNotTrack", {
      configurable: true,
      value: "0",
    });
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn(() => true),
    });
  });

  it("allows Vercel page events when analytics is enabled", () => {
    render(<PrivacyAnalytics />);
    const event = { url: "https://devtools.hariharanms.in/tools" };

    expect(beforeSend?.(event)).toBe(event);
  });

  it("blocks Vercel events for opt-out and Do Not Track visitors", () => {
    localStorage.setItem(ANALYTICS_DISABLED_KEY, "true");
    render(<PrivacyAnalytics />);

    expect(beforeSend?.({ url: "https://example.test/private" })).toBeNull();

    localStorage.removeItem(ANALYTICS_DISABLED_KEY);
    Object.defineProperty(navigator, "doNotTrack", {
      configurable: true,
      value: "1",
    });
    expect(beforeSend?.({ url: "https://example.test/dnt" })).toBeNull();
  });
});
