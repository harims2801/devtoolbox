import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EnvironmentParserTool } from "@/components/tools/environment-parser-tool";
describe("EnvironmentParserTool", () => {
  it("masks secrets by default", () => {
    render(<EnvironmentParserTool />);
    expect(screen.getAllByTestId("environment-output")[0]).toHaveTextContent(
      "••••••••",
    );
    expect(
      screen.getAllByTestId("environment-output")[0],
    ).not.toHaveTextContent("demo-token");
  });
  it("can reveal values", async () => {
    render(<EnvironmentParserTool />);
    await userEvent.click(
      screen.getByRole("button", { name: "Show sensitive" }),
    );
    expect(screen.getAllByTestId("environment-output")[0]).toHaveTextContent(
      "demo-token",
    );
  });
});
