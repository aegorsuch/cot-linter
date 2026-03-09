
# CoT-Linter

[![View Source on GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github&style=flat-square)](https://github.com/aegorsuch/cot-linter)

A web-based Cursor-on-Target (CoT) XML linter for fast schema checks, platform compatibility checks, and profile-specific validation.

This project is built with React, TypeScript, and Vite, and is designed to help operators and developers quickly identify CoT payload issues before deployment.

## What It Does

- Validates CoT XML structure and required core schema attributes.
- Flags blocking issues (hard fails) with line and column locations.
- Flags non-blocking platform compatibility warnings for missing platform tags.
- Supports profile-driven validation for specific message styles.
- Compares missing tags across all supported platforms side-by-side.
- Copies missing tag comparison reports as JSON or Markdown for sharing.

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

The app includes profile-based validation for message types, including:

- Chat Send
- SA
- MIL-STD-2525D Point Drop
- MIL-STD-2525D Point Clear
- Manual Alert
- Manual Alert Clear

Selecting a profile updates validation requirements and can load a sample message for that profile.

## UI Highlights

- Platform Rule Matrix selector for platform-specific behavior.
- Starter template loader per platform.
- Profile selector with sample payload loading.
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

## Usage

1. **Select Event Type:** Use the "Event Type" dropdown to choose the message profile you want to validate against.
2. **Paste or Load XML:** Paste your CoT `<event>...</event>` XML into the input area, or use the "Load" button in the compatibility matrix to insert a starter template for a specific platform/profile.
3. **Validate:** Click "Validate CoT in Compatibility Matrix Below" to run validation.
4. **Review Results:** The compatibility matrix below will show missing tags and template status for each platform.
5. **Submit Template:** If a template is missing for a platform, use the "Submit Template" button to open the submission modal, fill in details, and submit your XML for review.
6. **Iterate:** Edit your XML and re-validate as needed. The UI updates results in real time.

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


## Known Issues & Limitations

- Validation is rule-based and not a full external XSD validation pipeline.
- Platform checks focus on presence of key detail tags, not full semantic correctness of each tag payload.
- No end-to-end (E2E) tests are included; only unit and integration tests are present.
- UI does not currently support accessibility features (e.g., screen reader labels, keyboard navigation for all controls).
- Error handling for malformed XML is basic; some edge cases may not show user-friendly messages.
- Lattice and Maven always appear in the compatibility matrix, even if no profiles exist for them.
- The app does not persist user input or validation state between reloads.
- Only a subset of platforms and profiles are supported; others may require manual extension.
- Empty input intentionally shows an empty comparison baseline across platforms.


## License

See `LICENSE`.
