"use client";

import { useCallback } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";

export const RECENT_TOOLS_STORAGE_KEY = "devtoolbox:recent-tools";
export const RECENT_TOOLS_LIMIT = 10;

export function useRecentTools() {
  const {
    value: recentToolIds,
    setValue: setRecentToolIds,
    isHydrated,
  } = useLocalStorage<string[]>(RECENT_TOOLS_STORAGE_KEY, []);

  const addRecentTool = useCallback(
    (toolId: string) => {
      setRecentToolIds((currentIds) =>
        [toolId, ...currentIds.filter((id) => id !== toolId)].slice(
          0,
          RECENT_TOOLS_LIMIT,
        ),
      );
    },
    [setRecentToolIds],
  );

  const clearRecentTools = useCallback(() => {
    setRecentToolIds([]);
  }, [setRecentToolIds]);

  return {
    recentToolIds,
    addRecentTool,
    clearRecentTools,
    isHydrated,
  };
}
