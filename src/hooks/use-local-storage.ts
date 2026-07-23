"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LOCAL_STORAGE_EVENT = "devtoolbox-local-storage";

type StoredValueUpdater<T> = T | ((current: T) => T);

function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue === null ? fallback : (JSON.parse(storedValue) as T);
  } catch {
    return fallback;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef(initialValue);
  const [value, setValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setValue(readStoredValue(key, initialValueRef.current));
    setIsHydrated(true);
  }, [key]);

  useEffect(() => {
    function synchronize(event: Event) {
      if (event instanceof StorageEvent && event.key !== key) return;
      if (
        event instanceof CustomEvent &&
        (event.detail as { key?: string } | undefined)?.key !== key
      ) {
        return;
      }

      setValue(readStoredValue(key, initialValueRef.current));
    }

    window.addEventListener("storage", synchronize);
    window.addEventListener(LOCAL_STORAGE_EVENT, synchronize);

    return () => {
      window.removeEventListener("storage", synchronize);
      window.removeEventListener(LOCAL_STORAGE_EVENT, synchronize);
    };
  }, [key]);

  const setStoredValue = useCallback(
    (updater: StoredValueUpdater<T>) => {
      setValue((currentValue) => {
        const nextValue =
          typeof updater === "function"
            ? (updater as (current: T) => T)(currentValue)
            : updater;

        try {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
          queueMicrotask(() => {
            window.dispatchEvent(
              new CustomEvent(LOCAL_STORAGE_EVENT, { detail: { key } }),
            );
          });
        } catch {
          // Keep the in-memory value usable when storage is unavailable.
        }

        return nextValue;
      });
    },
    [key],
  );

  return { value, setValue: setStoredValue, isHydrated };
}
