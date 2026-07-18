# Plan 0001: Phase 0 bootstrap

**Goal:** first PR through the full pipeline loop, with a minimal but real CI gate.

## Scope

- README v1: bio + portfolio links, fleet-audit scoreboard placeholder, statement
  of the experiment ("built exclusively through the pipeline it documents"),
  repo layout map.
- Minimal CI gate (`.github/workflows/gate.yml`): runs `scripts/gate.mjs` on
  every PR. The gate checks real repo invariants (README structure, required
  links, plan-note presence); it is intentionally minimal, not fake. Phase 1
  replaces its core with the Vitest suite.
- This plan note, establishing the plans/ convention: one plan note per PR,
  linked from the PR body.

## Out of scope

- Scoring engine, CLI, tests (Phase 1).
- AI-reviewer workflow, eval lane (Phase 2).
- Fleet audit runs and reports (Phase 3, human-gated).

## Verification

- `node scripts/gate.mjs` passes locally.
- Gate workflow runs green on the PR.
