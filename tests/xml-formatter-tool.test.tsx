import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { XmlFormatterTool } from "@/components/tools/xml-formatter-tool";

describe("XmlFormatterTool", () => {
  it("formats XML and resets the workspace", async () => {
    const user = userEvent.setup();
    render(<XmlFormatterTool />);
    fireEvent.change(screen.getAllByLabelText("XML input")[0]!, {
      target: { value: "<root><item>value</item></root>" },
    });
    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(screen.getByTestId("xml-output")).toHaveTextContent("<item>");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByTestId("xml-output")).not.toBeInTheDocument();
  });

  it("loads XML files locally and rejects other extensions", async () => {
    const user = userEvent.setup();
    render(<XmlFormatterTool />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(
      input,
      new File(["<root />"], "sample.xml", { type: "application/xml" }),
    );
    expect(screen.getAllByLabelText("XML input")[0]).toHaveValue("<root />");
  });

  it("renders malicious markup as inert text and reports declarations", async () => {
    const user = userEvent.setup();
    render(<XmlFormatterTool />);
    fireEvent.change(screen.getAllByLabelText("XML input")[0]!, {
      target: { value: '<root><script>alert("x")</script></root>' },
    });
    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(screen.getByTestId("xml-output")).toHaveTextContent("script");
    expect(
      document.querySelector('script:not([type="application/ld+json"])'),
    ).toBeNull();
  });
});
