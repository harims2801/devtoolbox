import type { Metadata } from "next";
import { AnalyticsPreference } from "@/components/privacy/analytics-preference";
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
          your browser. Local tools do not send input to our server. Tool inputs
          and outputs are not stored in localStorage, placed in URLs, sent to
          analytics, or intentionally placed in the offline cache.
        </p>
        <h2 className="text-xl font-semibold">Analytics choice</h2>
        <p>
          Analytics uses Vercel Web Analytics plus privacy-limited internal
          counts for page views, tool opens, and generic actions. It excludes
          input, output, filenames, hostnames, tokens, hashes, decoded data,
          logs, manifests, and environment variables. Your preference below and
          browser Do Not Track setting prevent events from being sent, and no
          fingerprinting is used.
        </p>
        <AnalyticsPreference />
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
        <h2 className="text-xl font-semibold">Server-assisted tools</h2>
        <p>
          Tools marked server-assisted send only the explicitly submitted value
          needed for that request. Certificate checks use a restricted endpoint
          with network-abuse protections and do not write submitted hostnames to
          application logs.
        </p>
        <h2 className="text-xl font-semibold">Error safety</h2>
        <p>
          Application error summaries are automatically redacted for common
          keys, tokens, credentials, email addresses, and IP addresses.
          DevToolbox does not intentionally log secrets, manifests, logs,
          environment variables, or decoded data.
        </p>
      </div>
    </main>
  );
}
