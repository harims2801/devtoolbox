import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KauCow } from "@/components/layout/kau-cow";

const play = vi.fn().mockResolvedValue(undefined);
const pause = vi.fn();

describe("KauCow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause);
  });

  it("shows Kau and her attached greeting", () => {
    render(<KauCow />);
    expect(screen.getByText("Hi Kau")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /play moo moo/i }),
    ).toHaveAttribute("title", "Catch Kau for a moo!");
    expect(screen.getByTestId("kau-moo-audio")).toHaveAttribute(
      "src",
      "/kau/cow-moo.m4a",
    );
  });

  it("plays the attached recording exactly twice per activation", () => {
    render(<KauCow />);
    fireEvent.click(screen.getByRole("button", { name: /play moo moo/i }));
    const audio = screen.getByTestId("kau-moo-audio");

    expect(pause).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledOnce();
    expect(screen.getByText("Moo moo!")).toBeInTheDocument();

    fireEvent.ended(audio);
    expect(play).toHaveBeenCalledTimes(2);

    fireEvent.ended(audio);
    expect(play).toHaveBeenCalledTimes(2);
  });
});
