import { cn } from "@/lib/utils";

export function KeyboardShortcut({
  keys,
  className,
}: {
  keys: string[];
  className?: string;
}) {
  return (
    <span
      aria-label={`Keyboard shortcut: ${keys.join(" plus ")}`}
      className={cn("inline-flex gap-1", className)}
    >
      {keys.map((key) => (
        <kbd
          aria-hidden="true"
          className="bg-muted text-muted-foreground min-w-5 rounded border px-1.5 py-0.5 text-center font-mono text-[10px] font-medium shadow-xs"
          key={key}
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}
