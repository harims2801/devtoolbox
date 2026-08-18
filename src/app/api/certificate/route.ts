import { NextResponse } from "next/server";
import { z } from "zod";
import { inspectCertificate } from "@/lib/certificate-tools";
import { getServerEnvironment } from "@/config/server-env";
export const dynamic = "force-dynamic";
const schema = z
  .object({
    hostname: z.string().min(1).max(253),
    port: z.literal(443).default(443),
  })
  .strict();
const cache = new Map<
    string,
    { expires: number; value: Awaited<ReturnType<typeof inspectCertificate>> }
  >(),
  requests = new Map<string, { count: number; reset: number }>();
export async function POST(request: Request) {
  const environment = getServerEnvironment();
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403 },
    );
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 2048)
    return NextResponse.json(
      { error: "Request is too large." },
      { status: 413 },
    );
  const client =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "anonymous",
    now = Date.now(),
    bucket = requests.get(client);
  if (
    bucket &&
    bucket.reset > now &&
    bucket.count >= environment.CERTIFICATE_RATE_LIMIT_PER_MINUTE
  )
    return NextResponse.json(
      { error: "Too many checks. Please wait a minute." },
      { status: 429 },
    );
  requests.set(
    client,
    !bucket || bucket.reset <= now
      ? { count: 1, reset: now + 60000 }
      : { ...bucket, count: bucket.count + 1 },
  );
  let parsed;
  try {
    parsed = schema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Enter a valid hostname and use port 443." },
      { status: 400 },
    );
  }
  const key = parsed.hostname.toLowerCase(),
    cached = cache.get(key);
  if (cached && cached.expires > now)
    return NextResponse.json(cached.value, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  try {
    const value = await inspectCertificate(parsed.hostname, parsed.port);
    cache.set(key, { expires: now + 300000, value });
    return NextResponse.json(value, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not check this certificate.",
      },
      { status: 400 },
    );
  }
}
