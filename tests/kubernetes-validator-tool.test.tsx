import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KubernetesValidatorTool } from "@/components/tools/kubernetes-validator-tool";
describe("KubernetesValidatorTool", () => {
  it("separates errors from recommendations", () => {
    render(<KubernetesValidatorTool />);
    expect(screen.getAllByText("Schema and syntax errors")[0]).toBeVisible();
    expect(screen.getAllByText("Opinionated recommendations")[0]).toBeVisible();
    expect(
      screen.getAllByText(/does not make a manifest secure/)[0],
    ).toBeVisible();
  });
});
