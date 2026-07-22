import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-muted-foreground text-sm font-semibold">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-3">
        The page may have moved, or the tool has not been released yet.
      </p>
      <Button asChild className="mt-7">
        <Link href="/">Return home</Link>
      </Button>
    </main>
  );
}
