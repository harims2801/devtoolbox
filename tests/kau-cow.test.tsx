import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KauCow } from "@/components/layout/kau-cow";

const close = vi.fn().mockResolvedValue(undefined);
const connect = vi.fn();
const start = vi.fn();
const stop = vi.fn();
const setValueAtTime = vi.fn();
const exponentialRampToValueAtTime = vi.fn();

class AudioContextMock {
  currentTime = 0;
  destination = {};
  close = close;
  createGain = () => ({
    connect,
    gain: { setValueAtTime, exponentialRampToValueAtTime },
  });
  createOscillator = () => ({
    connect,
    frequency: { setValueAtTime, exponentialRampToValueAtTime },
    start,
    stop,
    type: "sine",
  });
}

describe("KauCow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("AudioContext", AudioContextMock);
  });

  it("shows Kau and her attached greeting", () => {
    render(<KauCow />);
    expect(screen.getByText("Hi Kau")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /play moo moo/i }),
    ).toHaveAttribute("title", "Catch Kau for a moo!");
  });

  it("plays two moo notes and announces them when activated", () => {
    render(<KauCow />);
    fireEvent.click(screen.getByRole("button", { name: /play moo moo/i }));

    expect(start).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Moo moo!")).toBeInTheDocument();
  });
});
