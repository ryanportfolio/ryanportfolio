# Plan 0002: Phase 1: scoring engine + CLI

**Goal:** deterministic scoring core, GitHub API collector, CLI. Vitest suite in CI.

## Design

Two-layer split, enforced by module boundaries:

- **Collect** (`app/src/collect.ts`, `app/src/github.ts`): GitHub REST API →
  normalized `RepoFacts`. No cloning. Injectable fetch for testing. Privacy is
  enforced at this layer: facts hold derived aggregates and booleans only;
  never commit-message bodies, PR titles/bodies, file contents, or diffs. What
  the collector doesn't retain, the report can't leak.
- **Score** (`app/src/score/`): pure functions `RepoFacts → ScoreReport`. No
  network, no clock, no LLM. Same facts → same score, byte-for-byte.

## Dimensions (draft weights)

| Key | What | Score basis |
|-----|------|-------------|
| `agent_attribution` | provenance of commits (human login / bot identity / co-author trailer) | % commits attributable; agent share + throughput reported as context metrics |
| `review_coverage` | merged PRs with ≥1 review not by the PR author | % |
| `review_catch_rate` | reviewed PRs with commits after first review, before merge | % |
| `human_merge_gate` | merges performed by a non-bot account | % |
| `ci_gate` | workflows present + check-run pass history on merged PRs | composite |
| `batch_size` | median PR diff size (additions+deletions) | banded |
| `lead_time` | median first-commit→merge | banded |
| `plan_evidence` | PR bodies referencing an issue or plan doc | % |
| `audit_trail` | PR description substance + review + check records present | composite |

Rollup: weighted mean over scorable dimensions; unverifiable dimensions score
`null` ("could not verify"), are excluded, and weights renormalize; never
guessed. Banded grades: Elite / Strong / Developing / Early / Ad-hoc.

## CLI

`agentic-audit <owner>/<repo> [--json <file>]`: collect (token from
`GITHUB_TOKEN`/`GH_TOKEN` env if present), score, print summary table.

## Testing

- Scoring: pure-function unit tests on fixture facts (the bulk of the suite).
- Agent/bot detection: unit tests.
- Collector: unit tests with stubbed fetch (recorded-shape responses).
- CI: gate workflow adds `npm ci && npm test && npm run typecheck` in `app/`.

## Out of scope

Web UI, report renderer (Phase 2). AI-reviewer workflow (Phase 2). Fleet runs
(Phase 3).
