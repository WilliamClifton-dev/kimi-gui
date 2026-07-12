# Changelog

All notable changes to this project will be documented in this file.

The format is intentionally simple and human-readable.

## [Unreleased]

## [0.2.1] - 2026-07-12

### Fixed
- Added explicit `.js` extensions to Electron main-process imports so packaged apps start under Node ESM rules
- Added a packaging regression test that rejects extensionless runtime imports

## [0.2.0] - 2026-07-10

### Added
- Chinese-first interface copy, runtime guidance, quick actions, and repository documentation
- Windows installer and portable builds through `electron-builder`
- Tag-driven GitHub Actions workflow that attaches Windows builds to Releases
- Branded application icon and refreshed Chinese product screenshot

### Fixed
- Corrected the packaged Electron main-process entry and production renderer path

## [0.1.0] - 2026-07-09

### Added
- Initial product spec, ADRs, and implementation plan
- Electron + React + TypeScript scaffold
- First-run onboarding and settings flow scaffold
- GitHub-facing repository documents and collaboration templates
- Real Kimi SDK-backed session execution path
- Streamed assistant text updates in the desktop UI
- Runtime activity logs and GUI approval handling
- Five built-in quick action templates for beginner workflows
- Expandable diagnostics report with copy support
- Publish safety audit with workspace scanning for ignored local artifacts and likely leaked API keys
- GitHub Actions CI workflow for test, typecheck, lint, build, publish audit, and dependency audit
- Dependabot updates for npm packages and GitHub Actions

### Changed
- Upgraded Electron to `43.1.0` to clear the previous high-severity audit finding
