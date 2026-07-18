# Plan 0003 — Phase 2a: independent AI reviewer + eval lane

**Goal:** the two remaining pipeline lanes — adversarial fresh-context AI
review on every PR, and a deterministic eval harness in the gate.

## AI reviewer (`.github/workflows/ai-review.yml`)

- Runs on every non-draft PR via the Claude Code GitHub Action (default
  recommendation from the open decisions; swap to a direct API call is a
  one-file change if Ryan prefers).
- Fresh context by construction: the action starts with no builder session
  state — it sees only the diff, the repo, and its instructions.
- Adversarial prompt: refute, don't approve. Checks plan-note linkage, scope
  vs plan, scoring determinism, the collection privacy boundary, honesty
  rails, and test coverage of changed behavior.
- Posts a PR review comment; it has no merge or approval power. Merging
  stays human-only.
- Inert until `ANTHROPIC_API_KEY` repo secret is configured (steps skip with
  a visible notice) — Ryan action required.
- LLM use stays in the review lane only, per the hard rules.

## Eval lane (`app/eval/`)

- Golden-report evals: synthetic `RepoFacts` fixtures (a disciplined repo, a
  sloppy repo, a thin-signal repo) with committed expected `ScoreReport`
  JSON. `npm run eval` re-scores fixtures and byte-compares against goldens.
- Determinism eval: each fixture scored twice, byte-identical required.
- Wired into the gate workflow after unit tests. Scoring changes that shift
  any score force an explicit, reviewed golden update in the same PR.

## Verification

- `npm run eval` green locally; gate workflow runs it.
- Reviewer workflow YAML validated; live run requires the repo secret
  (flagged in PR — cannot be verified from this environment).
