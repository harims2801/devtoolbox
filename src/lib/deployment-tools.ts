const hostPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
export function getCanonicalRedirect(request: Request, canonicalHost?: string) {
  if (!canonicalHost) return null;
  const normalizedHost = canonicalHost.trim().toLowerCase();
  if (!hostPattern.test(normalizedHost)) return null;
  const url = new URL(request.url);
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  if (url.hostname === normalizedHost && forwardedProtocol !== "http")
    return null;
  url.protocol = "https:";
  url.hostname = normalizedHost;
  url.port = "";
  return url;
}
