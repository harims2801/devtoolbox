import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HttpStatusReferenceTool } from "@/components/tools/http-status-reference-tool";

describe("HttpStatusReferenceTool", () => {
  it("searches and selects with accessible keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<HttpStatusReferenceTool />);
    const search = screen.getAllByRole("combobox", {
      name: "Search status codes",
    })[0]!;
    expect(search).toHaveAttribute("aria-controls", "http-status-results");
    await user.type(search, "gateway");
    await user.keyboard("{ArrowDown}{Enter}");
    const output = screen.getAllByTestId("http-status-output")[0]!;
    expect(output).toHaveTextContent(/50[24]/);
    expect(
      screen.getAllByRole("listbox", { name: "HTTP status search results" })[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Copy entry" })[0],
    ).toBeEnabled();
  });

  it("filters non-standard codes and shows unknown codes", async () => {
    const user = userEvent.setup();
    render(<HttpStatusReferenceTool />);
    await user.click(screen.getAllByLabelText("non-standard")[0]!);
    expect(
      screen
        .getAllByRole("option")
        .some((option) => option.textContent?.includes("499")),
    ).toBe(true);
    const search = screen.getAllByRole("combobox", {
      name: "Search status codes",
    })[0]!;
    await user.clear(search);
    await user.type(search, "599");
    expect(screen.getAllByTestId("http-status-output")[0]).toHaveTextContent(
      "599 Unassigned or unknown",
    );
  });

  it("operates offline and reset does not change the URL", async () => {
    const user = userEvent.setup(),
      fetchSpy = vi.spyOn(globalThis, "fetch");
    history.replaceState(null, "", "/tools/http-status-codes");
    render(<HttpStatusReferenceTool />);
    fetchSpy.mockClear();
    const search = screen.getAllByRole("combobox", {
      name: "Search status codes",
    })[0]!;
    fireEvent.change(search, { target: { value: "authentication" } });
    expect(location.search).toBe("");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(search).toHaveValue("");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
