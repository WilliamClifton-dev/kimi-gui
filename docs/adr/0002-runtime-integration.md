# ADR-0002: Use an SDK-first runtime adapter with scoped CLI fallback

## Status
Accepted

## Date
2026-07-08

## Context
The product is intended to be a beginner-first Kimi coding workspace, not a thin wrapper around one unstable command surface. Upstream Kimi naming and interfaces are evolving from `kimi-cli` toward `Kimi Code CLI`, which increases the cost of coupling the GUI directly to terminal syntax or raw output formats.

Official Kimi sources describe `Kimi Code CLI` as a terminal AI coding agent with code editing, shell execution, web fetch, MCP support, plugins, subagents, lifecycle hooks, and editor integration through ACP.

Source:
- https://github.com/MoonshotAI/kimi-code/blob/main/README.md

Official Kimi Agent SDK sources describe the SDK as a programmatic interface to the Kimi CLI/runtime that:
- reuses the same Kimi configuration, tools, skills, and MCP servers
- streams responses in real time
- surfaces approvals and tool calls
- supports orchestration from applications

Source:
- https://github.com/MoonshotAI/kimi-agent-sdk
- https://github.com/MoonshotAI/kimi-agent-sdk/blob/main/node/agent_sdk/README.md

The Node SDK event model includes streamed content and runtime-level events such as `ContentPart`, `ToolCall`, `ToolResult`, `SubagentEvent`, and `StatusUpdate`, which are directly useful for a GUI that needs streaming output, status indicators, approval UX, and diagnostics.

Source:
- https://github.com/MoonshotAI/kimi-agent-sdk/blob/main/node/agent_sdk/README.md

We need to choose between three strategies:
- Option A: CLI-first integration by spawning terminal commands and parsing output
- Option B: SDK-first integration with a stable internal adapter and narrow CLI fallback
- Option C: pure SDK integration with no fallback path

## Decision
We will implement a **stable internal runtime adapter** and make it **SDK-first**, with a **scoped CLI fallback** only for capabilities the SDK cannot yet cover in the MVP.

### Chosen shape
- Frontend talks only to an app-owned runtime adapter
- The runtime adapter exposes stable app-facing contracts for:
  - settings and credential validation
  - session creation and session state
  - prompt execution and streaming output
  - tool/approval/log events
  - action-template execution
- The adapter prefers Kimi Agent SDK for execution
- CLI fallback is allowed only behind the adapter and only for explicitly documented gaps

### Why this is the right default
- SDK events are structurally better for GUI state than parsing terminal text
- SDK integration is more resilient to upstream branding and command churn
- The adapter lets us preserve a beginner-friendly model even if upstream concepts change
- A narrow fallback avoids blocking MVP progress if one or two workflows are SDK-incomplete

## App-Facing Runtime Contract Principles
- The UI must not depend on raw command flags or terminal output formats
- The UI should model user intent and runtime state, not terminal mechanics
- Runtime state should be explicit:
  - `idle`
  - `validating`
  - `ready`
  - `streaming`
  - `awaiting_approval`
  - `completed`
  - `failed`
- Raw diagnostics must remain available, but they are secondary to translated beginner UX

## Allowed MVP CLI Fallback Cases
CLI fallback is allowed only when all of the following are true:
- The capability is needed for the MVP
- The SDK cannot support it cleanly yet
- The fallback can be isolated behind the adapter
- The fallback behavior is documented so it can be removed later

Examples of acceptable fallback categories:
- configuration introspection if SDK coverage is incomplete
- one-off runtime metadata access required for setup or diagnostics

Examples of unacceptable fallback categories:
- building the whole chat/session path on top of terminal text parsing
- exposing raw command construction directly to the user as the main UI model
- relying on unstable TUI interaction as the core control path

## Alternatives Considered

### 1. CLI-first integration
- Pros:
  - Potentially faster to prototype
  - Closer to the current terminal surface
- Cons:
  - High fragility under upstream changes
  - Harder to model streaming, approvals, and nested events cleanly
  - Pushes terminal semantics into the UI model
- Rejected because:
  - It would optimize for short-term scaffolding over stable product architecture

### 2. Pure SDK integration with no fallback
- Pros:
  - Cleanest architecture
  - Lowest long-term complexity
- Cons:
  - Can block MVP if one required capability is not exposed yet
  - Raises the risk of analysis paralysis while waiting for upstream completeness
- Rejected because:
  - A small, controlled fallback path is a better risk-management tradeoff for an early product

## Consequences
- We need to design the adapter boundary before building detailed UI flows
- Session, event, log, and approval models should mirror app needs instead of SDK internals one-to-one
- We can swap or refine the underlying runtime path later without rewriting the whole frontend
- We must document every fallback so it does not silently become permanent architecture
- Testing should focus heavily on contract mapping and state transitions

## Follow-up Decisions Required
- Desktop shell choice: Electron versus Tauri
- Credential storage strategy
- Exact MVP action list after first runtime spike
