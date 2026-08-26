import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WebhookTesterTool } from "@/components/tools/webhook-tester-tool";

const report = {
  endpoint: "https://example.com/webhook",
  method: "POST",
  status: 200,
  statusText: "OK",
  timingMilliseconds: 12,
  redirects: [],
  responseHeaders: [{ name: "content-type", value: "text/html" }],
  contentType: "text/html",
  preview: {
    kind: "text",
    content: '<img src=x onerror="alert(1)">',
    truncated: false,
    bytesRead: 30,
  },
};

describe("WebhookTesterTool", () => {
  it("requires deliberate consent, sends exact fields, and renders HTML as text", async () => {
    const user = userEvent.setup(),
      fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => report,
      } as Response);
    render(<WebhookTesterTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    expect(
      screen.getByRole("button", { name: "Send confirmed webhook" }),
    ).toBeDisabled();
    await user.click(screen.getAllByLabelText("Confirm webhook send")[0]!);
    await user.click(
      screen.getByRole("button", { name: "Send confirmed webhook" }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("webhook-report")).toBeInTheDocument(),
    );
    const request = fetchSpy.mock.calls.find(
      ([url]) => url === "/api/webhook-test",
    );
    expect(
      JSON.parse(String((request?.[1] as RequestInit).body)),
    ).toMatchObject({
      endpoint: "https://example.com/webhook",
      method: "POST",
      payload: { event: "order.created", test: true },
      consent: true,
    });
    expect(screen.getAllByText(/<img src=x/)[0]).toBeVisible();
    expect(document.querySelector("img")).toBeNull();
  });

  it("revokes consent whenever outbound data changes", async () => {
    const user = userEvent.setup();
    render(<WebhookTesterTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    await user.click(screen.getAllByLabelText("Confirm webhook send")[0]!);
    expect(
      screen.getByRole("button", { name: "Send confirmed webhook" }),
    ).toBeEnabled();
    fireEvent.change(screen.getAllByLabelText("JSON payload")[0]!, {
      target: { value: '{"changed":true}' },
    });
    expect(
      screen.getByRole("button", { name: "Send confirmed webhook" }),
    ).toBeDisabled();
  });

  it("blocks send for malformed JSON and shows safe API errors", async () => {
    const user = userEvent.setup();
    render(<WebhookTesterTool />);
    fireEvent.change(screen.getAllByLabelText("JSON payload")[0]!, {
      target: { value: "{" },
    });
    expect(screen.getAllByRole("alert")[0]).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Send confirmed webhook" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getAllByLabelText("Public HTTPS endpoint")[0]).toHaveValue(
      "",
    );
  });
});
