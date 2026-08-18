import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DockerComposeValidatorTool } from "@/components/tools/docker-compose-validator-tool";

describe("DockerComposeValidatorTool", () => {
  it("validates the example, filters findings, and offers exports", async () => {
    const user = userEvent.setup();
    render(<DockerComposeValidatorTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    await user.click(screen.getByRole("button", { name: "Validate" }));
    const output = screen.getAllByTestId("compose-output")[0]!;
    expect(output).toHaveTextContent("Services: web, db");
    expect(output).toHaveTextContent("Formatted YAML");
    expect(
      screen.getAllByRole("button", { name: "Copy report" })[0],
    ).toBeEnabled();
    expect(
      screen.getAllByRole("button", { name: "Download report" })[0],
    ).toBeEnabled();
    await user.click(screen.getAllByLabelText(/info/)[0]!);
    expect(output).toHaveTextContent("Findings (0)");
  });

  it("shows YAML and semantic errors without executing values", async () => {
    const user = userEvent.setup();
    render(<DockerComposeValidatorTool />);
    fireEvent.change(screen.getAllByLabelText("Compose YAML")[0]!, {
      target: { value: "services:\n  app:\n    image: one\n    image: two\n" },
    });
    await user.click(screen.getByRole("button", { name: "Validate" }));
    expect(screen.getAllByTestId("compose-output")[0]).toHaveTextContent(
      /unique/i,
    );
  });
});
