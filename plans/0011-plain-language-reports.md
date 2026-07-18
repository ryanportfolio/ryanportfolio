# Plan 0011: plain-language score explanations + measurement limits

**Goal:** owner feedback on the Phase 3 dry run: "I don't get what the score
is meant to represent" and "does it take account for handoff-audit outputs
given to another session? GitHub wouldn't see that." Every report surface
must spell out, in super plain language, what the score measures, what each
dimension asks, and what the tool cannot see.

## Scope

- `app/src/site/generate.ts` (viewer) and `app/src/report/render.ts`
  (markdown reports) gain three plain-language blocks:
  1. "What this score means": process discipline, not code quality; the
     tool never reads code, only GitHub metadata.
  2. Per-dimension plain question (one line each, e.g. review coverage:
     "of the merged PRs, how many did anyone other than the author look at
     before merge?").
  3. "What this score cannot see": work leaving no GitHub artifact
     (reviews run in separate AI sessions, local audits and test runs),
     and the solo-account blind spot: formal review credit requires a
     non-author reviewer, so a solo owner's fresh-session reviews posted
     from their own account are not counted. Under-measurement is stated,
     never corrected by guessing.
- Regenerate the 10 staged fleet reports from reports/data/*.json (facts
  unchanged, scores unchanged, only prose sections added).
- Tests updated for the new sections. Prose follows the repo voice rules
  (no em dashes).

## Out of scope

Scoring-semantics changes (e.g. counting owner-account comments as review
evidence): owner decision, separately planned if wanted.

## Verification

Suite + evals + gate green (goldens untouched: renderer-only change);
staged reports re-rendered and byte-stable on second run; owner approval
gate on the reports still applies.
