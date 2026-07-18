# Plan 0010: Public-ready pass

**Goal:** make the repo presentable as a public flagship: GitHub description,
topics, and homepage set; README visually upgraded (badges, mermaid pipeline
diagram); every em dash removed from repo-authored prose; wording aligned with
the owner's plain typing-voice rules.

## Scope

- GitHub metadata via `gh repo edit`: description, homepage (Pages viewer),
  ten topics.
- README.md: badges (gate, pages, license), mermaid flowchart replacing the
  ASCII pipeline, em dashes replaced with periods, commas, colons, or
  parentheses. All grounded copy from the 0009 accuracy pass preserved
  verbatim in meaning.
- playbook.md, governance/README.md, plans/0001-0009: punctuation-only em-dash
  removal; no factual or structural changes.
- app/ source, tests, eval runner, workflow comments: em dashes in comments,
  strings, and rendered output replaced. Rendered-title format changed from
  "audit — repo" to "audit: repo"; the null-score site placeholder is now an
  en dash. Tests updated to match.
- Repo-authored skills (homegrown plus reimplemented caveman/humanizer) and
  `.agents` adapters resynced. Two intentional em-dash survivors: the
  humanizer bad-example quote and its parenthetical character mention, which
  exist to name the tell.

## Out of scope

- Forked obra/superpowers skills (stock upstream; editing them creates drift
  against PROVENANCE.md).
- Scoring logic, goldens, fixtures: untouched.

## Verification

- `node scripts/gate.mjs` passes (all README invariants).
- `npm test` 61/61, `npm run typecheck` clean.
- `npm run eval` byte-compared clean after newline normalization; the local
  Windows checkout materializes goldens with CRLF so the raw byte compare
  fails locally, but CI checks out LF and the scored output is unchanged.
- Codex contract checks pass (35 skills).
- Full-repo grep for em dashes returns only the forked skills and the two
  intentional humanizer survivors.
