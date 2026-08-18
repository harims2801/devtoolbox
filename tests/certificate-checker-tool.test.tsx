import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CertificateCheckerTool } from "@/components/tools/certificate-checker-tool";
describe("CertificateCheckerTool", () => {
  it("shows restricted target guidance", () => {
    render(<CertificateCheckerTool />);
    expect(screen.getAllByText(/public hostnames/)[0]).toBeVisible();
    expect(screen.getAllByDisplayValue("443")[0]).toBeDisabled();
    expect(screen.getAllByText(/not implemented/)[0]).toBeVisible();
  });
});
