"use client";

import * as Tabs from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export function SplitPane({
  first,
  second,
  className,
}: {
  first: React.ReactNode;
  second: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      <div className="min-w-0">{first}</div>
      <div className="min-w-0">{second}</div>
    </div>
  );
}

export function ResponsiveWorkspace({
  input,
  output,
  inputLabel = "Input",
  outputLabel = "Output",
  className,
  mode = "split",
}: {
  input: React.ReactNode;
  output: React.ReactNode;
  inputLabel?: string;
  outputLabel?: string;
  className?: string;
  mode?: "split" | "input" | "output";
}) {
  return (
    <div className={className}>
      <div className="hidden md:block">
        {mode === "split" ? (
          <SplitPane first={input} second={output} />
        ) : mode === "input" ? (
          input
        ) : (
          output
        )}
      </div>
      {mode === "split" ? (
        <Tabs.Root className="md:hidden" defaultValue="input">
          <Tabs.List
            aria-label="Tool input and output"
            className="bg-muted mb-4 grid grid-cols-2 rounded-lg p-1"
          >
            <Tabs.Trigger
              className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md px-3 py-2 text-sm font-medium data-[state=active]:shadow-xs"
              value="input"
            >
              {inputLabel}
            </Tabs.Trigger>
            <Tabs.Trigger
              className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md px-3 py-2 text-sm font-medium data-[state=active]:shadow-xs"
              value="output"
            >
              {outputLabel}
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="input">{input}</Tabs.Content>
          <Tabs.Content value="output">{output}</Tabs.Content>
        </Tabs.Root>
      ) : (
        <div className="md:hidden">{mode === "input" ? input : output}</div>
      )}
    </div>
  );
}
