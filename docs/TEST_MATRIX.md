# Testing and quality review

## Browser and device matrix

| Profile                 | Engine                     | Coverage              |
| ----------------------- | -------------------------- | --------------------- |
| Chrome desktop          | Chromium                   | Full end-to-end suite |
| Edge-compatible desktop | Chromium                   | Core smoke journey    |
| Firefox desktop         | Firefox                    | Core smoke journey    |
| Safari desktop          | WebKit                     | Core smoke journey    |
| Android mobile          | Chromium, Pixel 5 viewport | Core smoke journey    |
| iOS mobile              | WebKit, iPhone 13 viewport | Core smoke journey    |

The full Chromium suite covers tool behavior, navigation, persistence, PWA behavior, feedback, and accessibility checks. The cross-browser journey verifies the application shell, command search, tool navigation, and theme switching on every supported profile.

## Review findings

| ID    | Area                  | Impact                                                    | Severity | Fix                                                                       | Regression test         |
| ----- | --------------------- | --------------------------------------------------------- | -------- | ------------------------------------------------------------------------- | ----------------------- |
| Q-001 | Base64 image previews | Object URLs could remain allocated after leaving the tool | Medium   | Revoke preview URLs during replacement and unmount                        | `base64-tool.test.tsx`  |
| Q-002 | Browser coverage      | Engine-specific regressions could reach production        | High     | Add Chromium, Firefox, WebKit, Edge-compatible, Android, and iOS profiles | `cross-browser.spec.ts` |

## Reviewed areas

- Core navigation, command search, theme persistence, responsive layouts, and tool workflows
- Loading, empty, error, and offline states
- Clipboard, download, file upload, and destructive reset actions
- Keyboard reachability, focus visibility, labels, landmarks, contrast, and motion preferences
- Listener, timer, object URL, and client-state cleanup
- Client/server boundaries, request validation, security headers, and privacy exclusions

## Local validation

```bash
pnpm check
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
```

Record any real-device-only findings with the same ID, impact, severity, fix, and regression-test fields before release.
