# Plan 0008: Recruiter-facing report viewer on GitHub Pages

**Goal:** a hosted visual surface for the fleet audit (scoreboard + one
page per repo report) deployed automatically from `main`. Resolves the
report-hosting open decision as GitHub Pages (owner opted in by requesting
the UI).

## Design

- `app/src/site/generate.ts`: pure functions `ScoreReport[] → HTML`
  (index with scoreboard + dimension bars, one page per repo) plus a small
  build entry that reads `reports/data/*.json` and writes `site/dist/`.
  No frameworks, no external assets; deterministic static HTML/CSS,
  system fonts, works offline. Honest empty state when no reports exist
  ("fleet audit pending; reports publish only after owner approval").
- `app/src/fleet.ts`: additionally writes `reports/data/<repo>.json`
  (the ScoreReport: aggregates only, same privacy envelope as the
  markdown) so the site builds from data, not parsed markdown.
- `.github/workflows/pages.yml`: on push to `main`, build the site and
  deploy via the official Pages actions. `npm run build:site` locally.
- README: viewer link added to the scoreboard section.

## Testing

Unit tests on the pure generators: scoreboard rows and links, HTML
escaping, dimension bar widths, could-not-verify rendering, empty state.

## Out of scope

Populating `reports/` (Phase 3, per-report owner approval). Any server-side
runtime.

## Verification

Typecheck, tests, evals, gate green; `npm run build:site` produces
`site/dist/index.html` locally; Pages deploy verified after merge (needs
Pages enabled on the repo; flagged if the API call is refused).
