# Release Checklist

Use this checklist before publishing the repository update or cutting a release tag.

## Product Check

- Verify first-run setup still works from a clean local state.
- Verify a `kimi` session can be created and a prompt can be sent.
- Verify streamed text appears during a real Kimi response.
- Verify the approval panel appears and can continue a paused request.
- Verify the diagnostics report can be opened and copied.

## Quality Check

- Run `npm run test`
- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`

## Repo Check

- Run `npm run audit:publish` and confirm only ignored local artifacts are reported.
- Confirm any secret-like matches are expected test fixtures before publishing.
- Update `README.md` if screenshots or shipped capabilities changed.
- Update `CHANGELOG.md` with user-visible additions.
- Confirm `docs/current-status.md` still matches the product.
- Include screenshots or a short recording if the UI changed materially.

## Release Notes Seed

Suggested MVP summary:

- Beginner-first desktop GUI for Kimi workflows
- Real Kimi SDK-backed session execution
- Streamed output, runtime activity logs, and in-app approvals
- Quick action templates and copyable diagnostics reports
