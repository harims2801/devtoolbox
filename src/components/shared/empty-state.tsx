import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center",
        className,
      )}
    >
      <div className="bg-muted text-muted-foreground rounded-full p-3">
        {icon ?? <Inbox aria-hidden="true" className="size-5" />}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
