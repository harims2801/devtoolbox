import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LogAnalyzerTool } from "@/components/tools/log-analyzer-tool";
describe("LogAnalyzerTool", () => {
  it("renders counts and malformed-line feedback", () => {
    render(<LogAnalyzerTool />);
    expect(screen.getAllByText(/1 skipped/)[0]).toBeVisible();
    expect(screen.getAllByText(/Errors/)[0]).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: /Sensitive Data Masker/ })[0],
    ).toHaveAttribute("href", "/tools/sensitive-data-masker");
  });
});
