
# CoT-Linter

[![View Source on TAK Forge](https://img.shields.io/badge/TAK%20Forge-Canonical%20Repository-181717?style=flat-square)](https://git.tak.gov/aegorsuch/cot-linter)

A web-based Cursor-on-Target (CoT) XML linter for fast schema checks, platform compatibility checks, and profile-specific validation.

This project is built with React, TypeScript, and Vite, and is designed to help operators and developers quickly identify CoT payload issues before deployment.

## Project Information

### Rights

Unlimited Rights granted to TAK Product Center.

### Point of Contact

Alex Gorsuch on chat.tak.gov or Signal.

### Repositories

The TAK Forge repository is canonical. GitHub is a secondary repository:

- [TAK Forge (canonical)](https://git.tak.gov/aegorsuch/cot-linter)
- [GitHub (secondary)](https://github.com/aegorsuch/cot-linter)

## What It Does

- Validates CoT XML structure and required core schema attributes.
- Flags blocking issues (hard fails) with line and column locations.
- Flags non-blocking platform compatibility warnings for missing platform tags.
- Supports profile-driven validation for specific message styles.
- Checks pasted outbound CoT against a selected target platform without claiming client interoperability from structural checks alone.


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

Each platform has a rule matrix of recommended detail tags (for example `contact`, `__group`, `takv`, `usericon`, `track`, `remarks`). These generic hints are shown for SA events; other message types require their own profile.

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

## CoT Examples

The **CoT examples** picker includes six project-provided WearTAK samples already in this repository (SA, chat, point drop/clear, and manual alert/clear). Their original capture provenance is not recorded, so they are not labeled verified captures.

It also contains 11 sanitized adaptations of published test data: ATAK-style SA, alerts and alert clear, markers, waypoint, circle, and video feed; plus WinTAK-style SA and chat. Each public example links directly to its original source. The bulk come from [FreeTAKTest's CoT examples](https://github.com/FreeTAKTeam/FreeTAKTest/tree/main/TestData/COT_examples) (EPL-2.0); the WinTAK SA example is adapted from a [PyTAK test fixture](https://github.com/snstac/pytak/blob/main/tests/test_takmsg2xml.py) (Apache-2.0).

Choose a source platform and event type, then load an example or paste outbound XML. Select the target platform and run **Check target compatibility**. The compatibility matrix and target report are generated from the same input and selections. Editing the XML or changing a selector or timestamp option clears the report; validate again to see results for the updated input. The result shows XML errors, timestamp warnings, source profile mismatches, and any known target profile requirements. Without a target profile, the result explicitly says display/clear behavior is unverified. A single clear event cannot establish whether it refers to an earlier point or how the receiver handled it. Combinations without an example cannot be loaded, but pasted XML can still be checked.

The public fixtures are **source-backed examples, not verified captures**. They do not establish which client emitted every message; some platform labels are inferred from identifiers or payload fields. UIDs, callsigns, locations, endpoints, and message contents were replaced; timestamps are historical and therefore stale. Passing this linter's structural checks does not prove that a TAK client will accept or produce an example. For verified templates, collect and review authorized captures with the client version and action recorded.

## UI Highlights

- Source, event type, and target selectors with example loading.
- A target report that separates known XML/profile errors from unverified client behavior.
- Template submission modal for missing target profiles.

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
