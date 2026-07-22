import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  description,
  action,
  className,
  headingLevel = 2,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  headingLevel?: 1 | 2 | 3;
}) {
  const Heading = headingLevel === 1 ? "h1" : headingLevel === 3 ? "h3" : "h2";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        <Heading className="text-2xl font-semibold tracking-tight">
          {title}
        </Heading>
        {description ? (
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
