import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SqlFormatterTool } from "@/components/tools/sql-formatter-tool";

describe("SqlFormatterTool", () => {
  it("formats SQL with selectable keyword case", async () => {
    const user = userEvent.setup();
    render(<SqlFormatterTool />);
    fireEvent.change(screen.getAllByLabelText("SQL input")[0]!, {
      target: { value: "select id from users where active=true;" },
    });
    await user.selectOptions(
      screen.getByLabelText("SQL keyword case"),
      "lower",
    );
    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(screen.getByTestId("sql-output")).toHaveTextContent("select id");
  });
  it("loads a local SQL file", async () => {
    const user = userEvent.setup();
    render(<SqlFormatterTool />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(
      input,
      new File(["select 1;"], "query.sql", { type: "text/plain" }),
    );
    expect(screen.getAllByLabelText("SQL input")[0]).toHaveValue("select 1;");
  });
  it("reports unterminated input without executing it", async () => {
    const user = userEvent.setup();
    render(<SqlFormatterTool />);
    fireEvent.change(screen.getAllByLabelText("SQL input")[0]!, {
      target: { value: "select 'oops" },
    });
    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("Unterminated");
  });
});
