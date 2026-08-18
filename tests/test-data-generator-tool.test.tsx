import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TestDataGeneratorTool } from "@/components/tools/test-data-generator-tool";
describe("TestDataGeneratorTool", () => {
  it("generates deterministic safe JSON", async () => {
    const user = userEvent.setup();
    render(<TestDataGeneratorTool />);
    fireEvent.change(screen.getAllByLabelText("Record count")[0]!, {
      target: { value: "2" },
    });
    fireEvent.change(screen.getAllByLabelText("Test data seed")[0]!, {
      target: { value: "fixture" },
    });
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(screen.getAllByTestId("test-data-output")[0]).toHaveTextContent(
      "user001@example.test",
    );
    expect(screen.getAllByTestId("test-data-output")[0]).toHaveTextContent(
      "Test Person 002",
    );
  });
  it("rejects an invalid schema", async () => {
    const user = userEvent.setup();
    render(<TestDataGeneratorTool />);
    fireEvent.change(screen.getAllByLabelText("Custom field schema")[0]!, {
      target: { value: '{"password":"secret"}' },
    });
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "Unsupported field type",
    );
  });
  it("downloads generated files", async () => {
    const user = userEvent.setup();
    const create = vi
        .spyOn(URL, "createObjectURL")
        .mockReturnValue("blob:test"),
      revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    render(<TestDataGeneratorTool />);
    await user.click(screen.getByRole("button", { name: "Generate" }));
    await user.click(screen.getAllByRole("button", { name: "Download" })[0]!);
    expect(create).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalled();
  });
});
