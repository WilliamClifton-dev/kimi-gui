# Task List: Kimi Code Beginner Companion

- [x] Define environment and launch contracts
  - Acceptance: renderer receives only structured, secret-free data
  - Verify: typecheck and contract tests

- [x] Implement testable Kimi environment doctor
  - Acceptance: reports CLI version, login, model, severity, and Chinese next action
  - Verify: unit tests for ready, missing, and broken configurations

- [x] Implement native project selection and Kimi Web launch
  - Acceptance: validates directory and starts official runtime without a shell
  - Verify: unit tests plus local runtime check

- [x] Replace home with three-step beginner flow
  - Acceptance: user can check, choose, and launch without command input
  - Verify: browser and packaged-app smoke test

- [x] Run release quality gates
  - Acceptance: tests, typecheck, lint, build, and secret audit pass
  - Verify: project commands and manual review
