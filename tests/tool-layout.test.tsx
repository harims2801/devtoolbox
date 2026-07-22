import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ToolLayout } from "@/components/tools/tool-layout";

describe("ToolLayout", () => {
  it("renders reusable tool content and supporting sections", () => {
    render(
      <ToolLayout
        category="Formatting & Validation"
        description="Format sample data."
        examples={[{ title: "Basic object", description: "A small example." }]}
        faqs={[{ question: "Is data uploaded?", answer: "No." }]}
        input={<div>Input editor</div>}
        instructions={<p>Paste input and run the tool.</p>}
        output={<div>Output preview</div>}
        seoContent={<p>Background information.</p>}
        title="Sample Formatter"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Sample Formatter" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Processed locally")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How to use this tool" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Is data uploaded?")).toBeInTheDocument();
  });
});
