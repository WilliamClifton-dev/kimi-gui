# Spec: Kimi GUI MVP

## Assumptions I'm Making
1. This project targets desktop and laptop users, not mobile users.
2. The first release should optimize for beginners and CLI-light users, not power users.
3. The GUI should be driven by a local Node-based integration layer using the Kimi Agent SDK where possible, instead of parsing raw CLI output by default.
4. The first release should cover the highest-frequency 80% of common Kimi usage rather than full parity with any one CLI surface.
5. The project should prefer simple, maintainable architecture over maximum feature breadth.
6. Local-first storage for settings and session metadata is acceptable for the MVP.
7. We can choose the exact desktop shell later, but the product behavior should be designed so it works with either Electron or Tauri.
8. The current repository is effectively greenfield, so we are free to define the initial structure.
9. Human-readable onboarding, error messages, and configuration guidance are core product features, not polish.
10. We do not need team collaboration, cloud sync, or plugin extensibility in the MVP.

## Objective
Build a beginner-friendly local GUI for Kimi that lets users configure credentials, start conversations, access common actions, and understand failures without needing to learn command-line syntax.

### Target Users
- Users who do not understand command-line tools at all
- Users who can code a little but are not comfortable with CLI workflows

### User Problems
- They do not know which commands exist
- They do not know how to configure API keys and related settings
- They cannot easily tell what the tool is doing or why it failed
- They are blocked by command syntax before they can get value from Kimi
- They may be confused by rapid naming and interface changes between `kimi-cli` and `Kimi Code`

### MVP Product Promise
A new user should be able to install the app, configure access, open a conversation, and use common Kimi workflows through visible controls and guided explanations instead of memorizing commands.

## Recommended Product Direction
Use a local GUI with a local integration layer:
- GUI frontend for onboarding, settings, sessions, and guided actions
- Local Node service layer to manage Kimi runtime interaction
- Prefer Kimi Agent SDK integration where feasible
- Keep an advanced view that exposes raw logs and low-level behavior for debugging
- Treat `kimi-cli` and `Kimi Code` as evolving runtimes behind a stable app-facing adapter

This direction is preferred over a thin CLI wrapper because it is more stable, easier to extend, better suited to beginner UX, and more resilient to upstream naming and interface churn.

## Tech Stack
Recommended stack for MVP:
- Frontend: React + TypeScript + Vite
- Desktop shell: Electron for MVP, with architecture kept portable enough for a later Tauri migration if needed
- Styling: CSS modules or scoped CSS with design tokens; avoid heavy UI frameworks initially
- State: Minimal app state with built-in React patterns before introducing a global store
- Local integration layer: Node + TypeScript
- Kimi integration: Kimi Agent SDK where possible; CLI fallback only where required
- Testing: Vitest for unit tests, Playwright for end-to-end flows

## Commands
These are proposed project commands for the implementation phase:

```bash
npm install
npm run dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

Electron-specific commands will be added during scaffolding:

```bash
npm run electron:dev
npm run electron:build
```

## Project Structure
Proposed initial structure:

```text
docs/
  specs/                 -> Product and technical specifications
  adr/                   -> Architecture decision records
src/
  app/                   -> App shell, routes, layout
  features/
    onboarding/          -> First-run setup flows
    settings/            -> API key and configuration UI
    sessions/            -> Conversation list and detail views
    actions/             -> Common action templates and shortcuts
    logs/                -> Raw log viewer and diagnostics UI
  components/            -> Shared UI components
  lib/                   -> Shared utilities and domain helpers
  styles/                -> Design tokens and global styles
src-main/
  integration/           -> Local Kimi runtime integration layer
  storage/               -> Local settings/session persistence
  ipc/                   -> Frontend/backend boundary contracts
tests/
  unit/                  -> Unit tests for validation and mapping logic
e2e/
  app/                   -> End-to-end user flow coverage
tasks/
  plan.md                -> Approved implementation plan
  todo.md                -> Approved task list
