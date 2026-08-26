import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UserAgentParserTool } from "@/components/tools/user-agent-parser-tool";

describe("UserAgentParserTool", () => {
  it("parses an example, switches views, and safely renders input", async () => {
    const user = userEvent.setup();
    render(<UserAgentParserTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    expect(screen.getAllByText(/Mobile Safari 17.5/)[0]).toBeVisible();
    expect(screen.getAllByText(/Best-effort only/)[0]).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Raw" }));
    expect(screen.getAllByText(/CPU iPhone OS 17_5/)[0]).toBeVisible();

    fireEvent.change(screen.getAllByLabelText("User-Agent string")[0]!, {
      target: { value: '<img src=x onerror="alert(1)">' },
    });
    expect(document.querySelector("img")).toBeNull();
  });

  it("reads navigator.userAgent only after a deliberate click", async () => {
    const user = userEvent.setup();
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(
      "curl/8.7.1",
    );
    render(<UserAgentParserTool />);
    expect(screen.queryByText("curl 8.7.1")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use my browser" }));
    expect(screen.getAllByText("curl 8.7.1")[0]).toBeVisible();
  });

  it("resets all user-controlled state", async () => {
    const user = userEvent.setup();
    render(<UserAgentParserTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    await user.click(screen.getByRole("tab", { name: "Raw" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getAllByLabelText("User-Agent string")[0]).toHaveValue("");
    expect(screen.queryByTestId("user-agent-report")).not.toBeInTheDocument();
  });
});
