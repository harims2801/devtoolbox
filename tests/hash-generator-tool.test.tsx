import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HashGeneratorTool } from "@/components/tools/hash-generator-tool";
describe("HashGeneratorTool", () => {
  it("hashes example text", async () => {
    render(<HashGeneratorTool />);
    await userEvent.click(screen.getByRole("button", { name: "Load example" }));
    await userEvent.click(screen.getByRole("button", { name: "Hash text" }));
    expect(await screen.findAllByTestId("hash-output")).not.toHaveLength(0);
    expect(screen.getAllByTestId("hash-output")[0]).toHaveTextContent(
      "Lowercase hexadecimal",
    );
  });
  it("warns for SHA-1", async () => {
    render(<HashGeneratorTool />);
    await userEvent.selectOptions(
      screen.getAllByLabelText("Algorithm")[0]!,
      "SHA-1",
    );
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(/compatibility/);
  });
});
