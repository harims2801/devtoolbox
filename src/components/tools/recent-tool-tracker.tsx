"use client";

import { useEffect } from "react";

import { useRecentTools } from "@/hooks/use-recent-tools";

export function RecentToolTracker({ toolId }: { toolId: string }) {
  const { addRecentTool } = useRecentTools();

  useEffect(() => {
    addRecentTool(toolId);
  }, [addRecentTool, toolId]);

  return null;
}
