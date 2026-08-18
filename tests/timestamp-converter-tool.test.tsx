import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TimestampConverterTool } from "@/components/tools/timestamp-converter-tool";

describe("TimestampConverterTool", () => {
  it("converts Unix seconds and displays every output format", async () => {
    const user = userEvent.setup();
    render(<TimestampConverterTool />);
    fireEvent.change(screen.getAllByLabelText("Unix timestamp")[0]!, {
      target: { value: "0" },
    });
    await user.selectOptions(
      screen.getAllByLabelText("Timestamp unit")[0]!,
      "seconds",
    );
    await user.click(screen.getByRole("button", { name: "Convert" }));

    const output = screen.getAllByTestId("timestamp-output")[0]!;
    expect(output).toHaveTextContent("1970-01-01T00:00:00.000Z");
    expect(output).toHaveTextContent("Unix milliseconds");
    expect(output).toHaveTextContent("RFC 2822");
  });

  it("converts a zoned date to timestamp and reports DST gaps", async () => {
    const user = userEvent.setup();
    render(<TimestampConverterTool />);
    await user.click(screen.getByRole("button", { name: "Date to timestamp" }));
    await user.selectOptions(
      screen.getAllByLabelText("Preview time zone")[0]!,
      "America/New_York",
    );
    fireEvent.change(
      screen.getAllByLabelText("Date and time in selected zone")[0]!,
      { target: { value: "2024-03-10T02:30:00" } },
    );
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      /does not exist/i,
    );
  });

  it("loads the epoch example and can pause the live clock", async () => {
    const user = userEvent.setup();
    render(<TimestampConverterTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    expect(screen.getAllByLabelText("Unix timestamp")[0]).toHaveValue("0");
    await user.click(screen.getAllByRole("button", { name: "Pause" })[0]!);
    expect(screen.getAllByRole("button", { name: "Resume" })[0]).toBeVisible();
  });
});
