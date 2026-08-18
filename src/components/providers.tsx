"use client";

import { ThemeProvider } from "next-themes";
import { PrivacyAnalytics } from "@/components/analytics/privacy-analytics";

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
        <PrivacyAnalytics />
        <Toaster />
      </CommandPaletteProvider>
    </ThemeProvider>
  );
}
