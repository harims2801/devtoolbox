import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("supports keyboard activation", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Run tool</Button>);
    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Run tool" })).toHaveFocus();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
