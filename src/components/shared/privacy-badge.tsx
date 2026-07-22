import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export function PrivacyBadge({
  label = "Processed locally",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-emerald-600/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300",
        className,
      )}
    >
      <ShieldCheck aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}
