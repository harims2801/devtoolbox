"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/shared/theme-selector";
import { mainNavigation } from "@/config/navigation";
import { toolCategories } from "@/config/tool-registry";

export function MobileNav() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          aria-label="Open navigation"
          className="md:hidden"
          size="icon"
          variant="ghost"
        >
          <Menu aria-hidden="true" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=closed]:animate-out data-[state=open]:animate-in fixed inset-0 z-50 bg-black/45 backdrop-blur-xs" />
        <Dialog.Content className="bg-background data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right fixed inset-y-0 right-0 z-50 flex w-[min(88vw,22rem)] flex-col border-l p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-semibold">Navigation</Dialog.Title>
            <Dialog.Close asChild>
              <Button aria-label="Close navigation" size="icon" variant="ghost">
                <X aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-muted-foreground mt-1 text-sm">
            Browse DevToolbox pages and tool categories.
          </Dialog.Description>

          <nav
            aria-label="Mobile navigation"
            className="mt-7 flex flex-col gap-1"
          >
            {mainNavigation.map((item) => (
              <Dialog.Close asChild key={item.href}>
                <Link
                  className="hover:bg-accent rounded-md px-3 py-2.5 text-sm font-medium"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </Dialog.Close>
            ))}
          </nav>

          <p className="text-muted-foreground mt-7 px-3 text-xs font-semibold tracking-wider uppercase">
            Categories
          </p>
          <nav
            aria-label="Tool categories"
            className="mt-2 flex flex-col gap-1 overflow-y-auto"
          >
            {toolCategories.map(({ id, name, slug, icon: Icon }) => (
              <Dialog.Close asChild key={id}>
                <Link
                  className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm"
                  href={`/tools/category/${slug}`}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {name}
                </Link>
              </Dialog.Close>
            ))}
          </nav>
          <div className="mt-auto border-t pt-5">
            <ThemeSelector />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
