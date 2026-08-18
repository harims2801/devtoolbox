# Production release checklist

## Before deployment

- [ ] `pnpm check` and the six-profile browser suite pass in CI.
- [ ] Preview smoke test passes with `SMOKE_TEST_URL=<preview> pnpm test:smoke`.
- [ ] Production environment values are present; webhook secrets are server-only.
- [ ] Feedback provider works and rejects unauthorized requests.
- [ ] Rate limits, timeouts, logs, uptime alerting, and privacy scrubbing are configured.
- [ ] `NEXT_PUBLIC_APP_URL` and `CANONICAL_HOST` match the chosen apex or `www` domain.
- [ ] DNS changes and a last-known-good deployment are recorded for rollback.

## After deployment

- [ ] HTTPS is valid; HTTP and the alternate hostname redirect once to the canonical URL.
- [ ] `/api/health` returns `status: ok` and the expected release version.
- [ ] Home, tools, legal pages, feedback, certificate checks, downloads, and clipboard actions work.
- [ ] Canonical metadata, Open Graph image, sitemap, robots, icons, manifest, and service worker load.
- [ ] Desktop and mobile layouts, light/dark themes, keyboard navigation, and offline fallback work.
- [ ] Error logs and analytics contain no tool input/output or secrets.

## Rollback trigger

Rollback immediately for broken core navigation, widespread tool errors, invalid TLS/domain routing, sensitive-data logging, or a sustained health-check failure. Promote the last known-good deployment, rerun smoke checks, and open an incident record before attempting a forward fix.
