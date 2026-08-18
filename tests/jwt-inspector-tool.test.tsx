import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { JwtInspectorTool } from "@/components/tools/jwt-inspector-tool";
import { encodeJwtSegment } from "@/lib/jwt-tools";

describe("JwtInspectorTool", () => {
  it("loads and inspects a safe example with a verification warning", async () => {
    const user = userEvent.setup();
    render(<JwtInspectorTool />);

    expect(
      screen.getAllByText("Decoding does not verify authenticity")[0],
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Load example" }));
    await user.click(screen.getByRole("button", { name: "Decode JWT" }));
    expect(screen.getAllByTestId("jwt-inspection")[0]).toHaveTextContent(
      "HS256",
    );
    expect(screen.getAllByText("safe-demo-user")[0]).toBeVisible();
  });

  it("renders untrusted claims as text and warns about none", async () => {
    const user = userEvent.setup();
    render(<JwtInspectorTool />);
    const jwt = `${encodeJwtSegment({ alg: "none" })}.${encodeJwtSegment({
      sub: "<script>globalThis.compromised=true</script>",
    })}.unverified`;

    fireEvent.change(screen.getAllByLabelText("JWT input")[0]!, {
      target: { value: jwt },
    });
    await user.click(screen.getByRole("button", { name: "Decode JWT" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      /unsupported “none” algorithm/i,
    );
    expect(screen.getAllByText(/globalThis\.compromised/)[0]).toBeVisible();
    expect(
      (globalThis as { compromised?: boolean }).compromised,
    ).toBeUndefined();
  });

  it("reports malformed tokens and clears values", async () => {
    const user = userEvent.setup();
    render(<JwtInspectorTool />);
    fireEvent.change(screen.getAllByLabelText("JWT input")[0]!, {
      target: { value: "not.a.valid.jwt" },
    });
    await user.click(screen.getByRole("button", { name: "Decode JWT" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      /three non-empty segments/i,
    );
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getAllByLabelText("JWT input")[0]).toHaveValue("");
  });
});
