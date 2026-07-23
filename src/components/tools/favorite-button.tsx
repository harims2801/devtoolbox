"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  toolId,
  toolName,
  showLabel = false,
  className,
}: {
  toolId: string;
  toolName: string;
  showLabel?: boolean;
  className?: string;
}) {
  const { isFavorite, toggleFavorite, isHydrated } = useFavorites();
  const favorite = isHydrated && isFavorite(toolId);

  function toggle() {
    toggleFavorite(toolId);
    toast.success(
      favorite
        ? `${toolName} removed from favorites`
        : `${toolName} added to favorites`,
    );
  }

  return (
    <Button
      aria-label={
        favorite
          ? `Remove ${toolName} from favorites`
          : `Add ${toolName} to favorites`
      }
      aria-pressed={favorite}
      className={cn(className)}
      onClick={toggle}
      size={showLabel ? "sm" : "icon"}
      type="button"
      variant={favorite ? "secondary" : "ghost"}
    >
      <Star
        aria-hidden="true"
        className={favorite ? "fill-current" : undefined}
      />
      {showLabel ? (favorite ? "Favorited" : "Add favorite") : null}
    </Button>
  );
}
