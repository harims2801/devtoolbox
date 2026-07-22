"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

interface CodeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
  toolbar?: React.ReactNode;
}

export function CodeTextarea({
  label,
  description,
  error,
  toolbar,
  className,
  id,
  ...props
}: CodeTextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const descriptionId = description ? `${textareaId}-description` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <div className="bg-muted/30 flex min-h-11 items-center justify-between gap-3 border-b px-3">
        <label className="text-sm font-medium" htmlFor={textareaId}>
          {label}
        </label>
        {toolbar ? (
          <div className="flex flex-wrap items-center justify-end gap-1">
            {toolbar}
          </div>
        ) : null}
      </div>
      <textarea
        aria-describedby={
          [descriptionId, errorId].filter(Boolean).join(" ") || undefined
        }
        aria-invalid={Boolean(error)}
        className={cn(
          "placeholder:text-muted-foreground/70 focus-visible:ring-ring min-h-80 w-full resize-y bg-transparent p-4 font-mono text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-inset",
          error && "focus-visible:ring-destructive",
          className,
        )}
        id={textareaId}
        spellCheck={false}
        {...props}
      />
      {description || error ? (
        <div className="border-t px-3 py-2 text-xs">
          {error ? (
            <p className="text-destructive" id={errorId} role="alert">
              {error}
            </p>
          ) : (
            <p className="text-muted-foreground" id={descriptionId}>
              {description}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
