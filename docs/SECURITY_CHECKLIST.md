# DevToolbox security checklist

- [x] Browser-only tools keep input out of URLs, analytics, and application storage.
- [x] Analytics payloads use an event allowlist and optional registry tool IDs only.
- [x] Error summaries redact common tokens, keys, credentials, email addresses, and IP addresses.
- [x] Server-assisted certificate checks validate DNS and connected addresses against SSRF ranges.
- [x] Network requests have request-size, safe-port, timeout, rate-limit, caching, and safe-error controls.
- [x] API POST routes reject cross-origin requests where browser CSRF is relevant.
- [x] Uploaded files are read locally and constrained by each tool's accepted types and size limits.
- [x] Service-worker caching excludes all API responses and user-submitted values.
- [x] Security headers cover content types, referrers, permissions, framing, cross-origin isolation, and HSTS in production.
- [x] Structured content is rendered as text or React nodes rather than injected HTML.
- [ ] Run dependency auditing in the release pipeline and review actionable production findings.
- [ ] Reassess CSP directives when adding any third-party scripts, fonts, analytics, or embedded content.
