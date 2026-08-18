# Production deployment

Vercel is the primary target because it supports this Next.js application and its Node.js TLS certificate endpoint without an adapter. Cloudflare is an alternative only when deployed with its Next.js/OpenNext adapter and Node compatibility verified for the certificate route.

## Environment

Set these separately for Preview and Production. Never expose server-only values with a `NEXT_PUBLIC_` prefix.

| Variable                            | Required     | Purpose                                                          |
| ----------------------------------- | ------------ | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`               | Yes          | Exact public canonical URL, such as `https://devtoolbox.example` |
| `CANONICAL_HOST`                    | Production   | Apex or `www` hostname selected as canonical                     |
| `FEEDBACK_WEBHOOK_URL`              | For feedback | HTTPS endpoint for the feedback provider                         |
| `FEEDBACK_WEBHOOK_TOKEN`            | For feedback | Secret provider token, at least 12 characters                    |
| `FEEDBACK_RATE_LIMIT_PER_MINUTE`    | No           | Per-instance feedback limit; defaults to 5                       |
| `CERTIFICATE_RATE_LIMIT_PER_MINUTE` | No           | Per-instance certificate-check limit; defaults to 10             |
| `SERVER_REQUEST_TIMEOUT_MS`         | No           | Feedback provider timeout, 500–15000 ms                          |
| `APP_VERSION`                       | Recommended  | Release identifier returned by `/api/health`                     |

For globally consistent rate limits at higher traffic, replace the in-memory buckets with a managed store before scaling across many regions.

## Vercel procedure

1. Import `harims2801/devtoolbox` and keep the detected Next.js framework, `pnpm install`, and `pnpm build` settings.
2. Add the environment variables above. Use Vercel secrets for webhook values.
3. Deploy a Preview from the deployment PR. Run `SMOKE_TEST_URL=https://preview-url pnpm test:smoke`.
4. Promote only after CI, smoke checks, and the production checklist pass.
5. Add the custom domain, configure its DNS records as Vercel shows, and enable the matching `CANONICAL_HOST`. Vercel provisions and renews HTTPS automatically.
6. Choose either apex or `www`; point both at the project. The application sends a permanent HTTPS redirect to the configured canonical host.
7. After production promotion, rerun the smoke command and verify the generated canonical, Open Graph image, sitemap, robots file, icons, and installable PWA.

## Monitoring and rollback

- Uptime probe: `GET /api/health`; alert on non-200 responses, invalid JSON, or elevated latency.
- Error monitoring: connect Vercel logs or a provider such as Sentry without recording tool input/output. Scrub request bodies and email addresses.
- Analytics: retain the existing privacy-preserving aggregate events only; verify consent behavior where required.
- Rollback: in Vercel Deployments, select the last known-good production deployment and use **Promote to Production**. Repeat smoke checks after promotion.
- Backups: the app stores no primary database. Export feedback from its provider according to its retention policy and keep environment configuration documented in a secure password manager.

## Cloudflare alternative

Use the official OpenNext/Workers workflow, configure the same variables and domains, then execute the same checklist. Treat Node TLS support in `/api/certificate` as a release gate; disable that route or deploy it to a Node service if the selected Cloudflare runtime cannot provide the required socket APIs.
