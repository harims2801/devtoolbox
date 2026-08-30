import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { NumberBaseConverterTool } from "@/components/tools/number-base-converter-tool";

describe("NumberBaseConverterTool", () => {
  it("converts every input mode and resets all fields", async () => {
    const user = userEvent.setup();
    render(<NumberBaseConverterTool />);

    const input = screen.getAllByLabelText("Values to convert")[0]!;
    const format = screen.getAllByLabelText("Input format")[0]!;

    await user.type(input, "48 69");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getAllByTestId("ascii-output")[0]).toHaveTextContent("Hi");

    await user.selectOptions(format, "ascii");
    await user.clear(input);
    await user.type(input, "AZ");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getAllByTestId("decimal-output")[0]).toHaveTextContent(
      "65 90",
    );

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(input).toHaveValue("");
    expect(format).toHaveValue("hexadecimal");
  });

  it("shows precise validation and clears stale output", async () => {
    const user = userEvent.setup();
    render(<NumberBaseConverterTool />);

    const input = screen.getAllByLabelText("Values to convert")[0]!;
    await user.type(input, "GG");
    await user.click(screen.getByRole("button", { name: "Convert" }));

    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "not valid hexadecimal",
    );
    expect(screen.queryAllByTestId("number-base-results")).toHaveLength(0);
  });
});
