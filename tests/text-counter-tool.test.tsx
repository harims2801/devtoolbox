import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TextCounterTool } from "@/components/tools/text-counter-tool";

describe("TextCounterTool", () => {
  it("updates Unicode, whitespace, byte, and reading metrics", async () => {
    const user = userEvent.setup();
    render(<TextCounterTool />);
    fireEvent.change(screen.getAllByLabelText("Text to measure")[0]!, {
      target: { value: "👨‍👩‍👧‍👦 hello\tworld\n" },
    });
    const output = await screen.findAllByTestId("text-counter-output");
    expect(output[0]).toHaveTextContent("UTF-16 code units");
    expect(output[0]).toHaveTextContent("Grapheme clusters");
    expect(output[0]).toHaveTextContent("UTF-8 bytes");
    expect(output[0]).toHaveTextContent("Tabs1");
    expect(
      screen.getAllByRole("button", { name: "Copy summary" })[0],
    ).toBeEnabled();
    await user.clear(screen.getAllByLabelText("Words per minute")[0]!);
    await user.type(screen.getAllByLabelText("Words per minute")[0]!, "100");
    expect(screen.getAllByTestId("text-counter-output")[0]).toHaveTextContent(
      "Reading time",
    );
  });

  it("resets text and reading speed", async () => {
    const user = userEvent.setup();
    render(<TextCounterTool />);
    fireEvent.change(screen.getAllByLabelText("Text to measure")[0]!, {
      target: { value: "some words" },
    });
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getAllByLabelText("Text to measure")[0]).toHaveValue("");
    expect(screen.getAllByLabelText("Words per minute")[0]).toHaveValue(200);
  });
});
