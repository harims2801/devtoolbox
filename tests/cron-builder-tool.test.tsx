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

  it("preserves every visual field across sequential edits", () => {
    render(<CronBuilderTool />);
    fireEvent.click(screen.getAllByRole("button", { name: "Reset" })[0]!);

    fireEvent.change(screen.getAllByLabelText("Builder Minute")[0]!, {
      target: { value: "5" },
    });
    fireEvent.change(screen.getAllByLabelText("Builder Hour")[0]!, {
      target: { value: "2" },
    });
    fireEvent.change(screen.getAllByLabelText("Builder Day of month")[0]!, {
      target: { value: "10" },
    });
    expect(
      screen.getAllByLabelText("Standard Unix cron expression")[0],
    ).toHaveValue("5 2 10 * *");
    expect(screen.getAllByLabelText("Builder Minute")[0]).toHaveValue("5");
    expect(screen.getAllByLabelText("Builder Hour")[0]).toHaveValue("2");
  });

  it("retains other visual values while a field is invalid and corrected", () => {
    render(<CronBuilderTool />);
    fireEvent.click(screen.getAllByRole("button", { name: "Reset" })[0]!);
    const minute = screen.getAllByLabelText("Builder Minute")[0]!;
    const hour = screen.getAllByLabelText("Builder Hour")[0]!;

    fireEvent.change(minute, { target: { value: "5" } });
    fireEvent.change(hour, { target: { value: "44" } });
    expect(
      screen.getAllByLabelText("Standard Unix cron expression")[0],
    ).toHaveValue("5 44 * * *");
    expect(minute).toHaveValue("5");
    expect(hour).toHaveValue("44");

    fireEvent.change(hour, { target: { value: "2" } });
    expect(
      screen.getAllByLabelText("Standard Unix cron expression")[0],
    ).toHaveValue("5 2 * * *");
    expect(minute).toHaveValue("5");
  });
});
