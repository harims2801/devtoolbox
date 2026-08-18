"use client";

import { Trash2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ToolGrid } from "@/components/tools/tool-grid";
import { Button } from "@/components/ui/button";
import { getToolById, type ToolDefinition } from "@/config/tool-registry";
import { useFavorites } from "@/hooks/use-favorites";
import { useRecentTools } from "@/hooks/use-recent-tools";

function resolveTools(ids: readonly string[]) {
  return ids
    .map(getToolById)
    .filter((tool): tool is ToolDefinition => Boolean(tool));
}

export function SavedToolsView() {
  const { favoriteIds, isHydrated: favoritesHydrated } = useFavorites();
  const {
    recentToolIds,
    clearRecentTools,
    isHydrated: recentHydrated,
  } = useRecentTools();
  const favoriteTools = resolveTools(favoriteIds);
  const recentTools = resolveTools(recentToolIds);
  const hydrated = favoritesHydrated && recentHydrated;

  if (!hydrated) {
    return (
      <p className="text-muted-foreground mt-10 text-sm">
        Loading your saved tools…
      </p>
    );
  }

  return (
    <div className="mt-10 space-y-14">
      <section aria-labelledby="favorite-tools-heading">
        <h2 className="text-xl font-semibold" id="favorite-tools-heading">
          Favorites
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Stored only in this browser and synchronized across open tabs.
        </p>
        <div className="mt-5">
          {favoriteTools.length ? (
            <ToolGrid tools={favoriteTools} />
          ) : (
            <EmptyState
              description="Use the star button on any tool card or tool page to add it here."
              title="No favorite tools yet"
            />
          )}
        </div>
      </section>

      <section aria-labelledby="recent-tools-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold" id="recent-tools-heading">
              Recently opened
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Up to 10 tool IDs are saved. Tool input is never stored.
            </p>
          </div>
          {recentTools.length ? (
            <Button onClick={clearRecentTools} size="sm" variant="outline">
              <Trash2 aria-hidden="true" />
              Clear history
            </Button>
          ) : null}
        </div>
        <div className="mt-5">
          {recentTools.length ? (
            <ToolGrid tools={recentTools} />
          ) : (
            <EmptyState
              description="Tools you open will appear here for quick access."
              title="No recent tools"
            />
          )}
        </div>
      </section>
    </div>
  );
}
