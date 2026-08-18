"use client";

import { ThemeProvider } from "next-themes";

import { CommandPaletteProvider } from "@/components/search/command-palette";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CommandPaletteProvider>
        {children}
        <Toaster />
      </CommandPaletteProvider>
    </ThemeProvider>
  );
}
