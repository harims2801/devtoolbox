import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LlmTokenCostTool,
  SAVED_LLM_PRICING_KEY,
} from "@/components/tools/llm-token-cost-tool";

beforeEach(() => {
  cleanup();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("LLM token and cost tool", () => {
  it("estimates separated prompt parts and never persists prompt text", async () => {
    render(<LlmTokenCostTool />);
    fireEvent.change(screen.getAllByLabelText(/System instructions/)[0]!, {
      target: { value: "a private system prompt" },
    });
    expect(screen.getAllByText(/~\d+ tokens/)[0]).toBeInTheDocument();
    expect(localStorage.getItem(SAVED_LLM_PRICING_KEY) ?? "").not.toContain(
      "private system prompt",
    );
  });

  it("imports a pricing row, requires review, saves locally, and calculates cost", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        sourceUrl: "https://openai.com/api/pricing/",
        finalUrl: "https://openai.com/api/pricing/",
        retrievedAt: "2026-08-28T00:00:00.000Z",
        provider: "OpenAI",
        warnings: ["Imported prices are untrusted draft data."],
        plans: [
          {
            id: "imported",
            provider: "OpenAI",
            model: "Example Model",
            currency: "USD",
            unitTokens: 1_000_000,
            inputPrice: 2,
            cachedInputPrice: 0.5,
            outputPrice: 8,
            sourceUrl: "https://openai.com/api/pricing/",
          },
        ],
      }),
    } as Response);
    render(<LlmTokenCostTool />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Import pricing" })[0]!,
    );
    await screen.findAllByRole("option", { name: /Example Model/ });
    const save = screen.getAllByRole("button", {
      name: "Save for comparison",
    })[0]!;
    expect(save).toBeDisabled();
    fireEvent.click(screen.getAllByLabelText(/I verified/)[0]!);
    fireEvent.click(save);
    await waitFor(() =>
      expect(screen.getAllByTestId("llm-cost-comparison")[0]).toHaveTextContent(
        "Example Model",
      ),
    );
    expect(
      JSON.parse(localStorage.getItem(SAVED_LLM_PRICING_KEY) ?? "[]")[0],
    ).toMatchObject({ provider: "OpenAI", model: "Example Model" });
  });

  it("supports manual pricing and removes saved comparisons", async () => {
    render(<LlmTokenCostTool />);
    fireEvent.change(screen.getAllByLabelText("Provider")[0]!, {
      target: { value: "Manual AI" },
    });
    fireEvent.change(screen.getAllByLabelText("Model / tier")[0]!, {
      target: { value: "Model M" },
    });
    fireEvent.change(screen.getAllByLabelText("Input price")[0]!, {
      target: { value: "1" },
    });
    fireEvent.change(screen.getAllByLabelText("Output price")[0]!, {
      target: { value: "2" },
    });
    fireEvent.click(screen.getAllByLabelText(/I verified/)[0]!);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Save for comparison" })[0]!,
    );
    const remove = (
      await screen.findAllByRole("button", {
        name: "Remove Manual AI Model M",
      })
    )[0]!;
    fireEvent.click(remove);
    await waitFor(() =>
      expect(
        screen.queryAllByRole("button", { name: "Remove Manual AI Model M" }),
      ).toHaveLength(0),
    );
  });

  it("renders safe import errors without attempting navigation", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "Only public HTTPS pricing pages are allowed.",
      }),
    } as Response);
    render(<LlmTokenCostTool />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Import pricing" })[0]!,
    );
    expect((await screen.findAllByRole("alert"))[0]).toHaveTextContent(
      "Only public HTTPS",
    );
  });
});
