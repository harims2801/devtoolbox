import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DateDifferenceTool } from "@/components/tools/date-difference-tool";

describe("DateDifferenceTool", () => {
  it("shows elapsed and calendar results across DST", async () => {
    const user = userEvent.setup();
    render(<DateDifferenceTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    const output = screen.getAllByTestId("date-difference-output")[0]!;
    expect(output).toHaveTextContent("23");
    expect(output).toHaveTextContent("0 years, 0 months, 1 days");
    expect(output).toHaveTextContent("A DST day can be 23 or 25 hours");
  });

  it("supports date-only inclusive ranges and swapping", async () => {
    const user = userEvent.setup();
    render(<DateDifferenceTool />);
    await user.click(screen.getAllByLabelText("Date-only inputs")[0]!);
    fireEvent.change(screen.getAllByLabelText("Start date")[0]!, {
      target: { value: "2024-02-28" },
    });
    fireEvent.change(screen.getAllByLabelText("End date")[0]!, {
      target: { value: "2024-03-01" },
    });
    await user.click(
      screen.getAllByLabelText("Include both boundary dates")[0]!,
    );
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    expect(
      screen.getAllByTestId("date-difference-output")[0],
    ).toHaveTextContent("Inclusive calendar span: 3 days");
    await user.click(screen.getByRole("button", { name: "Swap" }));
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    expect(
      screen.getAllByTestId("date-difference-output")[0],
    ).toHaveTextContent("Inclusive calendar span: -3 days");
  });

  it("reports invalid input without stale output", async () => {
    const user = userEvent.setup();
    render(<DateDifferenceTool />);
    fireEvent.change(screen.getAllByLabelText("Start date and time")[0]!, {
      target: { value: "2024-03-10T02:30" },
    });
    fireEvent.change(screen.getAllByLabelText("Start time zone")[0]!, {
      target: { value: "America/New_York" },
    });
    fireEvent.change(screen.getAllByLabelText("End date and time")[0]!, {
      target: { value: "2024-03-11T02:30" },
    });
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("does not exist");
  });
});
