import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TextSorterTool } from "@/components/tools/text-sorter-tool";

describe("TextSorterTool", () => {
  it("sorts a sample without mutating the input", async () => {
    const user = userEvent.setup();
    render(<TextSorterTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    const input = screen.getAllByLabelText(
      "Lines to sort",
    )[0] as HTMLTextAreaElement;
    const original = input.value;
    await user.click(screen.getByRole("button", { name: "Sort" }));
    expect(input.value).toBe(original);
    const output = screen.getAllByTestId("text-sort-output")[0]!;
    expect(output).toHaveTextContent("Input lines: 6");
    expect(output).toHaveTextContent("item2");
    expect(screen.getAllByRole("button", { name: "Copy" })[0]).toBeEnabled();
    expect(
      screen.getAllByRole("button", { name: "Download" })[0],
    ).toBeEnabled();
  });

  it("reports duplicate and empty-line removals", async () => {
    const user = userEvent.setup();
    render(<TextSorterTool />);
    fireEvent.change(screen.getAllByLabelText("Lines to sort")[0]!, {
      target: { value: "pear\n\npear\napple" },
    });
    await user.selectOptions(
      screen.getAllByLabelText("Empty lines")[0]!,
      "remove",
    );
    await user.click(screen.getAllByLabelText("Remove duplicates")[0]!);
    await user.click(screen.getByRole("button", { name: "Sort" }));
    const output = screen.getAllByTestId("text-sort-output")[0]!;
    expect(output).toHaveTextContent("Output lines: 2");
    expect(output).toHaveTextContent("Duplicates removed: 1");
    expect(output).toHaveTextContent("Empty lines removed: 1");
  });
});
