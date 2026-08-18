import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CidrCalculatorTool } from "@/components/tools/cidr-calculator-tool";
describe("CidrCalculatorTool", () => {
  it("renders IPv4 and IPv6 calculations", () => {
    render(<CidrCalculatorTool />);
    expect(screen.getAllByText("192.168.10.0")[0]).toBeVisible();
    expect(screen.getAllByText(/2001:0db8/)[0]).toBeVisible();
    expect(screen.getAllByText(/no IPv4-style broadcast/)[0]).toBeVisible();
  });
});
