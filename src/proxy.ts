import { NextResponse, type NextRequest } from "next/server";
import { getCanonicalRedirect } from "@/lib/deployment-tools";
export function proxy(request: NextRequest) {
  const destination = getCanonicalRedirect(request, process.env.CANONICAL_HOST);
  return destination
    ? NextResponse.redirect(destination, 308)
    : NextResponse.next();
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
