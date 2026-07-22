"use client";

import { useEffect } from "react";

import { ErrorView } from "@/components/shared/error-view";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error monitoring will be connected later; never log tool input or output here.
  }, [error]);

  return <ErrorView onRetry={reset} />;
}
