import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DnsLookupTool } from "@/components/tools/dns-lookup-tool";

afterEach(() => vi.restoreAllMocks());

describe("DnsLookupTool", () => {
  it("submits selected records and displays recursive metadata", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          query: "example.com",
          normalizedName: "example.com",
          records: [
            { type: "A", name: "example.com", value: "93.184.216.34", ttl: 60 },
          ],
          resolver: {
            kind: "recursive",
            name: "Test resolver",
            authoritative: false,
          },
          cached: false,
          queriedAt: "2026-08-18T00:00:00.000Z",
        }),
        { status: 200 },
      ),
    );
    render(<DnsLookupTool />);
    fireEvent.change(
      screen.getAllByLabelText("Public hostname or IP for PTR")[0]!,
      { target: { value: "example.com" } },
    );
    await user.click(screen.getByRole("button", { name: "Look up" }));
    const output = await screen.findAllByTestId("dns-output");
    expect(output[0]).toHaveTextContent("93.184.216.34");
    expect(output[0]).toHaveTextContent("recursive answer · not authoritative");
    expect(
      screen.getAllByRole("button", { name: "Copy report" })[0],
    ).toBeEnabled();
  });

  it("shows stable API errors", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error:
            "Private, local, and special-use network targets are not allowed.",
        }),
        { status: 400 },
      ),
    );
    render(<DnsLookupTool />);
    fireEvent.change(
      screen.getAllByLabelText("Public hostname or IP for PTR")[0]!,
      { target: { value: "localhost" } },
    );
    await user.click(screen.getByRole("button", { name: "Look up" }));
    expect((await screen.findAllByRole("alert"))[0]).toHaveTextContent(
      "special-use",
    );
  });
});
