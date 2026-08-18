import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DiffCheckerTool } from "@/components/tools/diff-checker-tool";
describe("DiffCheckerTool", () => {
  it("shows text statistics", () => {
    render(<DiffCheckerTool />);
    expect(screen.getAllByTestId("text-diff-output")[0]).toHaveTextContent(
      "Changed 2",
    );
  });
  it("switches to semantic JSON", async () => {
    render(<DiffCheckerTool />);
    await userEvent.click(
      screen.getByRole("button", { name: "JSON semantic" }),
    );
    expect(screen.getAllByTestId("json-diff-output")[0]).toHaveTextContent(
      "user.active",
    );
  });
});