```

## Code Style
Principles:
- Prefer small, explicit modules over abstraction-heavy architecture
- Represent user-facing states directly: idle, loading, streaming, success, error
- Translate low-level integration errors into plain-language UI messages
- Keep data contracts typed and narrow at the frontend/backend boundary
- Hide upstream CLI and branding churn behind a stable internal adapter

Example style:

```ts
type CredentialCheck =
  | { status: "valid" }
  | { status: "invalid"; reason: string };

export function validateApiKey(input: string): CredentialCheck {
  const value = input.trim();

  if (!value) {
    return { status: "invalid", reason: "API key is required." };
  }

  if (value.length < 20) {
    return { status: "invalid", reason: "API key format looks incomplete." };
  }

  return { status: "valid" };
}
```

Conventions:
- TypeScript strict mode
- Clear names over abbreviations
- UI copy should be written for non-expert users
- Side effects should stay in the integration layer, not in presentational components

## Testing Strategy
Unit tests:
- Validate settings parsing and validation
- Verify action-template to command/request mapping
- Verify error translation from SDK/CLI failures into user-facing messages
- Verify session state transitions

Integration tests:
- Confirm frontend/backend boundary contracts
- Confirm local persistence for settings and session metadata

End-to-end tests:
- First-run onboarding
- API key setup
- Starting a new session
- Sending a prompt and receiving streaming output
- Recovering from common failures such as missing key or unreachable service

Coverage expectations for MVP:
- High coverage on validation, mapping, and state-transition logic
- Smoke coverage on main user flows
- Visual polish is manually verified in addition to automated checks

## Boundaries
- Always:
  - Keep beginner UX as the primary product constraint
  - Preserve an advanced debugging view with raw logs
  - Verify behavior with tests or real runtime checks before calling work done
  - Keep configuration instructions visible and human-readable
- Ask first:
- Adding heavyweight dependencies or a full UI framework
- Choosing Electron vs. Tauri if the tradeoff impacts scope significantly
- Storing credentials outside standard local secure storage or OS-supported mechanisms
- Supporting full `kimi-cli` or `Kimi Code` parity instead of MVP scope
- Never:
  - Commit real secrets, API keys, or user session data
  - Design the MVP around power-user workflows at the expense of new-user clarity
- Depend solely on brittle terminal text parsing if SDK integration can solve the same need
- Bind the product copy or internal contracts too tightly to upstream CLI naming that is already changing
  - Expand into multi-user sync, plugin ecosystems, or IDE-deep integration in MVP

## MVP Scope
In scope:
- First-run onboarding
- API key configuration and validation feedback
- Basic model and request settings
- Session list and session detail view
- Chat input and streamed response display
- Common action templates for beginner-friendly usage
- Plain-language error messages
- Raw log viewer or diagnostics drawer
- Advanced mode entry point

Out of scope for MVP:
- Full `kimi-cli` or `Kimi Code` command parity
- Plugin or extension marketplace
- Multi-device sync
- Team collaboration
- Complex workflow automation
- Broad IDE integration
- Full MCP-style extensibility

## Success Criteria
The MVP is successful when all of the following are true:

1. A new user can complete initial configuration without opening a terminal.
2. A new user can start a conversation and receive a model response through the GUI.
3. The app exposes a clear path to at least 5 high-frequency actions without requiring command memorization.
4. Common setup and runtime failures are shown in plain language with a suggested next step.
5. The app preserves access to raw logs or low-level details for debugging.
6. The architecture allows later expansion without rewriting the frontend/backend boundary.
7. The product feels simpler than using the CLI directly for the target audience.
8. Upstream CLI or branding changes do not force a redesign of the core UI model.

## Open Questions
1. Which exact 5 to 8 high-frequency actions should ship in MVP after we inspect actual Kimi capabilities?
2. Can the Kimi Agent SDK cover all MVP actions, or do we need a scoped CLI fallback?
3. What is the right secure local storage approach for credentials in the Electron-based architecture?
4. Should session transcripts be persisted by default, or only when the user explicitly saves them?
5. What product naming should we use in the UI so users are not confused by `kimi-cli` versus `Kimi Code` transitions?
