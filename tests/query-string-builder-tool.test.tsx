import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueryStringBuilderTool } from "@/components/tools/query-string-builder-tool";

describe("QueryStringBuilderTool", () => {
  it("loads duplicate example rows, excludes and reorders without data loss", async () => {
    const user = userEvent.setup();
    render(<QueryStringBuilderTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    expect(screen.getAllByLabelText("Key 1")[0]).toHaveValue("tag");
    expect(screen.getAllByLabelText("Key 2")[0]).toHaveValue("tag");
    await user.click(screen.getAllByLabelText("Include row 1")[0]!);
    expect(screen.getAllByText(/tag=&flag/)[0]).toBeVisible();
    await user.click(screen.getAllByLabelText("Move row 2 up")[0]!);
    expect(screen.getAllByLabelText("Key 1")[0]).toHaveValue("tag");
  });

  it("imports duplicate-safe JSON and generates a full URL without fetching", async () => {
    const user = userEvent.setup(),
      fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<QueryStringBuilderTool />);
    fetchSpy.mockClear();
    fireEvent.change(screen.getAllByLabelText("Bulk JSON pairs")[0]!, {
      target: { value: '[["q","a b"],["q","+"]]' },
    });
    await user.click(
      screen.getAllByRole("button", { name: "Load rows from JSON" })[0]!,
    );
    fireEvent.change(
      screen.getAllByLabelText(/Base URL for Copy full URL/)[0]!,
      { target: { value: "https://example.com/search" } },
    );
    expect(
      screen.getAllByText("https://example.com/search?q=a%20b&q=%2B")[0],
    ).toBeVisible();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports malformed encoding and safely renders suspicious values", async () => {
    const user = userEvent.setup();
    render(<QueryStringBuilderTool />);
    fireEvent.change(screen.getAllByLabelText("Query string")[0]!, {
      target: { value: "bad=%E0%A4%A" },
    });
    await user.click(
      screen.getAllByRole("button", { name: "Parse into rows" })[0]!,
    );
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "malformed percent",
    );
    fireEvent.change(screen.getAllByLabelText("Bulk JSON pairs")[0]!, {
      target: { value: '[["x","<img src=x onerror=alert(1)>"]]' },
    });
    await user.click(
      screen.getAllByRole("button", { name: "Load rows from JSON" })[0]!,
    );
    expect(document.querySelector("img")).toBeNull();
  });
});
