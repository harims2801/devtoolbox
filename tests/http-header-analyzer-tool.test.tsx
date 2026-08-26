import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpHeaderAnalyzerTool } from "@/components/tools/http-header-analyzer-tool";

beforeEach(cleanup);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("HTTP header analyzer tool", () => {
  it("loads an example, submits, and renders security and cookie metadata", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        requestedUrl: "https://example.com/",
        finalUrl: "https://example.com/",
        method: "HEAD",
        status: 200,
        statusText: "OK",
        redirects: [],
        headers: [{ name: "content-type", value: "text/html" }],
        cacheDirectives: {},
        contentType: "text/html",
        compression: "br",
        cookies: [
          { name: "session", secure: true, httpOnly: true, sameSite: "Lax" },
        ],
        security: [
          {
            header: "content-security-policy",
            status: "pass",
            message: "CSP present.",
          },
        ],
        analyzedAt: "2026-08-18T00:00:00.000Z",
      }),
    } as Response);
    const { unmount } = render(<HttpHeaderAnalyzerTool />);
    fireEvent.click(screen.getByRole("button", { name: "Load example" }));
    fireEvent.click(screen.getByRole("button", { name: "Analyze headers" }));
    await waitFor(() =>
      expect(screen.getByTestId("header-report")).toBeInTheDocument(),
    );
    expect(screen.getByText("200 OK")).toBeInTheDocument();
    expect(screen.getByText(/values hidden/i)).toBeInTheDocument();
    expect(screen.queryByText(/super-secret/i)).not.toBeInTheDocument();
    unmount();
  });

  it("shows a safe API error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Only public URLs are allowed." }),
    } as Response);
    render(<HttpHeaderAnalyzerTool />);
    fireEvent.change(screen.getAllByLabelText("Public HTTP or HTTPS URL")[0]!, {
      target: { value: "http://localhost" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze headers" }));
    expect((await screen.findAllByRole("alert"))[0]).toHaveTextContent(
      "Only public URLs are allowed.",
    );
  });
});
