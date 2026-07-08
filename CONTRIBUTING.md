# Contributing

Thanks for contributing to Kimi GUI.

## Project Principles

- Keep the product beginner-first.
- Prefer stable app-facing contracts over direct upstream CLI coupling.
- Do not expand scope casually. MVP discipline matters more than feature count.
- Preserve room for future Kimi-native workflows such as MCP, plugins, and advanced diagnostics.

## Local Development

1. Install dependencies:
   - `npm install`
2. Start the web renderer:
   - `npm run dev`
3. Start the Electron app during local desktop work:
   - `npm run electron:dev`
4. Verify before opening a PR:
   - `npm run test`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run build`

## Contribution Scope

Good first contribution areas:
- onboarding UX copy
- settings validation
- session layout improvements
- beginner-facing error messages
- docs and roadmap clarity

Ask first before changing:
- runtime adapter contracts
- desktop shell decisions
- credential storage behavior
- major dependencies or build tooling

## Pull Requests

- Keep PRs focused on one logical change.
- Explain why the change is needed, not just what changed.
- Include screenshots or short screen recordings for UI changes when possible.
- Link to the relevant spec, ADR, task, or issue.

## Docs To Read First

- [README.md](README.md)
- [docs/specs/kimi-gui-mvp.md](docs/specs/kimi-gui-mvp.md)
- [docs/adr/0001-product-direction.md](docs/adr/0001-product-direction.md)
- [docs/adr/0002-runtime-integration.md](docs/adr/0002-runtime-integration.md)
- [docs/adr/0003-desktop-shell.md](docs/adr/0003-desktop-shell.md)
- [tasks/plan.md](tasks/plan.md)
