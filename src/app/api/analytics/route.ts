import { NextResponse } from "next/server";
import { z } from "zod";
import { isSafeAnalyticsEvent } from "@/lib/privacy-tools";
import { getToolById } from "@/config/tool-registry";
export const dynamic = "force-dynamic";
const totals = new Map<string, number>();
export async function POST(request: Request) {
  const origin = request.headers.get("origin"),
    expected = new URL(request.url).origin;
  if (origin && origin !== expected)
    return new NextResponse(null, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 512)
    return new NextResponse(null, { status: 413 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const parsed = z
    .object({ event: z.string(), toolId: z.string().optional() })
    .strict()
    .safeParse(body);
  if (
    !parsed.success ||
    !isSafeAnalyticsEvent(parsed.data.event) ||
    (parsed.data.toolId && !getToolById(parsed.data.toolId))
  )
    return new NextResponse(null, { status: 400 });
  const key = parsed.data.toolId
    ? `${parsed.data.event}:${parsed.data.toolId}`
    : parsed.data.event;
  totals.set(key, (totals.get(key) ?? 0) + 1);
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
