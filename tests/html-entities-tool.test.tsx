import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HtmlEntitiesTool } from "@/components/tools/html-entities-tool";

describe("HtmlEntitiesTool", () => {
  it("encodes text, swaps, and decodes it", async () => {
    const user = userEvent.setup();
    render(<HtmlEntitiesTool />);
    fireEvent.change(screen.getAllByLabelText("Text to encode")[0]!, {
      target: { value: '<strong title="R&D">safe</strong>' },
    });
    await user.click(screen.getByRole("button", { name: "Encode text" }));
    expect(screen.getAllByTestId("entity-output")[0]).toHaveTextContent(
      "&lt;strong",
    );
    await user.click(screen.getByRole("button", { name: "Swap" }));
    await user.click(screen.getByRole("button", { name: "Decode entities" }));
    expect(screen.getAllByTestId("entity-output")[0]).toHaveTextContent(
      '<strong title="R&D">safe</strong>',
    );
  });
  it("renders decoded script and SVG payloads inertly", async () => {
    const user = userEvent.setup();
    render(<HtmlEntitiesTool />);
    await user.click(screen.getByRole("button", { name: "Decode" }));
    fireEvent.change(screen.getAllByLabelText("Entities to decode")[0]!, {
      target: {
        value:
          "&lt;script&gt;alert(1)&lt;/script&gt;&lt;svg onload=alert(2)&gt;",
      },
    });
    await user.click(screen.getByRole("button", { name: "Decode entities" }));
    expect(screen.getAllByTestId("entity-output")[0]).toHaveTextContent(
      "<script>alert(1)</script>",
    );
    expect(
      document.querySelector("script:not([type='application/ld+json'])"),
    ).toBeNull();
    expect(document.querySelector("svg[onload]")).toBeNull();
  });
  it("encodes emoji as one hexadecimal code point and resets", async () => {
    const user = userEvent.setup();
    render(<HtmlEntitiesTool />);
    await user.selectOptions(
      screen.getByLabelText("Entity format"),
      "hexadecimal",
    );
    await user.click(screen.getByLabelText("Encode non-ASCII"));
    fireEvent.change(screen.getAllByLabelText("Text to encode")[0]!, {
      target: { value: "🚀" },
    });
    await user.click(screen.getByRole("button", { name: "Encode text" }));
    expect(screen.getAllByTestId("entity-output")[0]).toHaveTextContent(
      "&#x1F680;",
    );
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getAllByLabelText("Text to encode")[0]).toHaveValue("");
  });
});
