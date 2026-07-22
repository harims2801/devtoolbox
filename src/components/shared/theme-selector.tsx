"use client";

import { useSyncExternalStore } from "react";
import { MonitorCog } from "lucide-react";
import { useTheme } from "next-themes";

const subscribe = () => () => undefined;

export function ThemeSelector() {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const { theme, setTheme } = useTheme();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Color theme</span>
      <MonitorCog
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 size-4"
      />
      <select
        aria-label="Color theme"
        className="bg-background hover:bg-accent focus-visible:outline-ring h-9 appearance-none rounded-md border py-1 pr-7 pl-8 text-sm font-medium shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
        disabled={!hydrated}
        onChange={(event) => setTheme(event.target.value)}
        value={hydrated ? theme : "system"}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 text-xs"
      >
        ▾
      </span>
    </label>
  );
}
