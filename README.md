
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


## Supported Platforms

- ATAK
- CloudTAK
- iTAK
- TAK Aware
- TAKx
- WearTAK
- WebTAK
- WinTAK
- Lattice
- Maven

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


## Example: Validating a CoT XML Event

**Sample XML:**

```xml
<event uid="demo-uid" type="a-f-G-U-C" time="2026-03-05T12:00:00Z" start="2026-03-05T12:00:00Z" stale="2026-03-05T12:05:00Z" how="m-g">
  <point lat="34.1234" lon="-117.1234" hae="0" ce="10" le="10" />
  <detail>
    <contact callsign="ODIN-ATAK" />
    <__group name="Dark Green" role="K9" />
  </detail>
</event>
```

**Expected Output (ATAK platform):**

```
{
  isValid: true,
  errors: [],
  warnings: []
}
```

**Example with a missing <contact> tag:**

```xml
<event uid="demo-uid" type="a-f-G-U-C" time="2026-03-05T12:00:00Z" start="2026-03-05T12:00:00Z" stale="2026-03-05T12:05:00Z" how="m-g">
  <point lat="34.1234" lon="-117.1234" hae="0" ce="10" le="10" />
  <detail>
    <__group name="Dark Green" role="K9" />
  </detail>
</event>
```

**Expected Output (ATAK platform):**

```
{
  isValid: true,
  errors: [],
  warnings: [
    {
      code: 'PLATFORM_TAG_MISSING',
      text: 'ATAK: Missing <contact> tag. Callsign/label rendering in map views.',
      ...
    }
  ]
}
```

---

## API Reference

### validateCoT(xml: string, platform: Platform): ValidationResult

Validates a CoT XML string for required schema and platform-specific tags.

- **xml**: The CoT XML string to validate.
- **platform**: The platform name (e.g., 'ATAK', 'CloudTAK').
- **Returns:** `{ isValid: boolean, errors: ValidationMessage[], warnings: ValidationMessage[] }`

### validateCoTWithProfile(xml: string, platform: Platform, profile: MessageValidationProfile): ValidationResult

Validates a CoT XML string with additional profile-specific requirements.

- **xml**: The CoT XML string to validate.
- **platform**: The platform name.
- **profile**: The message profile object.
- **Returns:** `{ isValid: boolean, errors: ValidationMessage[], warnings: ValidationMessage[] }`

### getMissingTagsForAllPlatforms(xml: string): CrossPlatformMissingTagsResult

Checks which recommended tags are missing for each supported platform.

- **xml**: The CoT XML string to check.
- **Returns:** `{ parseError: ValidationMessage | null, reports: PlatformMissingTagsReport[] }`

See code comments in `src/utils/cotValidator.ts` for detailed type definitions.

## Project Structure

```text
src/
  App.tsx                    Main UI and interaction flow
  utils/
    cotValidator.ts          Core validation and rule matrix
    cotTemplates.ts          Platform starter XML templates
    messageProfiles.ts       Profile definitions and sample messages
```



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
