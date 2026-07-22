"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorViewProps {
  onRetry?: () => void;
}

export function ErrorView({ onRetry }: ErrorViewProps) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="bg-destructive/10 text-destructive rounded-full p-3">
        <AlertTriangle aria-hidden="true" className="size-6" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground mt-2">
        The page could not be displayed. Your tool input has not been included
        in this error.
      </p>
      {onRetry ? (
        <Button className="mt-6" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </main>
  );
}
