# Plan 0013: Phase 3 fleet report publication

**Goal:** publish the owner-approved fleet audit. The owner reviewed all 10
rendered reports (local viewer + markdown) and approved publication on
2026-07-18 ("approve").

## Scope

- `reports/`: 10 markdown reports, 10 public JSON artifacts (allowlist
  projection), and the index. 9 non-pipeline reports carry the owner
  attestation about fresh-session review practice.
- `README.md`: scoreboard block filled by the fleet run (10 rows,
  score-descending).
- No app or workflow changes. Scores are honest and unflattering ones stay
  in (three repos grade Early; fleet-wide recorded-review coverage is
  near zero, stated on every report).

## Provenance

Fleet run 2026-07-18 with an owner-scoped token, collection limits 300
commits / 50 merged PRs per repo. Reports re-rendered after the
plain-language (PR #11) and measurability (PR #12) passes; scores
byte-identical across re-renders. Excluded repos are absent by hard rule.

## Verification

Gate green; privacy check: reports contain aggregate metrics, provenance,
and owner attestations only. Post-merge: Pages deploy green, live viewer
shows 10 reports, profile README shows the scoreboard.
