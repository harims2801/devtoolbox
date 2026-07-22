import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { describe, expect, it } from "vitest";

import { MobileNav } from "@/components/layout/mobile-nav";

describe("MobileNav", () => {
  it("opens an accessible navigation dialog", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider attribute="class">
        <MobileNav />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(
      screen.getByRole("dialog", { name: "Navigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Tool categories" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Color theme")).toBeInTheDocument();
  });
});
