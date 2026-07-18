# Plan 0004: Phase 2b: report renderer + fleet runner

**Goal:** turn `ScoreReport` JSON into publishable markdown, and add the
local fleet runner that Phase 3 uses to audit the whole portfolio.

## Renderer (`app/src/report/`)

- `render.ts`: `ScoreReport` → one markdown report. Aggregate metrics and
  provenance only; renders from facts-derived scores, which already cannot
  contain source excerpts (privacy boundary is upstream at collection).
  Includes a methodology + "could not verify" section.
- `scoreboard.ts`: rows → scoreboard table, `reports/README.md` index, and
  README profile-scoreboard replacement between explicit HTML markers.
- README gains `<!-- scoreboard:start/end -->` markers around the
  placeholder table so regeneration is deterministic and diff-reviewable.

## Fleet runner (`app/src/fleet.ts`)

- Reads a **local, gitignored** `app/fleet.config.json` (include + exclude
  lists). Committed `fleet.config.example.json` shows the shape with
  placeholder names only: private repo names, including excluded ones,
  must not be committed by the tool's config scaffolding.
- Refuses to run without an explicit `exclude` array (forces the
  do-not-feature decision to be stated locally, per fleet audit rules).
- Writes `reports/<repo>.md`, `reports/README.md` index, updates the README
  scoreboard block. Publication remains human-gated: output lands in the
  working tree and reaches the public repo only through a Ryan-merged PR.

## Testing

- Renderer unit tests: content assertions (grade, unverified section,
  truncation notes) + a leak check that rendered output contains no
  fixture body text fields.
- Scoreboard marker replacement: deterministic and idempotent.

## Out of scope

Actual fleet run and report publication (Phase 3, human-gated). Governance
page + playbook (next PR).
