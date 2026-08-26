import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UrlParserTool } from "@/components/tools/url-parser-tool";

describe("UrlParserTool", () => {
  it("parses the example, redacts its password, and switches views", async () => {
    const user = userEvent.setup();
    render(<UrlParserTool />);
    await user.click(screen.getByRole("button", { name: "Load example" }));
    expect(screen.getAllByText(/Yes \(value hidden\)/)[0]).toBeVisible();
    expect(
      within(screen.getAllByTestId("url-parser-report")[0]!).queryByText(
        /secret/,
      ),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Structured JSON" }));
    expect(screen.getAllByText(/"usernamePresent": true/)[0]).toBeVisible();
  });

  it("requires a base for a relative reference", () => {
    render(<UrlParserTool />);
    fireEvent.change(screen.getAllByLabelText("URL or reference")[0]!, {
      target: { value: "../api?q=1" },
    });
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "explicit base URL",
    );
  });

  it("never fetches or navigates while parsing unsafe-looking text", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<UrlParserTool />);
    fetchSpy.mockClear();
    fireEvent.change(screen.getAllByLabelText("URL or reference")[0]!, {
      target: { value: "javascript:<img src=x onerror=alert(1)>" },
    });
    expect(screen.getAllByText(/not an HTTP\(S\)/)[0]).toBeVisible();
    expect(document.querySelector("img")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
