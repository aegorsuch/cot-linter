# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Canonical verification command `npm run verify:all` for lint, typecheck, coverage, build, E2E, and security audit.
- CI quality hardening with docs discipline, type checks, coverage thresholds, production smoke check, and E2E gates.
- Playwright reliability settings for CI retries and richer failure artifacts.
- Dependabot configuration for weekly npm and GitHub Actions updates.
- Scheduled weekly high-severity npm audit workflow.
- CODEOWNERS protections for critical validator logic and workflow automation paths.
- Release drafter automation for draft release notes generated from merged pull requests.
