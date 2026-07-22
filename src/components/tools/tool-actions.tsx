"use client";

import { Copy, Download, Eraser, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface ActionButtonProps {
  className?: string;
  disabled?: boolean;
}

export function CopyButton({
  text,
  getText,
  label = "Copy",
  className,
  disabled,
}: ActionButtonProps & {
  text?: string;
  getText?: () => string | Promise<string>;
  label?: string;
}) {
  async function copy() {
    try {
      const value = getText ? await getText() : (text ?? "");
      if (!navigator.clipboard) throw new Error("Clipboard is unavailable");
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy the value");
    }
  }

  return (
    <Button
      className={className}
      disabled={disabled}
      onClick={copy}
      size="sm"
      type="button"
      variant="outline"
    >
      <Copy aria-hidden="true" />
      {label}
    </Button>
  );
}

export function DownloadButton({
  content,
  filename,
  mimeType = "text/plain;charset=utf-8",
  label = "Download",
  className,
  disabled,
}: ActionButtonProps & {
  content: string | Blob;
  filename: string;
  mimeType?: string;
  label?: string;
}) {
  function download() {
    try {
      const blob =
        content instanceof Blob
          ? content
          : new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    } catch {
      toast.error("Could not download the file");
    }
  }

  return (
    <Button
      className={className}
      disabled={disabled}
      onClick={download}
      size="sm"
      type="button"
      variant="outline"
    >
      <Download aria-hidden="true" />
      {label}
    </Button>
  );
}

export function ResetButton({
  onReset,
  label = "Reset",
  className,
  disabled,
}: ActionButtonProps & { onReset: () => void; label?: string }) {
  return (
    <Button
      className={className}
      disabled={disabled}
      onClick={onReset}
      size="sm"
      type="button"
      variant="ghost"
    >
      <Eraser aria-hidden="true" />
      {label}
    </Button>
  );
}

export function ExampleButton({
  onLoad,
  label = "Load example",
  className,
  disabled,
}: ActionButtonProps & { onLoad: () => void; label?: string }) {
  return (
    <Button
      className={className}
      disabled={disabled}
      onClick={onLoad}
      size="sm"
      type="button"
      variant="outline"
    >
      <Sparkles aria-hidden="true" />
      {label}
    </Button>
  );
}
