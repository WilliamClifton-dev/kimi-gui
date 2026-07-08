# ADR-0003: Choose Electron as the first desktop shell

## Status
Accepted

## Date
2026-07-08

## Context
The MVP needs a desktop shell for a local beginner-first Kimi coding workspace. The most likely candidates are Electron and Tauri.

Project constraints:
- The project is currently maintained by one human with limited technical experience plus agent assistance
- The MVP prioritizes fast iteration, stable local integration, and beginner UX over minimal binary size
- The app needs a local runtime adapter that can orchestrate Kimi Agent SDK behavior, stream events, surface approvals, persist settings, and expose diagnostics
- The repository is being prepared for public GitHub development, so maintainability and contributor approachability matter

Official Electron docs describe Electron as a framework that uses a multi-process architecture inherited from Chromium, with a main process and renderer processes. The official getting-started docs recommend starting from the tutorial or Electron Forge.

Sources:
- https://electronjs.org/docs/latest/tutorial/process-model
- https://electronjs.org/docs/latest/tutorial/tutorial-first-app
- https://electronjs.org/docs/latest/tutorial/tutorial-prerequisites

Official Tauri docs describe Tauri 2 as a toolkit that works with any frontend stack and uses a Rust backend plus webview rendering. The docs also document a capability-based security model and explicit permission configuration for running sidecars or spawned child processes.

Sources:
- https://v2.tauri.app/start/
- https://v2.tauri.app/concept/architecture/
- https://v2.tauri.app/security/
- https://v2.tauri.app/security/capabilities/
- https://v2.tauri.app/develop/sidecar/
- https://v2.tauri.app/start/prerequisites/

For this product, both shells are viable. The decision is not about which framework is "better" in general. It is about which one is more appropriate for the first public MVP.

## Decision
We will use **Electron** as the first desktop shell for the MVP.

## Rationale

### Why Electron fits the current project better
- The runtime adapter is already naturally Node-oriented, which aligns well with Electron's main-process model.
- Electron keeps the early implementation almost entirely in the JavaScript and TypeScript toolchain, which reduces the amount of new platform knowledge required at the start.
- The MVP needs fast iteration on local orchestration, logs, settings, and event streaming more than it needs the smallest possible binary.
- Electron is easier to explain and modify for contributors who are already comfortable in the web and Node ecosystem.

### Why Tauri is not the first choice for this MVP
- Tauri's Rust-backed model is attractive, but it adds another language and toolchain to a project that is still defining product behavior.
- Tauri's capability and sidecar permission model is useful, but it introduces extra setup complexity for exactly the parts of this app that need to orchestrate local runtime behavior.
- The MVP does not yet benefit enough from Tauri's size and security posture to offset the increased implementation and maintenance complexity.

## What This Decision Means
- The first scaffold should use a React + TypeScript frontend with an Electron main process
- The local Kimi runtime adapter should live in Electron's main-side layer, not in the renderer
- The renderer should communicate through a narrow typed bridge rather than direct unrestricted Node access
- The app should still preserve architectural boundaries so a later Tauri migration remains possible if needed

## Migration Stance
This decision is for the first shell only. It is not a permanent rejection of Tauri.

If the product later needs:
- smaller packaged binaries
- stricter capability-level security controls
- more polished native distribution tradeoffs

then a later ADR can revisit the shell choice once the runtime adapter and UI contracts have stabilized.

## Alternatives Considered

### 1. Tauri as the first shell
- Pros:
  - Smaller binaries
  - Strong security and capabilities model
  - Good long-term fit for native-like desktop distribution
- Cons:
  - Higher setup and mental overhead for this stage
  - Requires Rust in the core path of an app still being defined
  - Adds friction around child-process and sidecar behavior that this app is likely to rely on early
- Rejected because:
  - It optimizes for later-stage concerns before the product model is stable

### 2. Browser-only local web app
- Pros:
  - Lowest initial complexity
  - Fastest way to prototype UI
- Cons:
  - Weak fit for local desktop workflows, credential handling, and runtime orchestration
  - Harder to package as the beginner-friendly desktop product we want
- Rejected because:
  - It is a useful prototype path, but not the right MVP shell for the target product

## Consequences
- We accept a heavier packaged app in exchange for faster product iteration
- We should keep the renderer/main boundary strict so Electron convenience does not turn into architectural sprawl
- We can scaffold faster and stay in one primary language ecosystem
- We should document a future migration path rather than pretending the first choice is final forever

## Follow-up Decisions Required
- Credential storage strategy within the Electron-based architecture
- Initial project scaffold and command layout
