# Task List: Kimi GUI MVP

## Task 1: Validate official Kimi integration options

**Description:** Inspect official Kimi repositories and docs to confirm the practical integration path for the MVP, including whether the Kimi Agent SDK can cover the needed beginner workflows, where a CLI fallback would be necessary, and how to isolate the app from rapid upstream CLI and branding changes.

**Acceptance criteria:**
- [ ] Official Kimi capabilities relevant to the MVP are documented
- [ ] SDK-first versus CLI-fallback boundaries are identified
- [ ] The research produces a concrete recommendation for the runtime integration path
- [ ] The app-facing adapter boundary is defined so upstream renames and interface churn stay isolated

**Verification:**
- [ ] Manual check: findings are written into project docs or ADR notes
- [ ] Manual check: recommendation aligns with the MVP scope in the spec

**Dependencies:** None

**Files likely touched:**
- `docs/specs/kimi-gui-mvp.md`
- `docs/adr/0001-runtime-integration.md`

**Estimated scope:** Small: 1-2 files

## Task 2: Define repository skeleton for Electron-based MVP

**Description:** Use the accepted Electron shell decision to define the initial repository skeleton and prepare the project structure for public GitHub development and implementation.

**Acceptance criteria:**
- [ ] The repository structure reflects the accepted Electron-based architecture
- [ ] The repository structure supports frontend, integration, tests, and docs
- [ ] The choice does not overconstrain future migration if needed

**Verification:**
- [ ] Manual check: shell rationale is documented in ADR-0003
- [ ] Manual check: directory structure exists and matches the spec

**Dependencies:** Task 1

**Files likely touched:**
- `docs/adr/0003-desktop-shell.md`
- `src/`
- `src-main/`
- `tests/`
- `e2e/`

**Estimated scope:** Medium: 3-5 files

## Task 3: Define typed runtime contracts

**Description:** Create the core shared types and interface contracts for settings, sessions, action templates, logs, and error states so implementation can proceed without frontend/backend drift and without exposing unstable upstream runtime details directly to the UI.

**Acceptance criteria:**
- [ ] Settings, session, action, log, and error models are defined
- [ ] Frontend/backend contract surface is explicit and typed
- [ ] Core runtime states include idle, loading, streaming, success, and error

**Verification:**
- [ ] Tests pass: shared type validation tests
- [ ] Manual check: contract definitions map cleanly to spec concepts

**Dependencies:** Task 2

**Files likely touched:**
- `src/lib/contracts.ts`
- `src-main/ipc/contracts.ts`
- `tests/unit/contracts.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 4: Scaffold app shell and tooling

**Description:** Bootstrap the frontend app, local integration layer, and shared tooling so the project runs locally with the chosen shell and supports linting, testing, and builds from the start.

**Acceptance criteria:**
- [ ] The app starts locally in development mode
- [ ] Build, lint, and test commands exist
- [ ] Frontend and integration layer are wired through a minimal shell

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: `npm run dev` launches the app shell

**Dependencies:** Task 3

**Files likely touched:**
- `package.json`
- `vite.config.ts`
- `src/app/`
- `src-main/`

**Estimated scope:** Medium: 3-5 files

## Task 5: Implement onboarding flow

**Description:** Build the first-run UI that explains what Kimi is, why an API key is required, and guides the user into configuration without exposing CLI terminology.

**Acceptance criteria:**
- [ ] First-run flow is visible on a clean install
- [ ] Onboarding explains required setup in beginner language
- [ ] The user can reach configuration from onboarding without confusion

**Verification:**
- [ ] Tests pass: onboarding UI tests
- [ ] Manual check: first-run flow works from a clean app state

**Dependencies:** Task 4

**Files likely touched:**
- `src/features/onboarding/`
- `src/components/`
- `tests/unit/onboarding.test.tsx`

**Estimated scope:** Medium: 3-5 files

## Task 6: Implement settings persistence and validation

**Description:** Add API key and basic settings forms, validate user input, and persist settings locally with clear success and failure feedback.

**Acceptance criteria:**
- [ ] Users can enter and save credentials through the GUI
- [ ] Invalid input produces plain-language validation messages
- [ ] Saved settings load correctly when the app restarts

**Verification:**
- [ ] Tests pass: `npm run test -- settings`
- [ ] Manual check: saved settings survive restart

**Dependencies:** Task 5

**Files likely touched:**
- `src/features/settings/`
- `src-main/storage/`
- `tests/unit/settings.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 7: Implement session list and creation flow

**Description:** Add the ability to create a new session, view existing sessions, and switch between them in a layout that is easy for beginners to understand.

**Acceptance criteria:**
- [ ] Users can create a new session from the GUI
- [ ] Existing sessions appear in a clear list
- [ ] Session switching updates the active conversation view

**Verification:**
- [ ] Tests pass: `npm run test -- sessions`
- [ ] Manual check: session creation and switching work locally

**Dependencies:** Task 6

