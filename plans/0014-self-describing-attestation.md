# Plan 0014: self-describing JSON attestations + index link cleanup

**Goal:** close the PR #13 review's remaining findings. The published JSON
artifacts carried the owner attestation as a bare string, so a direct JSON
consumer received an owner claim stripped of its not-verified/not-scored
qualification; the label lived only in the renderers. Also: the reports
index linked `../reports/<name>.md` from inside `reports/`.

## Scope

- `PublicReport.attestation` becomes
  `{ text, verified: false, scored: false } | null`: the qualification
  travels inside the artifact itself. Renderers and site accept the new
  shape; key-set and passthrough tests updated.
- `reports/data/*.json` regenerated with the new shape (same owner-approved
  text, scores byte-identical). Covered by the owner's Phase 3 approval:
  no content changes, only the self-describing wrapper.
- Reports index links become plain `<name>.md`.
- `commits_per_week` small-window skepticism (review nit 3) is deferred to
  its own change; flagged as a follow-up task.

## Verification

Tests + evals + gate green; regenerated JSON diff shows only the
attestation wrapper; site rebuilt and spot-checked.
