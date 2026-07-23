"use client";

import { Search } from "lucide-react";

import { useCommandPalette } from "@/components/search/command-palette";
import { KeyboardShortcut } from "@/components/shared/keyboard-shortcut";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SearchButton({ className }: { className?: string }) {
  const { openCommandPalette } = useCommandPalette();

  return (
    <Button
      aria-label="Search tools"
      className={cn(
        "text-muted-foreground h-9 gap-2 px-3 shadow-xs",
        className,
      )}
      onClick={openCommandPalette}
      type="button"
      variant="outline"
    >
      <Search aria-hidden="true" className="size-4" />
      <span className="hidden sm:inline">Search tools</span>
      <KeyboardShortcut
        className="hidden lg:inline-flex"
        keys={["Ctrl/⌘", "K"]}
      />
    </Button>
  );
}
