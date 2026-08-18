"use client";
import { useEffect, useState } from "react";
import { Download, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-online-status";
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function PwaStatus() {
  const online = useOnlineStatus(),
    [install, setInstall] = useState<InstallPromptEvent | null>(null),
    [update, setUpdate] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (registration.waiting) setUpdate(registration.waiting);
        registration.addEventListener("updatefound", () => {
          registration.installing?.addEventListener("statechange", () => {
            if (registration.waiting && navigator.serviceWorker.controller)
              setUpdate(registration.waiting);
          });
        });
      });
    const before = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPromptEvent);
    };
    const changed = () => window.location.reload();
    window.addEventListener("beforeinstallprompt", before);
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    return () => {
      window.removeEventListener("beforeinstallprompt", before);
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
    };
  }, []);
  return (
    <div
      aria-live="polite"
      className="fixed right-3 bottom-3 z-50 flex flex-col gap-2"
    >
      {!online ? (
        <div className="flex items-center gap-2 rounded-lg border bg-amber-50 px-3 py-2 text-sm text-amber-950 shadow">
          <WifiOff className="size-4" />
          Offline: local tools remain available; network tools are disabled.
        </div>
      ) : null}
      {install ? (
        <Button
          variant="outline"
          onClick={() => void install.prompt().then(() => setInstall(null))}
        >
          <Download />
          Install DevToolbox
        </Button>
      ) : null}
      {update ? (
        <Button
          variant="outline"
          onClick={() => update.postMessage({ type: "SKIP_WAITING" })}
        >
          <RefreshCw />
          Update available
        </Button>
      ) : null}
    </div>
  );
}
