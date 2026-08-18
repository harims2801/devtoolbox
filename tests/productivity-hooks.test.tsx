import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FAVORITES_STORAGE_KEY, useFavorites } from "@/hooks/use-favorites";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  RECENT_TOOLS_LIMIT,
  RECENT_TOOLS_STORAGE_KEY,
  useRecentTools,
} from "@/hooks/use-recent-tools";

describe("productivity storage hooks", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("adds and removes favorites while synchronizing hook instances", async () => {
    const first = renderHook(() => useFavorites());
    const second = renderHook(() => useFavorites());

    await waitFor(() => expect(first.result.current.isHydrated).toBe(true));

    act(() => {
      first.result.current.toggleFavorite("json-formatter-validator");
    });

    await waitFor(() =>
      expect(second.result.current.favoriteIds).toEqual([
        "json-formatter-validator",
      ]),
    );
    expect(
      JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]"),
    ).toEqual(["json-formatter-validator"]);

    act(() => {
      first.result.current.toggleFavorite("json-formatter-validator");
    });
    await waitFor(() => expect(first.result.current.favoriteIds).toEqual([]));
  });

  it("keeps at most ten unique recent tools in most-recent-first order", async () => {
    const { result } = renderHook(() => useRecentTools());
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    act(() => {
      for (let index = 0; index < 12; index += 1) {
        result.current.addRecentTool(`tool-${index}`);
      }
      result.current.addRecentTool("tool-5");
    });

    expect(result.current.recentToolIds).toHaveLength(RECENT_TOOLS_LIMIT);
    expect(result.current.recentToolIds[0]).toBe("tool-5");
    expect(new Set(result.current.recentToolIds)).toHaveLength(
      RECENT_TOOLS_LIMIT,
    );

    act(() => result.current.clearRecentTools());
    expect(result.current.recentToolIds).toEqual([]);
    expect(
      JSON.parse(localStorage.getItem(RECENT_TOOLS_STORAGE_KEY) ?? "[]"),
    ).toEqual([]);
  });

  it("continues working in memory when localStorage is unavailable", async () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Storage disabled");
      });
    const { result } = renderHook(() =>
      useLocalStorage<string[]>("unavailable", []),
    );
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    act(() => result.current.setValue(["still-works"]));

    expect(result.current.value).toEqual(["still-works"]);
    setItem.mockRestore();
  });
});
