import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { IsoDateFormatterTool } from "@/components/tools/iso-date-formatter-tool";

describe("IsoDateFormatterTool", () => {
  it("shows normalized, preserved, Unix, and component values", async () => {
    const user = userEvent.setup();
    render(<IsoDateFormatterTool />);
    fireEvent.change(screen.getAllByLabelText("ISO 8601 value")[0]!, {
      target: { value: "2024-02-29T23:45:12.123456+05:30" },
    });
    await user.click(screen.getByRole("button", { name: "Parse" }));
    const output = screen.getAllByTestId("iso-date-output")[0]!;
    expect(output).toHaveTextContent("2024-02-29T18:15:12.123456Z");
    expect(output).toHaveTextContent("2024-02-29T23:45:12.123456+05:30");
    expect(output).toHaveTextContent("1709230512123");
    expect(output).toHaveTextContent("6 fractional digits preserved");
    expect(
      screen.getAllByRole("button", { name: "Copy Normalized UTC" })[0],
    ).toBeEnabled();
  });

  it("flags a date-only value without inventing an instant", async () => {
    const user = userEvent.setup();
    render(<IsoDateFormatterTool />);
    fireEvent.change(screen.getAllByLabelText("ISO 8601 value")[0]!, {
      target: { value: "2024-02-29" },
    });
    await user.click(screen.getByRole("button", { name: "Parse" }));
    const output = screen.getAllByTestId("iso-date-output")[0]!;
    expect(output).toHaveTextContent("Calendar date");
    expect(output).toHaveTextContent("Unix and relative values do not apply");
    expect(output).not.toHaveTextContent("Unix seconds");
  });

  it("rejects a missing zone and clears stale results", async () => {
    const user = userEvent.setup();
    render(<IsoDateFormatterTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    await user.click(screen.getByRole("button", { name: "Parse" }));
    expect(screen.getAllByTestId("iso-date-output")[0]).toBeInTheDocument();
    fireEvent.change(screen.getAllByLabelText("ISO 8601 value")[0]!, {
      target: { value: "2024-01-01T12:00:00" },
    });
    await user.click(screen.getByRole("button", { name: "Parse" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("ambiguous");
    expect(screen.queryByTestId("iso-date-output")).not.toBeInTheDocument();
  });
});
