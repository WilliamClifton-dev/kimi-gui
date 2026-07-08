# Kimi GUI Agent Context

## Project

Kimi GUI is a beginner-first local desktop GUI for the Kimi coding runtime.

Primary product goal:
- make Kimi Code style workflows approachable for users who are not comfortable with terminal tools

Secondary goal:
- keep the repository strong enough to serve as a public GitHub portfolio project

## Tech Stack

- React 19
- TypeScript 5
- Vite 7
- Electron 37
- Vitest
- ESLint
- `@moonshot-ai/kimi-agent-sdk`

## Commands

- Dev renderer: `npm run dev`
- Dev desktop: `npm run electron:dev`
- Test: `npm run test`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Build: `npm run build`

## Architecture

- `src/`
  - renderer UI
- `src-main/`
  - Electron main-side code
  - local storage
  - runtime adapter layer
- `src/shared/`
  - contracts shared between renderer and main-side code
- `docs/adr/`
  - major architectural decisions
- `docs/specs/`
  - MVP specification
- `tasks/`
  - implementation plan and task list

## Product Decisions Already Made

- Product direction:
  - beginner-first Kimi coding workspace, inspired by Claude Code at the product-model level
- Runtime strategy:
  - SDK-first with scoped CLI fallback
- Desktop shell:
  - Electron for MVP
- Provider setup:
  - use provider profiles, not just a single Kimi key
- Provider modes:
  - `kimi-native`
  - `compatible`

See:
- `docs/adr/0001-product-direction.md`
- `docs/adr/0002-runtime-integration.md`
- `docs/adr/0003-desktop-shell.md`
- `docs/adr/0004-provider-profiles.md`

## Current Functional State

Implemented:
- public repo basics: README, LICENSE, CONTRIBUTING, CHANGELOG, issue templates
- onboarding/settings UI
- provider selection UI for:
  - Kimi
  - OpenAI
  - DeepSeek
  - Anthropic
  - Gemini
- local settings persistence
- session list / create / open flow
- prompt input and conversation layout
- five beginner-friendly quick action templates
- runtime adapter seam in `src-main/integration/runtime-adapter.ts`
- real Kimi adapter branch using `@moonshot-ai/kimi-agent-sdk`
- real Kimi incremental text streaming from main process to renderer
- live runtime activity log for streamed Kimi sessions
- GUI approval actions for paused Kimi runtime requests
- expandable diagnostics report with copy support
- placeholder adapter branch for non-Kimi providers
- settings-to-runtime bridge in `src-main/integration/config-bridge.ts`
- UI runtime note surface for success/failure messaging

Not implemented yet:
- real runtime execution for non-Kimi providers
- secure credential storage
- config file synchronization with Kimi CLI config
- diagnostics/logs UI
- advanced mode / MCP / plugin UI

## Important Boundaries

- Do not bind renderer logic directly to upstream CLI command syntax
- Keep execution logic behind the runtime adapter
- Prefer small vertical slices over large refactors
- Do not promise full Kimi-native feature parity for compatible providers
- Do not add major dependencies without reason

## Current Runtime Behavior

- Kimi provider:
  - tries real execution through `@moonshot-ai/kimi-agent-sdk`
  - passes model and env bridge values
  - failures are translated into user-facing runtime notes
- Other providers:
  - still use placeholder execution path

## Likely Next Steps

1. Improve Kimi config bridge
   - decide whether GUI settings should remain env overrides only or sync into Kimi config files
2. Improve real Kimi execution UX
   - better failure states
   - clearer login / CLI-not-found guidance
3. Expand streamed runtime coverage and richer approval options
4. Refresh README visuals and shipped-MVP documentation
5. Consider real compatible-provider runtime paths

## Files Worth Reading Before Editing

- `README.md`
- `docs/specs/kimi-gui-mvp.md`
- `tasks/plan.md`
- `tasks/todo.md`
- `src/app/App.tsx`
- `src-main/main.ts`
- `src-main/integration/runtime-adapter.ts`
- `src-main/integration/config-bridge.ts`
- `src/lib/settings.ts`
- `src/shared/contracts.ts`

## Testing Rule

After any non-trivial change, run:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
