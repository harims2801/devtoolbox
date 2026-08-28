import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StructuredOutputSchemaTool } from "@/components/tools/structured-output-schema-tool";

afterEach(cleanup);

describe("structured output schema tool", () => {
  it("starts with a strict, valid example and renders the raw schema", () => {
    render(<StructuredOutputSchemaTool />);
    expect(
      screen.getAllByTestId("schema-validation-success")[0],
    ).toHaveTextContent("matches");
    expect(
      screen.getAllByTestId("structured-output-result")[0],
    ).toHaveTextContent('"additionalProperties": false');
  });

  it("reports exact sample paths for invalid JSON and schema mismatches", () => {
    render(<StructuredOutputSchemaTool />);
    const sample = screen.getAllByLabelText("Sample JSON")[0]!;
    fireEvent.change(sample, { target: { value: "{" } });
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("not valid JSON");
    fireEvent.change(sample, {
      target: {
        value: JSON.stringify({
          candidate: { name: "A", years_experience: "seven", skills: [] },
          recommendation: "maybe",
          debug: true,
        }),
      },
    });
    const errors = screen.getAllByTestId("schema-validation-errors")[0]!;
    expect(errors).toHaveTextContent("$.candidate.years_experience");
    expect(errors).toHaveTextContent("$.recommendation");
    expect(errors).toHaveTextContent("$.debug");
  });

  it("surfaces conflicting field paths and recovers after removal", () => {
    render(<StructuredOutputSchemaTool />);
    fireEvent.click(screen.getAllByRole("button", { name: "Add field" })[0]!);
    const paths = screen.getAllByLabelText(/Field \d+ path/);
    fireEvent.change(paths.at(-1)!, { target: { value: "candidate" } });
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("conflicts");
    fireEvent.click(
      screen.getAllByRole("button", {
        name: `Remove field ${paths.length / 2}`,
      })[0]!,
    );
    expect(screen.queryAllByText(/conflicts/)).toHaveLength(0);
  });

  it("exports each provider wrapper and resets without retaining sample data", () => {
    render(<StructuredOutputSchemaTool />);
    const exportTarget = screen.getAllByLabelText("Export target")[0]!;
    fireEvent.change(exportTarget, { target: { value: "openai" } });
    expect(
      screen.getAllByTestId("structured-output-result")[0],
    ).toHaveTextContent('"strict": true');
    fireEvent.change(exportTarget, { target: { value: "anthropic" } });
    expect(
      screen.getAllByTestId("structured-output-result")[0],
    ).toHaveTextContent('"output_config"');
    fireEvent.change(exportTarget, { target: { value: "google" } });
    expect(
      screen.getAllByTestId("structured-output-result")[0],
    ).toHaveTextContent('"mime_type": "application/json"');
    fireEvent.click(screen.getAllByRole("button", { name: "Reset" })[0]!);
    expect(screen.getAllByLabelText("Sample JSON")[0]).toHaveValue("");
    expect(screen.getAllByLabelText("Schema name")[0]).toHaveValue(
      "structured_output",
    );
  });
});
