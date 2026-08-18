import { NextResponse } from "next/server";
import { z } from "zod";
import { DNS_RECORD_TYPES } from "@/lib/dns-shared";
import { DnsLookupService } from "@/lib/server/dns-lookup";
import {
  SafeNetworkError,
  SlidingWindowRateLimiter,
  safeNetworkMessage,
} from "@/lib/server/network-security";

export const dynamic = "force-dynamic";

const schema = z
    .object({
      query: z.string().min(1).max(253),
      recordTypes: z.array(z.enum(DNS_RECORD_TYPES)).min(1).max(9),
    })
    .strict(),
  service = new DnsLookupService(),
  limiter = new SlidingWindowRateLimiter(20, 60_000);

export function createDnsPost(
  dependencies: {
    service?: Pick<DnsLookupService, "lookupRecords">;
    limiter?: Pick<SlidingWindowRateLimiter, "check">;
  } = {},
) {
  const dns = dependencies.service ?? service,
    rateLimiter = dependencies.limiter ?? limiter;
  return async function POST(request: Request) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return NextResponse.json(
        { error: "Cross-origin request rejected." },
        { status: 403 },
      );
    const length = Number(request.headers.get("content-length") ?? 0);
    if (!Number.isFinite(length) || length > 2048)
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413 },
      );
    try {
      const client =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "anonymous";
      rateLimiter.check(client);
      const parsed = schema.parse(await request.json()),
        result = await dns.lookupRecords(parsed.query, parsed.recordTypes);
      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "private, max-age=30",
          "X-Cache": result.cached ? "HIT" : "MISS",
        },
      });
    } catch (caught) {
      if (caught instanceof z.ZodError)
        return NextResponse.json(
          {
            error: "Enter a valid DNS name and select supported record types.",
          },
          { status: 400 },
        );
      const status = caught instanceof SafeNetworkError ? caught.status : 502;
      return NextResponse.json(
        { error: safeNetworkMessage(caught) },
        { status },
      );
    }
  };
}

export const POST = createDnsPost();
