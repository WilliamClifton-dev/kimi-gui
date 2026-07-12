# Implementation Plan: Kimi Code Beginner Companion

## Objective

Validate one promise: a Chinese beginner can inspect the local Kimi Code environment, choose a project, and launch the official Kimi Web UI without typing terminal commands.

## Phase 1: Environment Doctor

- Define a typed health report with CLI version, login state, configured model, and actionable Chinese guidance.
- Detect the real local runtime without exposing shell output directly to the renderer.
- Support refresh so users can repair outside the app and check again.

## Phase 2: Project Launcher

- Select an existing project directory through the native folder picker.
- Validate the selected path before execution.
- Launch `kimi web --no-open` in that directory, then open its local URL when ready.
- Return structured launch failures with a safe next step.

## Phase 3: Beginner UI

- Replace the current chat-first home with a quiet three-step flow: check, choose, launch.
- Keep existing chat/runtime code frozen during validation; do not delete it yet.
- Make diagnostics visible without showing secrets.

## Verification

- Unit tests cover health mapping, path validation, command construction, and failure translation.
- `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- Packaged Electron app completes the flow against a local Kimi installation.

## Boundaries

- Do not reimplement official Kimi Web sessions or chat.
- Do not use CDP injection or copy AGPL code from Codex++.
- Do not add Rust, Tauri, MCP, plugins, provider rotation, or automatic installation in this slice.
- Never expose API keys in renderer data, logs, diagnostics, screenshots, or tests.
