# CoT-Linter

A web-based Cursor-on-Target (CoT) XML linter for fast schema checks, platform compatibility checks, and profile-specific validation.

This project is built with React, TypeScript, and Vite, and is designed to help operators and developers quickly identify CoT payload issues before deployment.

## What It Does

- Validates CoT XML structure and required core schema attributes.
- Flags blocking issues (hard fails) with line and column locations.
- Flags non-blocking platform compatibility warnings for missing platform tags.
- Supports profile-driven validation for specific message styles.
- Compares missing tags across all supported platforms side-by-side.
- Copies missing tag comparison reports as JSON or Markdown for sharing.
- Includes browser-based E2E coverage for key UI workflows.

## Supported Platforms

- ATAK
- CloudTAK
- iTAK
- TAK Aware
- TAKx
- WearTAK
- WebTAK
- WinTAK

Each platform has a rule matrix of recommended detail tags (for example `contact`, `__group`, `takv`, `usericon`, `track`, `remarks`).

## Validation Model

The linter has two result classes:

- Hard Fails (blocking):
  Missing required CoT structure and profile-required fields. These set `isValid` to `false`.
- Compatibility Warnings (non-blocking):
  Missing platform-specific recommended tags. These do not block validity by themselves.

Core schema checks include:

- Required `<event>` attributes: `uid`, `type`, `time`, `start`, `stale`, `how`
- Required `<event>` children: `point`, `detail`
- Required `<point>` attributes: `lat`, `lon`, `hae`, `ce`, `le`

Profile checks (when selected) can also enforce:

- Expected event `type`
- Additional required event attributes
- Specific required tags inside `<detail>`

## Message Profiles

The app includes profile-based validation for WearTAK message types, including:

- MIL-STD-2525D Point Drop
- MIL-STD-2525D Point Clear
- Manual Alert
- Manual Alert Clear
- Chat Send

Selecting a profile updates validation requirements and can load a sample message for that profile.

## UI Highlights

- Platform Rule Matrix selector for platform-specific behavior.
- Starter template loader per platform.
- Profile selector with sample payload loading.
- UI regression tests cover ATAK profile template button-loading flows.
- Template submission modal with a single `Submit GitHub Issue` action and auto-close on submit.
- Diagnostic click-to-jump that focuses the input and highlights the relevant line.
- Cross-platform missing-tag comparison cards.
- Copy report buttons:
  - `Copy Missing Tags JSON`
  - `Copy Missing Tags Markdown`

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Then open the local Vite URL shown in your terminal.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

### Typecheck

```bash
npm run typecheck
```

### Unit Tests

```bash
npm test
```

### Unit Test Coverage

```bash
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

Optional interactive UI mode:

```bash
npm run test:e2e:ui
```

### Full Verification Gate

```bash
npm run verify:all
```

This runs lint, typecheck, coverage-threshold tests, production build, Playwright E2E, and high-severity npm audit.

### Security Audit

```bash
npm run security:audit
```

## CI

GitHub Actions runs quality gates on push and pull request:

- README discipline check on pull requests for user-facing file changes.
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:coverage`
- `npm run build`
- Production preview smoke test
- `npm run test:e2e` (Chromium via Playwright)

Additional automation:

- Weekly Dependabot updates for npm and GitHub Actions (`.github/dependabot.yml`).
- Weekly scheduled high-severity npm audit (`.github/workflows/security-audit.yml`).
- Draft release notes automation via Release Drafter (`.github/workflows/release-drafter.yml`).

## Branch Protection

Set branch protection for `main` in GitHub repository settings and require these checks before merge:

- `docs-discipline`
- `quality`
- `e2e`

Also enable `Require branches to be up to date before merging`.

Maintainer setup checklist: `docs/MAINTAINERS.md`.

## Changelog and Releases

- Project changelog is maintained in `CHANGELOG.md` using Keep a Changelog format.
- Release Drafter composes draft release notes from merged pull requests and labels.

## Usage

1. Choose a platform from the rule matrix.
2. Optionally choose a message profile.
3. Paste CoT XML into the input area, or load a starter/profile sample.
4. Review hard fails and warnings in the status panel.
5. Click any diagnostic item to jump to the related XML location.
6. Use the cross-platform section to compare missing tags.
7. Copy a missing-tags report in JSON or Markdown format for sharing.
8. Use `Submit Template` to open the submission modal, enter metadata and XML, then click `Submit GitHub Issue` (the modal auto-closes after launch).

## Project Structure

```text
src/
  App.tsx                    Main UI and interaction flow
  utils/
    cotValidator.ts          Core validation and rule matrix
    cotTemplates.ts          Platform starter XML templates
    messageProfiles.ts       Profile definitions and sample messages
```

## Report Output Notes

The copied missing-tags report includes:

- Generation timestamp
- Selected platform and profile
- Aggregate summary counts
- Per-platform missing tags with descriptions and suggestion snippets

If clipboard APIs are unavailable in the browser context, the app uses a fallback copy mechanism.

## Known Limitations

- Validation is rule-based and not a full external XSD validation pipeline.
- Platform checks currently focus on presence of key detail tags, not full semantic correctness of each tag payload.
- Empty input intentionally shows an empty comparison baseline across platforms.

## License

See `LICENSE`.
