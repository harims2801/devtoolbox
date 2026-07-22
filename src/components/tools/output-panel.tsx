import { cn } from "@/lib/utils";

export function OutputPanel({
  title = "Output",
  children,
  toolbar,
  emptyMessage = "Run the tool to see output.",
  isEmpty = false,
  className,
}: {
  title?: string;
  children?: React.ReactNode;
  toolbar?: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "bg-card overflow-hidden rounded-xl border shadow-xs",
        className,
      )}
    >
      <div className="bg-muted/30 flex min-h-11 items-center justify-between gap-3 border-b px-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {toolbar ? (
          <div className="flex flex-wrap items-center justify-end gap-1">
            {toolbar}
          </div>
        ) : null}
      </div>
      <div aria-live="polite" className="min-h-80 overflow-auto p-4">
        {isEmpty ? (
          <div className="text-muted-foreground flex min-h-72 items-center justify-center text-center text-sm">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
