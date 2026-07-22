import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";

describe("Breadcrumbs", () => {
  it("marks the final item as the current page", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Tools", href: "/tools" },
          { label: "JSON Formatter" },
        ]}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeInTheDocument();
    expect(screen.getByText("JSON Formatter")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Tools" })).toHaveAttribute(
      "href",
      "/tools",
    );
  });
});
