import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpHeaderAnalyzer } from "@/lib/server/http-header-analyzer";
import {
  SafeNetworkError,
  SlidingWindowRateLimiter,
  safeNetworkMessage,
} from "@/lib/server/network-security";

export const dynamic = "force-dynamic";

const schema = z
    .object({
      url: z.string().min(1).max(2048),
      method: z.enum(["HEAD", "GET"]).default("HEAD"),
    })
    .strict(),
  analyzer = new HttpHeaderAnalyzer(),
  limiter = new SlidingWindowRateLimiter(10, 60_000);

export function createHttpHeadersPost(
  dependencies: {
    analyzer?: Pick<HttpHeaderAnalyzer, "analyze">;
    limiter?: Pick<SlidingWindowRateLimiter, "check">;
  } = {},
) {
  const service = dependencies.analyzer ?? analyzer,
    rateLimiter = dependencies.limiter ?? limiter;
  return async function POST(request: Request) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return NextResponse.json(
        { error: "Cross-origin request rejected." },
        { status: 403 },
      );
    const length = Number(request.headers.get("content-length") ?? 0);
    if (!Number.isFinite(length) || length > 4096)
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413 },
      );
    try {
      const client =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "anonymous";
      rateLimiter.check(client);
      const parsed = schema.parse(await request.json());
      return NextResponse.json(
        await service.analyze(parsed.url, parsed.method),
        {
          headers: { "Cache-Control": "no-store" },
        },
      );
    } catch (caught) {
      if (caught instanceof z.ZodError)
        return NextResponse.json(
          { error: "Enter a valid URL and supported request method." },
          { status: 400 },
        );
      return NextResponse.json(
        { error: safeNetworkMessage(caught) },
        { status: caught instanceof SafeNetworkError ? caught.status : 502 },
      );
    }
  };
}

export const POST = createHttpHeadersPost();
