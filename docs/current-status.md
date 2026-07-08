# Current Status

## Product Direction

- Beginner-first Kimi coding workspace
- Public GitHub-facing project, but must still have real user value
- Learn product shape from Claude Code, not visual cloning

## Key Decisions

- Electron for MVP
- SDK-first runtime adapter
- Provider profiles instead of a single hard-coded Kimi key
- Kimi provider can use real runtime path
- Compatible providers remain placeholder for now

## What Works Now

- Public repo basics: README, LICENSE, CONTRIBUTING, roadmap, issue templates
- GitHub automation:
  - CI workflow for test, typecheck, lint, build, publish audit, and dependency audit
  - Dependabot for npm and GitHub Actions updates
- Onboarding and settings UI
- Provider selection:
  - Kimi
  - OpenAI
  - DeepSeek
  - Anthropic
  - Gemini
- Local settings persistence
- Session list / create / open flow
- Prompt input and conversation layout
- Five beginner-friendly quick action templates
- Runtime adapter seam
- Kimi SDK-backed execution path
- Real Kimi incremental text streaming from main process to renderer
- Live runtime activity log for streamed Kimi sessions
- GUI approval actions for paused Kimi runtime requests
- Expandable diagnostics report with copy support
- Runtime error mapping
- Runtime health check:
  - CLI available
  - login state
  - configured model

## Important Files

- `AGENTS.md`
- `docs/specs/kimi-gui-mvp.md`
- `docs/current-status.md`
- `src/app/App.tsx`
- `src/lib/settings.ts`
- `src/shared/contracts.ts`
- `src-main/main.ts`
- `src-main/integration/runtime-adapter.ts`
- `src-main/integration/config-bridge.ts`
- `src-main/integration/runtime-health.ts`

## Current Limitation

- Kimi runtime path supports approve/reject in the GUI, but only for the current pending approval request
- Compatible providers do not have real execution paths
- GUI settings are bridged into runtime env/model input, but not fully synced into Kimi CLI config files

## Next Mainline Task

Deepen runtime coverage and GitHub-ready documentation.

Target:
- expand runtime activity coverage beyond the current event subset
- support richer approval options such as session-wide approval when appropriate
- keep GitHub-facing docs and automation aligned with the shipped MVP
- keep placeholder path for compatible providers
