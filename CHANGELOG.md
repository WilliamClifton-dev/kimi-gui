# Changelog

All notable changes to this project will be documented in this file.

The format is intentionally simple and human-readable.

## [Unreleased]

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
