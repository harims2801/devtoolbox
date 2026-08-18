import Link from "next/link";
export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-3xl font-semibold">You are offline</h1>
      <p className="text-muted-foreground mt-4">
        Previously loaded browser-only tools can continue working.
        Server-assisted tools, including the certificate checker, need a network
        connection.
      </p>
      <Link className="mt-6 inline-block underline" href="/tools">
        Open cached tools
      </Link>
    </main>
  );
}
