import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { JsonFormatterTool } from "@/components/tools/json-formatter-tool";

describe("JsonFormatterTool", () => {
  it("loads, formats, inspects, and clears example JSON", async () => {
    const user = userEvent.setup();
    render(<JsonFormatterTool />);

    await user.click(screen.getByRole("button", { name: "Load example" }));
    await user.click(screen.getByRole("button", { name: "Format" }));

    expect(screen.getAllByTestId("json-output")[0]).toHaveTextContent(
      '"service": "payments-api"',
    );
    expect(screen.getAllByText("Objects")[0]).toBeInTheDocument();
    expect(screen.getAllByText("2")[0]).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Tree" })[0]!);
    expect(screen.getAllByText("Object(6)")[0]).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getAllByLabelText("JSON input")[0]).toHaveValue("");
  });

  it("shows a useful parsing error without executing input", async () => {
    const user = userEvent.setup();
    render(<JsonFormatterTool />);
    const input = screen.getAllByLabelText("JSON input")[0]!;

    fireEvent.change(input, {
      target: { value: '{"content":"<script>alert(1)</script>",}' },
    });
    await user.click(screen.getByRole("button", { name: "Format" }));

    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      /line \d+, column \d+/,
    );
    expect(screen.queryByTestId("json-output")).toBeNull();
  });
});
