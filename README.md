# DevToolbox

DevToolbox is a privacy-focused collection of browser-based utilities for developers, DevOps
engineers, SREs, testers, students, and technical teams. Tool input is processed locally whenever
the browser can safely perform the work.

This repository currently contains the production-ready application foundation. Individual tools
will be added incrementally after the shared design system and tool registry are complete.

## Technology

- Next.js 16 with the App Router
- React 19 and strict TypeScript
- Tailwind CSS 4
- shadcn/ui-compatible component configuration
- Zod environment validation
- Vitest and React Testing Library
- Playwright
- ESLint and Prettier

## Requirements

- Node.js 24 LTS
- pnpm 11.7 or newer within major version 11

Enable pnpm through Corepack if it is not installed:

```bash
corepack enable
corepack prepare pnpm@11.7.0 --activate
```

## Installation

```bash
git clone https://github.com/harims2801/devtoolbox.git
cd devtoolbox
pnpm install
cp .env.example .env.local
```

The default local configuration uses `http://localhost:3000`. Set `NEXT_PUBLIC_APP_URL` to the
canonical production URL when deploying.

Set `NEXT_PUBLIC_ENABLE_KAU_COW=true` to enable the removable animated “Kau mode” in the
desktop header. Leave it unset or set it to `false` to remove the cow, speech cloud, and sound.

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The health endpoint is available at
[http://localhost:3000/api/health](http://localhost:3000/api/health).

For complete Windows, macOS, production-mode, and phone-testing instructions, see
[Run and test DevToolbox locally](docs/LOCAL_SETUP.md).

## Validation

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
```

Run all non-browser checks with:

```bash
pnpm check
```

Install the Playwright browser once and run end-to-end tests:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Scripts

| Command              | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `pnpm dev`           | Start the development server                       |
| `pnpm build`         | Create a production build                          |
| `pnpm start`         | Run the production build                           |
| `pnpm lint`          | Run ESLint                                         |
| `pnpm format`        | Format supported files                             |
| `pnpm format:check`  | Verify formatting without changing files           |
| `pnpm typecheck`     | Run the TypeScript compiler without emitting files |
| `pnpm test`          | Run unit and component tests once                  |
| `pnpm test:watch`    | Run tests in watch mode                            |
| `pnpm test:coverage` | Generate a coverage report                         |
| `pnpm test:e2e`      | Run Playwright browser tests                       |
| `pnpm check`         | Run the main local quality gate                    |

## Project structure

```text
src/
├── app/                 # App Router pages, states, metadata, and route handlers
├── components/
│   ├── layout/          # Application shell components
│   ├── shared/          # Reusable product states and actions
│   ├── tools/           # Shared and tool-specific interfaces
│   └── ui/              # shadcn/ui-compatible primitives
├── config/              # Validated environment and application configuration
├── data/                # Static application data and future tool registry data
├── hooks/               # Reusable React hooks
├── lib/                 # Framework-independent utilities and tool logic
└── types/               # Shared TypeScript models
tests/                   # Vitest unit and component tests
e2e/                     # Playwright workflows
public/                  # Static assets
```

## Privacy rules

- Never send tool input or output to analytics.
- Never store tokens, secrets, logs, manifests, or decoded data in browser storage.
- Never put user input in URLs.
- Never execute pasted content.
- Server-assisted tools must be clearly labelled and protected before release.

## Deployment

The primary deployment target is Vercel. Import the GitHub repository, set
`NEXT_PUBLIC_APP_URL` to the production URL, and deploy using the default Next.js settings.

Before promoting a deployment, verify:

```bash
pnpm check
```

Then smoke-test `/`, `/tools`, `/about`, and `/api/health` on the deployed URL.
