import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LoremIpsumTool } from "@/components/tools/lorem-ipsum-tool";
describe("LoremIpsumTool", () => {
  it("generates seeded output with live counts", async () => {
    const user = userEvent.setup();
    render(<LoremIpsumTool />);
    await user.selectOptions(
      screen.getAllByLabelText("Generation unit")[0]!,
      "words",
    );
    fireEvent.change(screen.getAllByLabelText("Generation count")[0]!, {
      target: { value: "8" },
    });
    fireEvent.change(screen.getAllByLabelText("Deterministic seed")[0]!, {
      target: { value: "fixture" },
    });
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(screen.getAllByTestId("lorem-stats")[0]).toHaveTextContent(
      "8 words",
    );
    expect(screen.getAllByTestId("lorem-output")[0]).toHaveTextContent(
      /^lorem ipsum/,
    );
  });
  it("shows validation errors and resets", async () => {
    const user = userEvent.setup();
    render(<LoremIpsumTool />);
    fireEvent.change(screen.getAllByLabelText("Generation count")[0]!, {
      target: { value: "0" },
    });
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("whole number");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getAllByLabelText("Generation count")[0]).toHaveValue(3);
  });
});
