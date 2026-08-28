import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PasswordGeneratorTool } from "@/components/tools/password-generator-tool";

describe("PasswordGeneratorTool", () => {
  it("generates a requested batch and displays entropy", async () => {
    const user = userEvent.setup();
    render(<PasswordGeneratorTool />);
    fireEvent.change(screen.getAllByLabelText("Password count")[0]!, {
      target: { value: "3" },
    });
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(
      screen.getAllByTestId("password-output")[0]!.querySelectorAll("li"),
    ).toHaveLength(3);
    expect(screen.getAllByTestId("entropy-summary")[0]).toHaveTextContent(
      /bits per password/,
    );
    expect(
      screen.getByRole("button", { name: "Regenerate" }),
    ).toBeInTheDocument();
  });
  it("shows impossible configuration errors", async () => {
    const user = userEvent.setup();
    render(<PasswordGeneratorTool />);
    fireEvent.change(screen.getAllByLabelText("Password length")[0]!, {
      target: { value: "2" },
    });
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "cannot include all 4",
    );
  });
  it("guarantees comma-separated custom inclusions including a quoted comma", async () => {
    const user = userEvent.setup();
    render(<PasswordGeneratorTool />);
    fireEvent.change(screen.getAllByLabelText("Password count")[0]!, {
      target: { value: "4" },
    });
    fireEvent.change(
      screen.getAllByLabelText("Required custom inclusions")[0]!,
      { target: { value: '@, #, ","' } },
    );
    await user.click(screen.getByRole("button", { name: "Generate" }));
    const values = [
      ...screen.getAllByTestId("password-output")[0]!.querySelectorAll("code"),
    ].map((node) => node.textContent ?? "");
    expect(values).toHaveLength(4);
    for (const value of values) {
      expect(value).toContain("@");
      expect(value).toContain("#");
      expect(value).toContain(",");
    }
  });
  it("shows inclusion syntax and rule-conflict errors", async () => {
    const user = userEvent.setup();
    render(<PasswordGeneratorTool />);
    fireEvent.change(screen.getAllByLabelText("Custom exclusions")[0]!, {
      target: { value: "@" },
    });
    fireEvent.change(
      screen.getAllByLabelText("Required custom inclusions")[0]!,
      { target: { value: "@" } },
    );
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("also excluded");
    fireEvent.change(
      screen.getAllByLabelText("Required custom inclusions")[0]!,
      { target: { value: '", ' } },
    );
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("unclosed quote");
  });
  it("copies one password and the complete batch", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    render(<PasswordGeneratorTool />);
    await user.click(screen.getByRole("button", { name: "Generate" }));
    await user.click(
      screen.getAllByRole("button", { name: /Copy password 1/ })[0]!,
    );
    expect(writeText).toHaveBeenCalledTimes(1);
    await user.click(screen.getAllByRole("button", { name: "Copy all" })[0]!);
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(writeText.mock.calls[1]![0].split("\n")).toHaveLength(5);
  });
});
