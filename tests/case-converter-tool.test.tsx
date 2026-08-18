import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CaseConverterTool } from "@/components/tools/case-converter-tool";

describe("CaseConverterTool", () => {
  it("shows every conversion and supports selecting a primary result", async () => {
    const user = userEvent.setup();
    render(<CaseConverterTool />);
    fireEvent.change(screen.getAllByLabelText("Text to convert")[0]!, {
      target: { value: "XMLHttpRequest v2" },
    });
    const output = screen.getAllByTestId("case-converter-output")[0]!;
    expect(output).toHaveTextContent("xmlHttpRequestV2");
    expect(output).toHaveTextContent("XML_HTTP_REQUEST_V_2");
    expect(output).toHaveTextContent("Xml Http Request V 2");
    expect(
      screen.getAllByRole("button", { name: "Copy snake_case" })[0],
    ).toBeEnabled();
    await user.click(screen.getAllByLabelText("Use snake_case as primary")[0]!);
    expect(
      screen.getAllByLabelText("Use snake_case as primary")[0],
    ).toBeChecked();
  });

  it("resets input and output", async () => {
    const user = userEvent.setup();
    render(<CaseConverterTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    expect(
      screen.getAllByTestId("case-converter-output")[0],
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(
      screen.queryByTestId("case-converter-output"),
    ).not.toBeInTheDocument();
  });
});
