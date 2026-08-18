"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Clock3, Search, Star, X } from "lucide-react";

import { FavoriteButton } from "@/components/tools/favorite-button";
import { Button } from "@/components/ui/button";
import {
  getCategoryById,
  getToolById,
  searchTools,
  toolCategories,
  type ToolDefinition,
} from "@/config/tool-registry";
import { useFavorites } from "@/hooks/use-favorites";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useRecentTools } from "@/hooks/use-recent-tools";

interface CommandPaletteContextValue {
  openCommandPalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      "useCommandPalette must be used within CommandPaletteProvider",
    );
  }
  return context;
}

function resolveTools(ids: readonly string[]) {
  return ids
    .map(getToolById)
    .filter((tool): tool is ToolDefinition => Boolean(tool));
}

function CommandToolRow({
  tool,
  selected,
  onOpen,
}: {
  tool: ToolDefinition;
  selected: boolean;
  onOpen: () => void;
}) {
  const category = getCategoryById(tool.category);
  const Icon = tool.icon;

  return (
    <div
      className={
        selected
          ? "bg-accent flex items-center gap-2 rounded-lg p-1"
          : "flex items-center gap-2 rounded-lg p-1"
      }
      id={`command-tool-${tool.id}`}
      role="option"
      aria-selected={selected}
    >
      <button
        className="focus-visible:outline-ring flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 text-left focus-visible:outline-2"
        onClick={onOpen}
        type="button"
      >
        <span className="bg-muted rounded-md border p-2">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {tool.name}
          </span>
          <span className="text-muted-foreground block truncate text-xs">
            {category?.name}
          </span>
        </span>
      </button>
      <FavoriteButton toolId={tool.id} toolName={tool.name} />
    </div>
  );
}

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { favoriteIds } = useFavorites();
  const { recentToolIds, addRecentTool } = useRecentTools();
  const favoriteTools = useMemo(() => resolveTools(favoriteIds), [favoriteIds]);
  const recentTools = useMemo(
    () => resolveTools(recentToolIds),
    [recentToolIds],
  );
  const recentOnlyTools = useMemo(
    () =>
      recentTools.filter(
        (tool) => !favoriteTools.some((favorite) => favorite.id === tool.id),
      ),
    [favoriteTools, recentTools],
  );
  const searchResults = useMemo(
    () => (query.trim() ? searchTools(query).slice(0, 20) : []),
    [query],
  );
  const idleTools = useMemo(() => {
    return [...favoriteTools, ...recentOnlyTools];
  }, [favoriteTools, recentOnlyTools]);
  const selectableTools = query.trim() ? searchResults : idleTools;

  const openCommandPalette = useCallback(() => {
    setSelectedIndex(0);
    setOpen(true);
  }, []);
  useKeyboardShortcut("k", openCommandPalette, { metaOrCtrl: true });

  function openTool(tool: ToolDefinition) {
    addRecentTool(tool.id);
    setOpen(false);
    setQuery("");
    router.push(tool.route);
  }

  function handleKeyboardNavigation(
    event: React.KeyboardEvent<HTMLDivElement>,
  ) {
    if (!selectableTools.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % selectableTools.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(
        (index) =>
          (index - 1 + selectableTools.length) % selectableTools.length,
      );
    } else if (
      event.key === "Enter" &&
      event.target instanceof HTMLInputElement
    ) {
      event.preventDefault();
      const selectedTool = selectableTools[selectedIndex];
      if (selectedTool) openTool(selectedTool);
    }
  }

  return (
    <CommandPaletteContext.Provider value={{ openCommandPalette }}>
      {children}
      <Dialog.Root
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          setSelectedIndex(0);
          if (!nextOpen) setQuery("");
        }}
        open={open}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
          <Dialog.Content
            aria-describedby="command-palette-description"
            className="bg-background fixed top-[12vh] left-1/2 z-50 flex max-h-[76vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-xl border shadow-2xl"
            onKeyDown={handleKeyboardNavigation}
          >
            <Dialog.Title className="sr-only">Search tools</Dialog.Title>
            <Dialog.Description
              className="sr-only"
              id="command-palette-description"
            >
              Search and open DevToolbox tools, favorites, and recent tools.
            </Dialog.Description>

            <div className="flex items-center gap-3 border-b px-4">
              <Search
                aria-hidden="true"
                className="text-muted-foreground size-5 shrink-0"
              />
              <input
                aria-activedescendant={
                  selectableTools[selectedIndex]
                    ? `command-tool-${selectableTools[selectedIndex].id}`
                    : undefined
                }
                aria-controls="command-results"
                autoFocus
                className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search tools, descriptions, or keywords..."
                value={query}
              />
              <Dialog.Close asChild>
                <Button aria-label="Close search" size="icon" variant="ghost">
                  <X aria-hidden="true" />
                </Button>
              </Dialog.Close>
            </div>

            <div
              className="overflow-y-auto p-3"
              id="command-results"
              role="listbox"
            >
              {query.trim() ? (
                searchResults.length ? (
                  <div className="space-y-5">
                    {toolCategories.map((category) => {
                      const tools = searchResults.filter(
                        (tool) => tool.category === category.id,
                      );
                      if (!tools.length) return null;

                      return (
                        <section
                          aria-labelledby={`command-${category.id}`}
                          key={category.id}
                        >
                          <h3
                            className="text-muted-foreground px-2 pb-1 text-xs font-semibold tracking-wider uppercase"
                            id={`command-${category.id}`}
                          >
                            {category.name}
                          </h3>
                          <div className="space-y-1">
                            {tools.map((tool) => (
                              <CommandToolRow
                                key={tool.id}
                                onOpen={() => openTool(tool)}
                                selected={
                                  selectableTools[selectedIndex]?.id === tool.id
                                }
                                tool={tool}
                              />
                            ))}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground px-3 py-10 text-center text-sm">
                    No tools match “{query}”.
                  </p>
                )
              ) : favoriteTools.length || recentOnlyTools.length ? (
                <div className="space-y-5">
                  {favoriteTools.length ? (
                    <section aria-labelledby="command-favorites">
                      <h3
                        className="text-muted-foreground flex items-center gap-2 px-2 pb-1 text-xs font-semibold tracking-wider uppercase"
                        id="command-favorites"
                      >
                        <Star aria-hidden="true" className="size-3.5" />
                        Favorites
                      </h3>
                      {favoriteTools.map((tool) => (
                        <CommandToolRow
                          key={tool.id}
                          onOpen={() => openTool(tool)}
                          selected={
                            selectableTools[selectedIndex]?.id === tool.id
                          }
                          tool={tool}
                        />
                      ))}
                    </section>
                  ) : null}

                  {recentOnlyTools.length ? (
                    <section aria-labelledby="command-recent">
                      <h3
                        className="text-muted-foreground flex items-center gap-2 px-2 pb-1 text-xs font-semibold tracking-wider uppercase"
                        id="command-recent"
                      >
                        <Clock3 aria-hidden="true" className="size-3.5" />
                        Recent tools
                      </h3>
                      {recentOnlyTools.map((tool) => (
                        <CommandToolRow
                          key={tool.id}
                          onOpen={() => openTool(tool)}
                          selected={
                            selectableTools[selectedIndex]?.id === tool.id
                          }
                          tool={tool}
                        />
                      ))}
                    </section>
                  ) : null}
                </div>
              ) : (
                <div className="px-4 py-10 text-center">
                  <Search
                    aria-hidden="true"
                    className="text-muted-foreground mx-auto size-6"
                  />
                  <p className="mt-3 text-sm font-medium">
                    Search all developer tools
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Favorites and recently opened tools will appear here.
                  </p>
                </div>
              )}
            </div>
            <div className="text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-xs">
              <span>↑↓ Navigate · Enter Open</span>
              <span>Esc Close</span>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </CommandPaletteContext.Provider>
  );
}
