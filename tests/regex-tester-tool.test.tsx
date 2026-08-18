import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RegexTesterTool } from "@/components/tools/regex-tester-tool";

describe("RegexTesterTool", () => {
  it("shows matches and replacement", () => {
    render(<RegexTesterTool />);
    expect(screen.getAllByTestId("regex-output")[0]).toHaveTextContent("API");
    expect(screen.getAllByTestId("regex-output")[0]).toHaveTextContent("[API]");
  });
  it("validates patterns in real time", () => {
    render(<RegexTesterTool />);
    fireEvent.change(screen.getAllByLabelText("Regular expression")[0]!, {
      target: { value: "[" },
    });
    expect(screen.getAllByText(/Invalid regular expression/i)[0]).toBeVisible();
  });
});
