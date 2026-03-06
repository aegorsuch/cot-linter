# Maintainer Runbook

This document defines repository governance steps that require GitHub admin privileges.

## Branch Protection for `main`

Configure branch protection so required checks are enforced before merge.

1. Open GitHub repository settings.
2. Go to `Settings` -> `Branches`.
3. Under `Branch protection rules`, create or edit the rule for `main`.
4. Enable `Require a pull request before merging`.
5. Enable `Require status checks to pass before merging`.
6. Add these required status checks:
   - `docs-discipline`
   - `quality`
   - `e2e`
7. Enable `Require branches to be up to date before merging`.
8. Save changes.

## CODEOWNERS Enforcement

Ensure CODEOWNERS review requirements are active.

1. In the same branch protection rule, enable `Require review from Code Owners`.
2. Confirm `.github/CODEOWNERS` exists and includes critical path ownership.

## Release Notes Automation

Release Drafter updates draft release notes automatically.

1. Confirm workflow exists at `.github/workflows/release-drafter.yml`.
2. Confirm config exists at `.github/release-drafter.yml`.
3. Ensure Actions are enabled for the repository.
4. Confirm `GITHUB_TOKEN` has default workflow permissions (contents write for this workflow).
5. If no draft appears, run the workflow manually from `Actions` -> `Release Drafter` -> `Run workflow`.

## Changelog Maintenance Policy

1. Keep `CHANGELOG.md` updated using Keep a Changelog format.
2. Add notable changes under `## [Unreleased]` in each PR or release prep batch.
3. Use labels on PRs (`feature`, `fix`, `validation`, `test`, `ci`, `dependencies`) so release drafts categorize correctly.

## Periodic Governance Review

Run this review monthly:

1. Validate branch protection checks are still required.
2. Confirm CODEOWNERS paths still match critical files.
3. Confirm Dependabot and scheduled security audit workflows are passing.
4. Confirm release drafts are generated and readable.

## Policy-Check PR (2-minute validation)

Use a tiny docs-only PR to verify governance remains enforced:

1. Open a PR targeting `main` with a trivial docs edit.
2. Confirm required checks appear and block merge until complete:
   - `docs-discipline`
   - `quality`
   - `e2e`
3. Confirm `Require branches to be up to date` is active by updating `main` and checking the PR requires syncing.
4. Confirm CODEOWNERS review is requested when touching a protected path (for example `src/utils/cotValidator.ts`).
