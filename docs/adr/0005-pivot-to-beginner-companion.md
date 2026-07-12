# ADR-0005: Pivot to a beginner companion for Kimi Code

## Status

Accepted

## Date

2026-07-12

## Context

ADR-0001 chose a beginner-first Kimi coding workspace rather than a thin CLI wrapper. Since then, the official Kimi Code CLI has shipped a substantial Web UI with sessions, approvals, file mentions, Plan mode, tool output, model controls, Git changes, queues, and responsive layouts.

Building another full coding workspace now duplicates upstream functionality and forces this small project to track a rapidly changing protocol and feature set. The remaining user problem is earlier in the journey: Chinese beginners struggle to install, log in, configure providers, select a project, understand failures, and reach their first successful task.

## Decision

Reposition this project as a Chinese-first local beginner companion for Kimi Code.

The app will:

- diagnose installation, login, configuration, model, network, and permission state
- guide setup with plain Chinese explanations and actionable recovery
- let users select a project folder visually
- launch the official Kimi Web, CLI, or editor integration
- provide a small set of first-task recipes and explain approval risk
- avoid owning a duplicate chat/session implementation where the official runtime already provides one

The first validation slice is environment diagnosis plus project launch. No broader redesign proceeds until this slice is tested with target users.

## Alternatives Considered

### Continue the full desktop workspace

Rejected. Most visible value already exists in official `kimi web`; maintenance and parity pressure would dominate.

### Build a generic multi-provider coding client

Rejected. This competes with mature clients and weakens the Kimi-specific beginner promise.

### Stop the project immediately

Not selected yet. The onboarding and recovery gap appears real, but must be validated with five target users before further investment.

### Contribute only to upstream Kimi Code

Valid fallback. Prefer this if upstream accepts the same onboarding features or independent maintenance proves unjustified.

## Consequences

- ADR-0001 and the original MVP spec remain historical context and are superseded by this decision.
- Existing chat/runtime code is not deleted during validation; it is frozen to avoid premature migration work.
- Multi-provider execution, advanced sessions, MCP, and plugin UI leave MVP scope.
- Product success is measured by time-to-first-success and completion rate, not feature count.
- The repository may become smaller. That is acceptable if its user value becomes clearer.

## References

- `docs/ideas/kimi-code-beginner-companion.md`
- Official Kimi Web reference: `D:/Projects/kimi-cli-main/docs/zh/reference/kimi-web.md`
- Official getting started guide: `D:/Projects/kimi-cli-main/docs/zh/guides/getting-started.md`
