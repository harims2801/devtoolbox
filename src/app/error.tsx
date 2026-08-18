"use client";

import { useEffect } from "react";

import { ErrorView } from "@/components/shared/error-view";
import { redactErrorReport } from "@/lib/privacy-tools";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // A future reporter may receive only this redacted summary, never raw tool state.
    void redactErrorReport(error);
  }, [error]);

  return <ErrorView onRetry={reset} />;
}
