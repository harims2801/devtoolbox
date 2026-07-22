import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CodeTextarea } from "@/components/tools/code-textarea";

describe("CodeTextarea", () => {
  it("provides an accessible label and error association", async () => {
    const user = userEvent.setup();

    render(<CodeTextarea error="Invalid JSON" label="JSON input" />);
    const textarea = screen.getByRole("textbox", { name: "JSON input" });

    await user.type(textarea, "invalid");

    expect(textarea).toHaveValue("invalid");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid JSON");
  });
});
