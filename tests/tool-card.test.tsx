import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ToolCard } from "@/components/tools/tool-card";
import { getCategoryById, getToolById } from "@/config/tool-registry";

describe("ToolCard", () => {
  const tool = getToolById("case-converter");
  const category = tool ? getCategoryById(tool.category) : undefined;

  it("makes the full card a single accessible navigation target", () => {
    expect(tool).toBeDefined();
    expect(category).toBeDefined();

    render(<ToolCard categoryName={category!.name} tool={tool!} />);

    const card = screen.getByRole("article");
    const link = screen.getByRole("link", { name: `Open ${tool!.name}` });

    expect(card).toContainElement(link);
    expect(link).toHaveAttribute("href", tool!.route);
    expect(link).toHaveClass("absolute", "inset-0");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 3, name: tool!.name }),
    ).toBeInTheDocument();
  });

  it("keeps the favorite control independent from card navigation", async () => {
    expect(tool).toBeDefined();
    expect(category).toBeDefined();
    const user = userEvent.setup();

    render(<ToolCard categoryName={category!.name} tool={tool!} />);

    const link = screen.getByRole("link", { name: `Open ${tool!.name}` });
    const favorite = screen.getByRole("button", {
      name: `Add ${tool!.name} to favorites`,
    });

    expect(favorite.closest("a")).toBeNull();
    expect(link).not.toContainElement(favorite);

    await user.click(favorite);

    expect(favorite).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("article")).toBeInTheDocument();
  });
});
