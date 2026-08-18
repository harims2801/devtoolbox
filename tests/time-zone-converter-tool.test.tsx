import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TimeZoneConverterTool } from "@/components/tools/time-zone-converter-tool";
describe("TimeZoneConverterTool", () => {
  it("converts one instant to multiple zones", async () => {
    const user = userEvent.setup();
    render(<TimeZoneConverterTool />);
    fireEvent.change(screen.getAllByLabelText("Local date and time")[0]!, {
      target: { value: "2024-01-01T23:30" },
    });
    fireEvent.change(screen.getAllByLabelText("Source time zone")[0]!, {
      target: { value: "UTC" },
    });
    fireEvent.change(screen.getAllByLabelText("Destination time zone 1")[0]!, {
      target: { value: "Asia/Kolkata" },
    });
    await user.click(
      screen.getAllByRole("button", { name: /Add destination/ })[0]!,
    );
    fireEvent.change(screen.getAllByLabelText("Destination time zone 2")[0]!, {
      target: { value: "America/New_York" },
    });
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getAllByTestId("time-zone-output")[0]).toHaveTextContent(
      "2024-01-02 05:00:00",
    );
    expect(screen.getAllByTestId("time-zone-output")[0]).toHaveTextContent(
      "UTC-05:00",
    );
  });
  it("rejects DST gaps and requires overlap choice", async () => {
    const user = userEvent.setup();
    render(<TimeZoneConverterTool />);
    fireEvent.change(screen.getAllByLabelText("Source time zone")[0]!, {
      target: { value: "America/New_York" },
    });
    fireEvent.change(screen.getAllByLabelText("Local date and time")[0]!, {
      target: { value: "2024-03-10T02:30" },
    });
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("does not exist");
    fireEvent.change(screen.getAllByLabelText("Local date and time")[0]!, {
      target: { value: "2024-11-03T01:30" },
    });
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("occurs twice");
    await user.click(screen.getAllByLabelText("Earlier offset")[0]!);
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getAllByTestId("time-zone-output")[0]).toHaveTextContent(
      "UTC",
    );
  });
});
