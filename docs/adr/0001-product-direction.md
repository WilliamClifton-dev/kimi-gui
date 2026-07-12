# ADR-0001: Position the product as a beginner-first Kimi coding workspace inspired by Claude Code

## Status
Superseded by ADR-0005

## Date
2026-07-08

## Context
We are building a GUI around the evolving Kimi coding-agent ecosystem. The original idea started as "make a GUI for `kimi-cli`," but upstream naming and interface changes are already in motion.

Official Kimi sources now describe the runtime as `Kimi Code CLI`, not just `kimi-cli`. The README states that Kimi Code CLI is an AI coding agent that runs in the terminal, can read and edit code, run shell commands, search files, fetch web pages, configure MCP, use plugins, dispatch subagents, and integrate with editors through ACP.

Source:
- https://github.com/MoonshotAI/kimi-code/blob/main/README.md

Official Kimi SDK sources also state that `Kimi Agent SDK` exposes the `Kimi Code (Kimi CLI)` agent runtime in applications, reuses CLI configuration and tools, streams responses, surfaces approvals, and supports programmatic orchestration.

Source:
- https://github.com/MoonshotAI/kimi-agent-sdk

The product reference point raised in planning is `Claude Code`. Its README positions it as an agentic coding tool that lives in the terminal, understands the codebase, helps execute routine tasks, explains code, handles git workflows, and supports plugins.

Source:
- https://github.com/anthropics/claude-code/blob/main/README.md

This creates a product decision:
- Option A: build a thin GUI wrapper around a specific CLI command surface
- Option B: build a stable, beginner-first Kimi coding workspace that takes inspiration from Claude Code's product model while using Kimi's runtime and ecosystem

Because upstream Kimi surfaces are changing, Option A would couple the product too tightly to unstable command names and runtime details.

## Decision
We will position this project as a beginner-first **Kimi coding workspace**, not as a skin for one specific CLI brand or command set.

The product direction is:
- Learn from `Claude Code` at the product-model level
- Build a Kimi-native GUI experience for beginners
- Use a stable internal runtime adapter to isolate upstream `kimi-cli` / `Kimi Code` churn
- Prefer Kimi Agent SDK as the primary integration path
- Preserve access to advanced runtime behavior without making it the default user experience

In practical terms, this means:
- The UI should present workflows, not raw commands
- The core mental model is "Kimi helps me work on code," not "I must know terminal syntax"
- Product naming should prefer stable user-facing language like `Kimi GUI` or `Kimi Workspace` until branding is finalized
- Frontend contracts must not mirror upstream command names one-to-one

## What We Intend To Learn From Claude Code
- Agent-first product framing instead of chatbot framing
- Codebase-oriented workflows instead of isolated prompt boxes
- Natural-language task execution as the primary interaction model
- Plugin and extension awareness as future architecture pressure
- Coexistence of beginner and advanced workflows in the same product

## What We Explicitly Will Not Copy
- A terminal-first UI as the main beginner experience
- Full feature parity in MVP
- Branding, copy, or command semantics that belong specifically to Anthropic products
- Tight coupling to upstream CLI syntax or TUI behavior

## Alternatives Considered

### 1. Thin wrapper around `kimi-cli`
- Pros:
  - Fastest path to a visible prototype
  - Lowest initial implementation complexity
- Cons:
  - High breakage risk during upstream migration
  - Forces UI concepts to follow CLI concepts too closely
  - Makes beginner UX weaker because terminal constraints leak upward
- Rejected because:
  - It optimizes for speed of scaffolding, not stability or product quality

### 2. Full Claude Code clone with Kimi backend
- Pros:
  - Clear benchmark
  - Strong market familiarity for technical users
- Cons:
  - Overly broad scope for a two-person project
  - Risks copying the reference product's shell instead of solving beginner needs
  - Encourages premature parity chasing
- Rejected because:
  - We need product inspiration, not product imitation

### 3. Generic AI desktop chat app
- Pros:
  - Simpler UI
  - Easier to ship early
- Cons:
  - Loses the coding-agent differentiation of Kimi Code
  - Makes later tool/action/plugin workflows feel bolted on
- Rejected because:
  - It would underuse the actual strengths of the Kimi runtime

## Consequences
- We need a stable internal runtime adapter from day one
- We should design the UI around sessions, tasks, actions, approvals, and diagnostics instead of command flags
- We can start with a small beginner MVP without promising upstream feature parity
- We must keep room for future advanced capabilities such as ACP, MCP, plugins, and subagents, but they stay out of initial scope
- Documentation and product copy need to avoid brittle references to one upstream CLI name

## Follow-up Decisions Required
- ADR for runtime integration strategy: SDK-first versus CLI fallback
- ADR for desktop shell choice: Electron versus Tauri
- ADR for credential storage strategy
