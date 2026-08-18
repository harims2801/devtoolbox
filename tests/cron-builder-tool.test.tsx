import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CronBuilderTool } from "@/components/tools/cron-builder-tool";

describe("CronBuilderTool", () => {
  it("validates and explains a weekday schedule", async () => {
    const user = userEvent.setup();
    render(<CronBuilderTool />);
    await user.click(
      screen.getByRole("button", { name: "Validate and explain" }),
    );
    expect(screen.getAllByTestId("cron-output")[0]).toHaveTextContent(
      "Monday through Friday",
    );
    expect(screen.getAllByTestId("next-runs")[0]?.children).toHaveLength(10);
  });

  it("reports invalid input", async () => {
    const user = userEvent.setup();
    render(<CronBuilderTool />);
    fireEvent.change(
      screen.getAllByLabelText("Standard Unix cron expression")[0]!,
      { target: { value: "90 * * * *" } },
    );
    await user.click(
      screen.getByRole("button", { name: "Validate and explain" }),
    );
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      /between 0 and 59/i,
    );
  });

  it("keeps a simple visual field synchronized", () => {
    render(<CronBuilderTool />);
    fireEvent.click(screen.getAllByRole("button", { name: /^Daily$/ })[0]!);
    fireEvent.change(screen.getAllByLabelText("Builder Minute")[0]!, {
      target: { value: "30" },
    });
    expect(
      screen.getAllByLabelText("Standard Unix cron expression")[0],
    ).toHaveValue("30 0 * * *");
  });
});
