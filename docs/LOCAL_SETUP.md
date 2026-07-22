# Run and test DevToolbox locally

This guide covers development mode, automated tests, a production-style local deployment, and
optional testing from another device on the same trusted network.

## 1. Install prerequisites

Install the following software:

- Git
- Node.js 24 LTS
- A code editor such as Visual Studio Code

Open a new terminal after installation and verify:

```bash
git --version
node --version
npm --version
```

The Node.js version should begin with `v24`.

## 2. Install pnpm

Try Corepack first:

```bash
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm --version
```

If Corepack is unavailable, install the same pnpm version with npm:

```bash
npm install --global pnpm@11.7.0
pnpm --version
```

## 3. Download the project

```bash
git clone https://github.com/harims2801/devtoolbox.git
cd devtoolbox
```

To test a feature branch before it is merged, switch to it after cloning:

```bash
git switch agent/design-system-layout
```

## 4. Install project dependencies

```bash
pnpm install
```

Create the local environment file.

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS or Linux:

```bash
cp .env.example .env.local
```

The development URL is already configured as `http://localhost:3000`.

## 5. Start development mode

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Keep the terminal open while testing. Stop the
server with `Ctrl+C`.

Check these pages:

- `/` — home page
- `/tools` — cards and category navigation
- `/about` — about page
- `/api/health` — JSON health response

Verify the desktop and mobile layouts using the responsive-device toolbar in browser developer
tools. Also test the Light, Dark, and System theme options.

## 6. Run automated checks

Run the main quality gate:

```bash
pnpm check
```

This verifies formatting, linting, strict TypeScript, unit/component tests, and the production
build.

Install Chromium for Playwright once, then run the browser workflow:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Run coverage separately when required:

```bash
pnpm test:coverage
```

## 7. Run a production-style deployment locally

Stop the development server, then run:

```bash
pnpm build
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) again. This uses the optimized production build
instead of the development server.

## 8. Test from a phone on the same network

Only use this on a trusted home or office network.

Start the development server on all network interfaces:

```bash
pnpm dev --hostname 0.0.0.0
```

Find the computer's local IPv4 address:

Windows:

```powershell
ipconfig
```

macOS or Linux:

```bash
ifconfig
```

On a phone connected to the same Wi-Fi network, open:

```text
http://YOUR_COMPUTER_IP:3000
```

For example: `http://192.168.1.25:3000`. If Windows Firewall asks for permission, allow Node.js on
private networks only.

## Updating the local copy

After new changes are merged into `main`:

```bash
git switch main
git pull
pnpm install
pnpm check
```
