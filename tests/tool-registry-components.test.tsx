import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RelatedTools } from "@/components/tools/related-tools";
import { ToolBreadcrumbs } from "@/components/tools/tool-breadcrumbs";
import { getToolById } from "@/config/tool-registry";

describe("registry-driven tool components", () => {
  const tool = getToolById("json-formatter-validator");

  it("builds tool breadcrumbs from registry metadata", () => {
    expect(tool).toBeDefined();
    render(<ToolBreadcrumbs tool={tool!} />);

    expect(screen.getByRole("link", { name: "Tools" })).toHaveAttribute(
      "href",
      "/tools",
    );
    expect(
      screen.getByRole("link", { name: "Formatting & Validation" }),
    ).toHaveAttribute("href", "/tools/category/formatting-validation");
    expect(screen.getByText("JSON Formatter and Validator")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("renders planned related tools through their placeholder routes", () => {
    expect(tool).toBeDefined();
    render(<RelatedTools tool={tool!} />);

    expect(screen.getByText("YAML Converter")).toBeInTheDocument();
    expect(screen.getAllByText("Coming soon")).not.toHaveLength(0);
    expect(
      screen.getByRole("link", { name: /YAML Converter/ }),
    ).toHaveAttribute("href", "/tools/yaml-formatter");
  });
});
