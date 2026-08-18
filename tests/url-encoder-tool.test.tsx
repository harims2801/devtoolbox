import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { UrlEncoderTool } from "@/components/tools/url-encoder-tool";

describe("UrlEncoderTool", () => {
  it("encodes, swaps, and decodes a component", async () => {
    const user = userEvent.setup();
    render(<UrlEncoderTool />);
    fireEvent.change(screen.getAllByLabelText("Value to encode")[0]!, {
      target: { value: "hello world/தமிழ்" },
    });
    await user.click(screen.getByRole("button", { name: "Encode value" }));
    expect(screen.getAllByTestId("url-output")[0]).toHaveTextContent(
      "hello%20world%2F",
    );
    await user.click(screen.getByRole("button", { name: "Swap" }));
    await user.click(screen.getByRole("button", { name: "Decode value" }));
    expect(screen.getAllByTestId("url-output")[0]).toHaveTextContent(
      "hello world/தமிழ்",
    );
  });

  it("reports malformed input without replacing it", async () => {
    const user = userEvent.setup();
    render(<UrlEncoderTool />);
    await user.click(screen.getByRole("button", { name: "Decode" }));
    fireEvent.change(screen.getAllByLabelText("Value to decode")[0]!, {
      target: { value: "broken%2" },
    });
    await user.click(screen.getByRole("button", { name: "Decode value" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("character 7");
    expect(screen.getAllByLabelText("Value to decode")[0]).toHaveValue(
      "broken%2",
    );
  });

  it("preserves full URL structure and resets the workspace", async () => {
    const user = userEvent.setup();
    render(<UrlEncoderTool />);
    await user.selectOptions(
      screen.getByLabelText("Encoding scope"),
      "full-url",
    );
    fireEvent.change(screen.getAllByLabelText("Value to encode")[0]!, {
      target: { value: "https://example.com/a b?q=x y#z z" },
    });
    await user.click(screen.getByRole("button", { name: "Encode value" }));
    expect(screen.getAllByTestId("url-output")[0]).toHaveTextContent(
      "https://example.com/a%20b?q=x%20y#z%20z",
    );
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getAllByLabelText("Value to encode")[0]).toHaveValue("");
  });
});
