import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UuidGeneratorTool } from "@/components/tools/uuid-generator-tool";
describe("UuidGeneratorTool", () => {
  it("generates a unique batch", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce("550e8400-e29b-41d4-a716-446655440000")
        .mockReturnValueOnce("6ba7b810-9dad-41d1-80b4-00c04fd430c8"),
    });
    render(<UuidGeneratorTool />);
    const count = screen.getAllByLabelText(/Number of UUIDs/)[0]!;
    await userEvent.clear(count);
    await userEvent.type(count, "2");
    await userEvent.click(
      screen.getByRole("button", { name: "Generate UUIDs" }),
    );
    expect(screen.getAllByTestId("uuid-output")[0]).toHaveTextContent(
      "All 2 UUIDs are unique",
    );
    vi.unstubAllGlobals();
  });
});
