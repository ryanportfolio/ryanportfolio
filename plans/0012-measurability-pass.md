# Plan 0012: measurability pass (relabel, review-lane activation path, attestations)

**Goal:** owner decision: his real review practice (fresh-session handoff
audits) leaves no GitHub artifacts, and he does not want a bad score for
unmeasurable work. Approved approach: keep scores honest, then (1) label
review dimensions as measures of the *recorded* trail, (2) provide the
subscription-token path that makes future reviews leave artifacts, (3) add
clearly-labeled, unscored owner attestations to reports.

## Scope

1. **Relabel**: `review_coverage` label becomes "Recorded review coverage",
   `review_catch_rate` becomes "Recorded review catch rate"; plain-meaning
   copy gains "It scores only what is recorded on GitHub."; the two plain
   questions say "recorded review". Keys, weights, and math unchanged.
   Golden reports regenerate (label strings only; scores byte-identical),
   justified here.
2. **Review-lane activation path**: `ai-review.yml` accepts
   `CLAUDE_CODE_OAUTH_TOKEN` (subscription auth via `claude setup-token`)
   as an alternative to `ANTHROPIC_API_KEY`; playbook gains a "Making solo
   review measurable" section. Token creation and secret-setting stay
   owner-only actions; this PR only wires the workflow to use them.
3. **Attestations**: local fleet config gains an optional per-repo
   `attestations` map. The public report projection gains an `attestation`
   field (allowlist + key-set tests updated). Markdown reports and site
   pages render it under an explicit label: owner-stated, not verified,
   not scored. Absent attestation renders nothing.

## Out of scope

Scoring-semantics changes (weights, null-vs-zero rules): unchanged by
explicit owner decision. Wiring other repos' workflows.

## Verification

Typecheck, tests, evals (with justified golden regeneration), gate green;
staged fleet reports re-rendered with attestations for the owner's
approval gate; second render byte-stable.
