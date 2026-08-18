import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { JsonDiffTool } from "@/components/tools/json-diff-tool";

describe("JsonDiffTool", () => {
  it("shows summary, escaped pointers, views, filtering, and patch export", async () => {
    const user = userEvent.setup();
    render(<JsonDiffTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    await user.click(screen.getByRole("button", { name: "Compare" }));
    const output = screen.getAllByTestId("json-diff-output")[0]!;
    expect(output).toHaveTextContent("/a~1b");
    expect(output).toHaveTextContent("type-changed");
    expect(
      screen.getAllByRole("button", { name: "Copy JSON Patch" })[0],
    ).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Unified" }));
    fireEvent.change(screen.getAllByLabelText("Filter by JSON Pointer")[0]!, {
      target: { value: "/user/city" },
    });
    expect(output).toHaveTextContent("Showing 1 of 4 differences");
    expect(output).toHaveTextContent("London");
  });

  it("validates both documents independently with locations", async () => {
    const user = userEvent.setup();
    render(<JsonDiffTool />);
    fireEvent.change(screen.getAllByLabelText("Original JSON")[0]!, {
      target: { value: '{\n "a": }' },
    });
    fireEvent.change(screen.getAllByLabelText("Modified JSON")[0]!, {
      target: { value: '{\n "b": }' },
    });
    await user.click(screen.getByRole("button", { name: "Compare" }));
    const alerts = screen.getAllByRole("alert");
    const messages = new Set(alerts.map((alert) => alert.textContent));
    expect(messages.size).toBe(2);
    expect(
      [...messages].some(
        (message) =>
          message?.startsWith("Original:") && message.includes("line 2"),
      ),
    ).toBe(true);
    expect(
      [...messages].some(
        (message) =>
          message?.startsWith("Modified:") && message.includes("line 2"),
      ),
    ).toBe(true);
  });

  it("documents unordered semantics and disables JSON Patch", async () => {
    const user = userEvent.setup();
    render(<JsonDiffTool />);
    fireEvent.change(screen.getAllByLabelText("Original JSON")[0]!, {
      target: { value: "[1,2]" },
    });
    fireEvent.change(screen.getAllByLabelText("Modified JSON")[0]!, {
      target: { value: "[2,3]" },
    });
    await user.click(
      screen.getAllByLabelText(/Compare arrays as unordered multisets/)[0]!,
    );
    await user.click(screen.getByRole("button", { name: "Compare" }));
    expect(screen.getAllByTestId("json-diff-output")[0]).toHaveTextContent(
      "JSON Patch is disabled",
    );
    expect(
      screen.queryByRole("button", { name: "Copy JSON Patch" }),
    ).not.toBeInTheDocument();
  });

  it("renders untrusted strings as text", async () => {
    const user = userEvent.setup();
    render(<JsonDiffTool />);
    fireEvent.change(screen.getAllByLabelText("Original JSON")[0]!, {
      target: { value: '{"value":"safe"}' },
    });
    fireEvent.change(screen.getAllByLabelText("Modified JSON")[0]!, {
      target: { value: '{"value":"<script>alert(1)</script>"}' },
    });
    await user.click(screen.getByRole("button", { name: "Compare" }));
    expect(screen.getAllByTestId("json-diff-output")[0]).toHaveTextContent(
      "<script>alert(1)</script>",
    );
    expect(
      document.querySelector('script:not([type="application/ld+json"])'),
    ).toBeNull();
    expect(
      document.querySelector('script[type="application/ld+json"]'),
    ).not.toHaveTextContent("alert(1)");
  });
});
