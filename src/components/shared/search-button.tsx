"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { KeyboardShortcut } from "@/components/shared/keyboard-shortcut";
import { cn } from "@/lib/utils";

export function SearchButton({ className }: { className?: string }) {
  const router = useRouter();

  useEffect(() => {
    function openTools(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        router.push("/tools");
      }
    }

    window.addEventListener("keydown", openTools);
    return () => window.removeEventListener("keydown", openTools);
  }, [router]);

  return (
    <Link
      aria-label="Browse and search tools"
      className={cn(
        "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm shadow-xs transition-colors",
        className,
      )}
      href="/tools"
    >
      <Search aria-hidden="true" className="size-4" />
      <span className="hidden sm:inline">Search tools</span>
      <KeyboardShortcut
        className="hidden lg:inline-flex"
        keys={["Ctrl/⌘", "K"]}
      />
    </Link>
  );
}
