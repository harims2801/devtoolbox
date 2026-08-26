import { NextResponse } from "next/server";
import { z } from "zod";
import { WebhookTester } from "@/lib/server/webhook-tester";
import {
  SafeNetworkError,
  SlidingWindowRateLimiter,
  safeNetworkMessage,
} from "@/lib/server/network-security";

export const dynamic = "force-dynamic";

const MAX_API_BODY_BYTES = 48 * 1024,
  schema = z
    .object({
      endpoint: z.string().min(1).max(2_048),
      method: z.enum(["POST", "PUT", "PATCH"]),
      payload: z.unknown(),
      headers: z
        .array(
          z
            .object({ name: z.string().max(128), value: z.string().max(1_024) })
            .strict(),
        )
        .max(20),
      consent: z.literal(true),
    })
    .strict(),
  tester = new WebhookTester(),
  limiter = new SlidingWindowRateLimiter(5, 60_000);

async function readBoundedJson(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(declared) || declared > MAX_API_BODY_BYTES)
    throw new SafeNetworkError(
      "TOO_LARGE",
      "The webhook request is too large.",
      413,
    );
  if (!request.body)
    throw new SafeNetworkError("INVALID_INPUT", "Enter a webhook request.");
  const reader = request.body.getReader(),
    chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_API_BODY_BYTES) {
      await reader.cancel();
      throw new SafeNetworkError(
        "TOO_LARGE",
        "The webhook request is too large.",
        413,
      );
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(merged)) as unknown;
  } catch {
    throw new SafeNetworkError("INVALID_INPUT", "Enter a valid JSON request.");
  }
}

export function createWebhookPost(
  dependencies: {
    tester?: Pick<WebhookTester, "send">;
    limiter?: Pick<SlidingWindowRateLimiter, "check">;
  } = {},
) {
  const service = dependencies.tester ?? tester,
    rateLimiter = dependencies.limiter ?? limiter;
  return async function POST(request: Request) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return NextResponse.json(
        { error: "Cross-origin request rejected." },
        { status: 403 },
      );
    try {
      const client =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "anonymous";
      rateLimiter.check(client);
      const parsed = schema.parse(await readBoundedJson(request));
      return NextResponse.json(
        await service.send(
          parsed.endpoint,
          parsed.method,
          parsed.payload,
          parsed.headers,
        ),
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (caught) {
      if (caught instanceof z.ZodError)
        return NextResponse.json(
          {
            error:
              "Confirm the send and provide a valid endpoint, method, payload, and headers.",
          },
          { status: 400 },
        );
      return NextResponse.json(
        { error: safeNetworkMessage(caught) },
        { status: caught instanceof SafeNetworkError ? caught.status : 502 },
      );
    }
  };
}

export const POST = createWebhookPost();
