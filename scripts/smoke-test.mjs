const baseUrl = new URL(process.env.SMOKE_TEST_URL ?? "http://localhost:3000");
const targets = [
  ["/", "text/html"],
  ["/tools", "text/html"],
  ["/about", "text/html"],
  ["/privacy", "text/html"],
  ["/manifest.webmanifest", "application/manifest+json"],
  ["/robots.txt", "text/plain"],
  ["/sitemap.xml", "application/xml"],
  ["/api/health", "application/json"],
];

for (const [path, expectedType] of targets) {
  const response = await fetch(new URL(path, baseUrl), {
    headers: { "User-Agent": "DevToolbox deployment smoke test" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes(expectedType))
    throw new Error(`${path} returned unexpected content type ${contentType}`);
  console.log(`PASS ${path}`);
}
