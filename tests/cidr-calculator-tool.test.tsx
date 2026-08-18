import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CidrCalculatorTool } from "@/components/tools/cidr-calculator-tool";
describe("CidrCalculatorTool", () => {
  it("renders IPv4 and IPv6 calculations", () => {
    render(<CidrCalculatorTool />);
    expect(screen.getAllByText("192.168.10.0")[0]).toBeVisible();
    expect(screen.getAllByText(/2001:0db8/)[0]).toBeVisible();
    expect(screen.getAllByText(/no IPv4-style broadcast/)[0]).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: "Copy network" })[0],
    ).toBeEnabled();
    expect(
      screen.getAllByRole("button", { name: "Export CSV" })[0],
    ).toBeEnabled();
  });
  it("fully resets controls and hides invalid exports", async () => {
    const user = userEvent.setup();
    render(<CidrCalculatorTool />);
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getAllByLabelText("IPv4 address with prefix")[0]).toHaveValue(
      "",
    );
    expect(screen.getAllByLabelText("Contains IP")[0]).toHaveValue("");
    expect(screen.getAllByLabelText("Overlap CIDR")[0]).toHaveValue("");
    expect(screen.getAllByLabelText("Subnet mask to CIDR")[0]).toHaveValue("");
    expect(screen.getAllByLabelText("IPv6 address")[0]).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: "Export CSV" }),
    ).not.toBeInTheDocument();
  });
  it("exposes accessible errors for invalid IPv4 and IPv6", () => {
    render(<CidrCalculatorTool />);
    fireEvent.change(screen.getAllByLabelText("IPv4 address with prefix")[0]!, {
      target: { value: "999.1.1.1/24" },
    });
    fireEvent.change(screen.getAllByLabelText("IPv6 address")[0]!, {
      target: { value: "1::2::3" },
    });
    expect(
      screen.getAllByRole("alert").map((alert) => alert.textContent),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("valid IPv4"),
        expect.stringContaining("valid IPv6"),
      ]),
    );
  });
});
