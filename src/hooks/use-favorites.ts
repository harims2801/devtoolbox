"use client";

import { useCallback } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";

export const FAVORITES_STORAGE_KEY = "devtoolbox:favorites";

export function useFavorites() {
  const {
    value: favoriteIds,
    setValue: setFavoriteIds,
    isHydrated,
  } = useLocalStorage<string[]>(FAVORITES_STORAGE_KEY, []);

  const isFavorite = useCallback(
    (toolId: string) => favoriteIds.includes(toolId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    (toolId: string) => {
      setFavoriteIds((currentIds) =>
        currentIds.includes(toolId)
          ? currentIds.filter((id) => id !== toolId)
          : [...currentIds, toolId],
      );
    },
    [setFavoriteIds],
  );

  return { favoriteIds, isFavorite, toggleFavorite, isHydrated };
}
