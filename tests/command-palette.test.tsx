import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommandPaletteProvider } from "@/components/search/command-palette";
import { SearchButton } from "@/components/shared/search-button";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("CommandPalette", () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
  });

  it("opens with Ctrl+K, searches registry metadata, and closes with Escape", async () => {
    const user = userEvent.setup();
    render(
      <CommandPaletteProvider>
        <SearchButton />
      </CommandPaletteProvider>,
    );

    await user.keyboard("{Control>}k{/Control}");
    const dialog = screen.getByRole("dialog", { name: "Search tools" });
    expect(dialog).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Search tools, descriptions, or keywords..."),
      "oauth",
    );

    expect(
      screen.getByRole("heading", { name: "Encoding & Decoding" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /JWT Decoder and Inspector/ }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Search tools" }),
    ).not.toBeInTheDocument();
  });

  it("opens the keyboard-selected tool and records it as recent", async () => {
    const user = userEvent.setup();
    render(
      <CommandPaletteProvider>
        <SearchButton />
      </CommandPaletteProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Search tools" }));
    await user.type(
      screen.getByPlaceholderText("Search tools, descriptions, or keywords..."),
      "json formatter",
    );
    await user.keyboard("{Enter}");

    expect(push).toHaveBeenCalledWith("/tools/json-formatter");
  });
});
