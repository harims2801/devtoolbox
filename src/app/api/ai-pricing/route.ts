import { NextResponse } from "next/server";
import { z } from "zod";
import { PricingPageImporter } from "@/lib/server/pricing-page-importer";
import {
  SafeNetworkError,
  SlidingWindowRateLimiter,
  safeNetworkMessage,
} from "@/lib/server/network-security";

export const dynamic = "force-dynamic";

const schema = z.object({ url: z.string().min(1).max(2048) }).strict(),
  importer = new PricingPageImporter(),
  limiter = new SlidingWindowRateLimiter(6, 60_000);

export function createAiPricingPost(
  dependencies: {
    importer?: Pick<PricingPageImporter, "import">;
    limiter?: Pick<SlidingWindowRateLimiter, "check">;
  } = {},
) {
  const service = dependencies.importer ?? importer,
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
      const { url } = schema.parse(await request.json());
      return NextResponse.json(await service.import(url), {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (caught) {
      if (caught instanceof z.ZodError)
        return NextResponse.json(
          { error: "Enter a valid pricing-page URL." },
          { status: 400 },
        );
      return NextResponse.json(
        { error: safeNetworkMessage(caught) },
        { status: caught instanceof SafeNetworkError ? caught.status : 502 },
      );
    }
  };
}

export const POST = createAiPricingPost();
