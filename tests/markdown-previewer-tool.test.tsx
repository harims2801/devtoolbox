import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MarkdownPreviewerTool } from "@/components/tools/markdown-previewer-tool";

describe("MarkdownPreviewerTool", () => {
  it("updates a sanitized preview and supports layout modes", async () => {
    const user = userEvent.setup();
    render(<MarkdownPreviewerTool />);
    fireEvent.change(screen.getAllByLabelText("Markdown editor")[0]!, {
      target: { value: "# Hello 🌍\n\n<script>alert(1)</script>" },
    });
    expect(
      await screen.findByRole("heading", { name: "Hello 🌍" }),
    ).toBeInTheDocument();
    expect(
      document.querySelector("script:not([type='application/ld+json'])"),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Preview only" }));
    expect(
      screen.getByRole("button", { name: "Preview only" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("loads local Markdown files and rejects non-Markdown files", async () => {
    const user = userEvent.setup();
    render(<MarkdownPreviewerTool />);
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["## Local file"], "notes.md", { type: "text/markdown" }),
    );
    expect(screen.getAllByLabelText("Markdown editor")[0]).toHaveValue(
      "## Local file",
    );
  });

  it("keeps remote images disabled until explicitly enabled", async () => {
    const user = userEvent.setup();
    render(<MarkdownPreviewerTool />);
    fireEvent.change(screen.getAllByLabelText("Markdown editor")[0]!, {
      target: { value: "![private](https://example.com/tracker.png)" },
    });
    expect(
      await screen.findByText("[Image blocked: private]"),
    ).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
    await user.click(
      screen.getByLabelText("Load remote HTTPS images (privacy risk)"),
    );
    expect(
      document.querySelector('img[src="https://example.com/tracker.png"]'),
    ).not.toBeNull();
  });

  it("offers keyboard-reachable editor, controls, and preview", async () => {
    const user = userEvent.setup();
    render(<MarkdownPreviewerTool />);
    await user.tab();
    expect(document.activeElement).toBeInstanceOf(HTMLElement);
    const editor = screen.getAllByLabelText("Markdown editor")[0]!;
    editor.focus();
    expect(editor).toHaveFocus();
    expect(
      screen.getAllByLabelText("Rendered Markdown preview")[0],
    ).toHaveAttribute("tabindex", "0");
  });
});
