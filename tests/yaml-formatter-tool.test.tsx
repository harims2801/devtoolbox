import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { YamlFormatterTool } from "@/components/tools/yaml-formatter-tool";

describe("YamlFormatterTool", () => {
  it("loads an example, validates it, and shows multiple documents", async () => {
    const user = userEvent.setup();
    render(<YamlFormatterTool />);

    await user.click(screen.getByRole("button", { name: "Load example" }));
    await user.click(screen.getByRole("button", { name: "Format & Validate" }));

    expect(screen.getAllByTestId("yaml-output")[0]).toHaveTextContent(
      "payments-api",
    );
    expect(screen.getAllByText("Documents")[0]).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Tree" })[0]!);
    expect(screen.getAllByTestId("yaml-tree")[0]).toBeInTheDocument();
  });

  it("converts JSON to YAML and reports unsafe input", async () => {
    const user = userEvent.setup();
    render(<YamlFormatterTool />);
    const input = screen.getAllByLabelText("YAML or JSON input")[0]!;

    fireEvent.change(input, { target: { value: '{"enabled":true}' } });
    await user.selectOptions(screen.getByLabelText("Input format"), "json");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getAllByTestId("yaml-output")[0]).toHaveTextContent(
      "enabled: true",
    );

    fireEvent.change(input, {
      target: { value: "handler: !!js/function 'alert(1)'" },
    });
    await user.selectOptions(screen.getByLabelText("Input format"), "yaml");
    await user.click(screen.getByRole("button", { name: "Format & Validate" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      /tags are not allowed/i,
    );
  });
});
