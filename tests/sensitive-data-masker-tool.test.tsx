import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SensitiveDataMaskerTool } from "@/components/tools/sensitive-data-masker-tool";
describe("SensitiveDataMaskerTool", () => {
  it("shows category counts without summary values", () => {
    render(<SensitiveDataMaskerTool />);
    expect(screen.getAllByTestId("detection-preview")[0]).toHaveTextContent(
      "ada@example.com",
    );
    expect(
      screen.getByText(
        "Full detected values are intentionally omitted from this summary.",
      ),
    ).toBeVisible();
  });
  it("produces sanitized output", async () => {
    render(<SensitiveDataMaskerTool />);
    await userEvent.click(
      screen.getByRole("button", { name: /Mask \d+ detections/ }),
    );
    const output = (await screen.findAllByTestId("masked-output"))[0]!;
    expect(output).toHaveTextContent("[MASKED:email]");
    expect(output).not.toHaveTextContent("ada@example.com");
  });
});
