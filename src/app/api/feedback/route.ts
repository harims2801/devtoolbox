import { NextResponse } from "next/server";
import {
  feedbackSchema,
  isLikelyFeedbackSpam,
  safeFeedbackPayload,
} from "@/lib/feedback-tools";
import { getServerEnvironment } from "@/config/server-env";
export const dynamic = "force-dynamic";
const buckets = new Map<string, { count: number; reset: number }>();
export async function POST(request: Request) {
  const environment = getServerEnvironment();
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 8192)
    return NextResponse.json(
      { error: "Feedback is too large." },
      { status: 413 },
    );
  const client =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "anonymous",
    now = Date.now(),
    bucket = buckets.get(client);
  if (
    bucket &&
    bucket.reset > now &&
    bucket.count >= environment.FEEDBACK_RATE_LIMIT_PER_MINUTE
  )
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Feedback could not be submitted." },
      { status: 400 },
    );
  }
  const parsed = feedbackSchema.safeParse(body);
  if (
    !parsed.success ||
    isLikelyFeedbackSpam(parsed.success ? parsed.data : ({} as never), now)
  )
    return NextResponse.json(
      { error: "Check the feedback fields and try again." },
      { status: 400 },
    );
  const toolName = (await import("@/config/tool-registry")).getToolById(
    parsed.data.toolId,
  )?.name;
  if (toolName !== parsed.data.toolName)
    return NextResponse.json(
      { error: "Feedback metadata is invalid." },
      { status: 400 },
    );
  buckets.set(
    client,
    !bucket || bucket.reset <= now
      ? { count: 1, reset: now + 60000 }
      : { ...bucket, count: bucket.count + 1 },
  );
  const provider = environment.FEEDBACK_WEBHOOK_URL;
  if (!provider)
    return NextResponse.json(
      { error: "Feedback delivery is not configured yet." },
      { status: 503 },
    );
  try {
    const response = await fetch(provider, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${environment.FEEDBACK_WEBHOOK_TOKEN ?? ""}`,
      },
      body: JSON.stringify(safeFeedbackPayload(parsed.data)),
      signal: AbortSignal.timeout(environment.SERVER_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error("provider failed");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Feedback could not be delivered. Please try again later." },
      { status: 502 },
    );
  }
}
export function resetFeedbackRateLimits() {
  buckets.clear();
}
