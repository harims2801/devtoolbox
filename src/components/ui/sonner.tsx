"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      closeButton
      richColors
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      toastOptions={{ classNames: { toast: "font-sans" } }}
      {...props}
    />
  );
}
