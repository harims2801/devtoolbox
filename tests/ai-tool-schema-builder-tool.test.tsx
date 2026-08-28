import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AiToolSchemaBuilderTool } from "@/components/tools/ai-tool-schema-builder-tool";

afterEach(cleanup);

describe("AI tool schema builder UI", () => {
  it("renders a valid OpenAI function definition by default", () => {
    render(<AiToolSchemaBuilderTool />);
    const output = screen.getAllByTestId("ai-tool-schema-result")[0]!;
    expect(output).toHaveTextContent('"type": "function"');
    expect(output).toHaveTextContent('"strict": true');
    expect(output).toHaveTextContent('"additionalProperties": false');
  });

  it("switches between provider formats without losing field definitions", () => {
    render(<AiToolSchemaBuilderTool />);
    const target = screen.getAllByLabelText("Export target")[0]!,
      output = screen.getAllByTestId("ai-tool-schema-result")[0]!;
    fireEvent.change(target, { target: { value: "anthropic" } });
    expect(output).toHaveTextContent('"input_schema"');
    expect(output).not.toHaveTextContent('"outputSchema"');
    fireEvent.change(target, { target: { value: "mcp" } });
    expect(output).toHaveTextContent('"inputSchema"');
    expect(output).toHaveTextContent('"outputSchema"');
    expect(output).toHaveTextContent('"readOnlyHint": true');
  });

  it("shows name, description, conflict, and behavior errors", () => {
    render(<AiToolSchemaBuilderTool />);
    fireEvent.change(screen.getAllByLabelText("Tool name")[0]!, {
      target: { value: "bad tool!" },
    });
    fireEvent.change(screen.getAllByLabelText("Tool description")[0]!, {
      target: { value: "" },
    });
    fireEvent.click(screen.getAllByLabelText("Destructive")[0]!);
    const errors = screen.getAllByRole("alert").map((node) => node.textContent);
    expect(errors.join(" ")).toMatch(/Tool name/);
    expect(errors.join(" ")).toMatch(/description/);
    expect(errors.join(" ")).toMatch(/cannot also be marked read-only/);
    expect(screen.queryAllByTestId("ai-tool-schema-result")).toHaveLength(0);
  });

  it("supports removing all parameters and output fields, then reset", () => {
    render(<AiToolSchemaBuilderTool />);
    for (let index = 3; index >= 1; index -= 1)
      fireEvent.click(
        screen.getAllByRole("button", {
          name: `Remove input parameters field ${index}`,
        })[0]!,
      );
    for (let index = 2; index >= 1; index -= 1)
      fireEvent.click(
        screen.getAllByRole("button", {
          name: `Remove output fields field ${index}`,
        })[0]!,
      );
    expect(
      screen.getAllByText("This tool accepts no arguments.")[0],
    ).toBeVisible();
    expect(
      screen.getAllByText("No output schema will be exported.")[0],
    ).toBeVisible();
    fireEvent.click(screen.getAllByRole("button", { name: "Reset" })[0]!);
    expect(screen.getAllByLabelText("Tool name")[0]).toHaveValue("my_tool");
  });
});
