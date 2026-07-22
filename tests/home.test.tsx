import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("Home", () => {
  it("introduces the product and primary action", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /useful developer tools without sending your data away/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /explore tools/i }),
    ).toHaveAttribute("href", "/tools");
  });
});
