import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TerraformVariableGeneratorTool } from "@/components/tools/terraform-variable-generator-tool";
describe("TerraformVariableGeneratorTool", () => {
  it("renders inferred variables and generated HCL", () => {
    render(<TerraformVariableGeneratorTool />);
    expect(screen.getAllByText("service_name")[0]).toBeVisible();
    expect(screen.getAllByTestId("terraform-output")[0]).toHaveTextContent(
      'variable "service_name"',
    );
    expect(
      screen.getAllByText(/Generated Terraform must be reviewed/)[0],
    ).toBeVisible();
  });
});
