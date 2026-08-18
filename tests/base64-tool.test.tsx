import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Base64Tool } from "@/components/tools/base64-tool";

describe("Base64Tool", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  it("encodes, swaps, and decodes Unicode text", async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);
    const input = screen.getAllByLabelText("Text to encode")[0]!;

    fireEvent.change(input, { target: { value: "வணக்கம் 👋" } });
    await user.click(screen.getByRole("button", { name: "Encode" }));
    const encoded =
      screen.getAllByTestId("base64-output")[0]!.textContent ?? "";
    expect(encoded).not.toBe("");

    await user.click(screen.getByRole("button", { name: "Swap" }));
    await user.click(screen.getByRole("button", { name: "Decode" }));
    expect(screen.getAllByTestId("base64-output")[0]).toHaveTextContent(
      "வணக்கம் 👋",
    );
  });

  it("reports invalid Base64 without rendering it as HTML", async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);
    await user.selectOptions(screen.getByLabelText("Operation"), "decode");
    fireEvent.change(screen.getAllByLabelText("Base64 to decode")[0]!, {
      target: { value: "<script>alert(1)</script>" },
    });
    await user.click(screen.getByRole("button", { name: "Decode" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(/not valid/i);
    expect(screen.queryByTestId("base64-output")).toBeNull();
  });

  it("encodes a local binary file and shows metadata", async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);
    await user.click(screen.getByRole("button", { name: "File mode" }));
    const file = new File([Uint8Array.from([0, 1, 2, 255])], "sample.bin", {
      type: "application/octet-stream",
    });

    await user.upload(document.querySelector('input[type="file"]')!, file);
    expect(await screen.findAllByText("sample.bin")).not.toHaveLength(0);
    expect(screen.getAllByTestId("file-base64")[0]).toHaveTextContent(
      "AAEC/w==",
    );
    expect(screen.getAllByText("application/octet-stream")[0]).toBeVisible();
  });

  it("releases image preview URLs when the preview is removed", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Base64Tool />);
    await user.click(screen.getByRole("button", { name: "File mode" }));
    const file = new File([Uint8Array.from([137, 80, 78, 71])], "image.png", {
      type: "image/png",
    });

    await user.upload(document.querySelector('input[type="file"]')!, file);
    expect(await screen.findByAltText("Preview of image.png")).toBeVisible();
    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });
});
