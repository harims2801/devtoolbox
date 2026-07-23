"use client";

import { useEffect } from "react";

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { metaOrCtrl?: boolean; enabled?: boolean } = {},
) {
  const { metaOrCtrl = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const modifierMatches = !metaOrCtrl || event.metaKey || event.ctrlKey;

      if (modifierMatches && event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        callback();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callback, enabled, key, metaOrCtrl]);
}