**Files likely touched:**
- `src/features/sessions/`
- `src-main/storage/`
- `tests/unit/sessions.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 8: Implement chat surface with streaming output

**Description:** Build the main conversation UI with prompt input, response rendering, loading states, and streaming feedback so the user can clearly see progress.

**Acceptance criteria:**
- [ ] Users can submit a prompt from the chat surface
- [ ] Streaming or incremental output is rendered clearly
- [ ] Loading and error states are visually distinct

**Verification:**
- [ ] Tests pass: `npm run test -- chat`
- [ ] Manual check: prompt submission and response rendering work locally

**Dependencies:** Task 7

**Files likely touched:**
- `src/features/sessions/`
- `src/components/`
- `tests/unit/chat.test.tsx`

**Estimated scope:** Medium: 3-5 files

## Task 9: Implement runtime adapter for prompt execution

**Description:** Connect the chat surface to the Kimi runtime through the local integration layer, handling request execution, streaming, retries, and state transitions.

**Acceptance criteria:**
- [ ] The app can execute prompts through the approved runtime path
- [ ] Runtime states are mapped to typed UI states
- [ ] Failures are surfaced without crashing the app

**Verification:**
- [ ] Tests pass: integration adapter tests
- [ ] Manual check: end-to-end prompt flow works against the chosen runtime

**Dependencies:** Task 8

**Files likely touched:**
- `src-main/integration/`
- `src/lib/contracts.ts`
- `tests/unit/runtime-adapter.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 10: Implement beginner-friendly action templates

**Description:** Add a small set of high-frequency guided actions that users can trigger without understanding raw commands or advanced configuration.

**Acceptance criteria:**
- [ ] At least 5 high-frequency actions are exposed in the UI
- [ ] Each action uses beginner-readable labels and descriptions
- [ ] Triggering an action produces a visible and predictable result

**Verification:**
- [ ] Tests pass: action template mapping tests
- [ ] Manual check: all shipped actions can be triggered from the GUI

**Dependencies:** Task 9

**Files likely touched:**
- `src/features/actions/`
- `src/lib/action-templates.ts`
- `tests/unit/actions.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 11: Implement error translation and guidance

**Description:** Translate common low-level failures into beginner-readable messages with suggested next steps, while preserving the original technical detail for debugging.

**Acceptance criteria:**
- [ ] Common configuration and runtime failures are translated into plain language
- [ ] Each translated error includes a suggested next step
- [ ] Original technical detail remains available for advanced troubleshooting

**Verification:**
- [ ] Tests pass: error mapping tests
- [ ] Manual check: simulated failures display understandable guidance

**Dependencies:** Task 9

**Files likely touched:**
- `src/lib/error-messages.ts`
- `src/features/logs/`
- `tests/unit/errors.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 12: Implement raw log viewer and advanced mode entry

**Description:** Add a diagnostics surface that exposes raw runtime logs and a clear advanced-mode path without overwhelming beginner users during normal use.

**Acceptance criteria:**
- [ ] Raw logs can be opened from the GUI
- [ ] Advanced-mode entry is discoverable but not dominant
- [ ] Diagnostics do not replace or degrade the beginner flow

**Verification:**
- [ ] Tests pass: diagnostics UI tests
- [ ] Manual check: logs and advanced mode are reachable during runtime

**Dependencies:** Task 11

**Files likely touched:**
- `src/features/logs/`
- `src/app/`
- `tests/unit/logs.test.tsx`

**Estimated scope:** Medium: 3-5 files

## Task 13: Add automated coverage for MVP flows

**Description:** Expand automated verification across unit, integration, and end-to-end layers so the main onboarding and conversation flows are protected from regressions.

**Acceptance criteria:**
- [ ] Core validation and mapping logic has unit coverage
- [ ] Main runtime boundary has integration coverage
- [ ] Main beginner flow has end-to-end coverage

**Verification:**
- [ ] Tests pass: `npm run test`
- [ ] Tests pass: `npm run test:e2e`

**Dependencies:** Tasks 6, 9, 12

**Files likely touched:**
- `tests/unit/`
- `e2e/app/`
- `playwright.config.*`

**Estimated scope:** Medium: 3-5 files

## Task 14: Write onboarding and architecture docs

**Description:** Document how the app is structured, how users configure it, and why the runtime integration path was chosen so future work does not depend on memory.

**Acceptance criteria:**
- [ ] Beginner-facing setup docs exist
- [ ] Architecture notes explain shell and runtime choices
- [ ] Docs reflect the actual MVP behavior

**Verification:**
- [ ] Manual check: docs can be followed from a clean environment
- [ ] Manual check: architecture notes align with implementation

**Dependencies:** Tasks 9, 12

**Files likely touched:**
- `README.md`
- `docs/adr/`
- `docs/specs/`

**Estimated scope:** Small: 1-2 files

## Task 15: Final quality and simplification review

**Description:** Review the implemented MVP for unnecessary complexity, UX drift, missing quality checks, and launch blockers before broader iteration.

**Acceptance criteria:**
- [ ] Obvious complexity that does not serve the MVP is removed
- [ ] Main beginner flow remains clear after all features are integrated
- [ ] Remaining known gaps are documented

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm run test && npm run test:e2e`
- [ ] Manual check: full beginner flow is exercised end-to-end

**Dependencies:** Tasks 13, 14

**Files likely touched:**
- `src/`
- `src-main/`
- `docs/`

**Estimated scope:** Medium: 3-5 files
