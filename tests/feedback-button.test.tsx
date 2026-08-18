import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { getToolById } from "@/config/tool-registry";
describe("FeedbackButton", () => {
  it("shows exact metadata and excludes tool data", async () => {
    render(<FeedbackButton tool={getToolById("json-formatter-validator")!} />);
    await userEvent.click(screen.getByRole("button", { name: "Feedback" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Tool: JSON Formatter and Validator",
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Tool input and output are never included",
    );
    expect(
      screen.getByRole("button", { name: "Submit feedback" }),
    ).toBeDisabled();
  });
});
