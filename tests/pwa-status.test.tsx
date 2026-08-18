import { render, screen, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PwaStatus } from "@/components/pwa/pwa-status";
describe("PwaStatus", () => {
  it("shows offline status", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    render(<PwaStatus />);
    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByText(/Offline: local tools/)).toBeVisible();
  });
});
