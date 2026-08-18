import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How DevToolbox handles local processing, offline caches, and server-assisted tools.",
};
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Privacy</h1>
      <div className="mt-6 space-y-5 leading-7">
        <p>
          Most DevToolbox tools process what you paste or upload entirely in
          your browser. Tool inputs and outputs are not intentionally placed in
          the offline cache.
        </p>
        <h2 className="text-xl font-semibold">Offline caching</h2>
        <p>
          The service worker caches the application shell, previously visited
          pages, and static code or image assets so browser-only tools can work
          after the first load. It does not cache API responses, including
          certificate checks or hostnames submitted to them.
        </p>
        <h2 className="text-xl font-semibold">Clearing cached files</h2>
        <p>
          You can remove DevToolbox site data from your browser settings or
          uninstall the app. Updating the app replaces older versioned caches.
        </p>
        <h2 className="text-xl font-semibold">Network tools</h2>
        <p>
          Tools marked server-assisted require a network request and are
          unavailable offline. Review each tool’s notice before submitting data.
        </p>
      </div>
    </main>
  );
}
