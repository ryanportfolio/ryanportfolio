# Plan 0017: retire the ryanportfolio/local report

**Goal:** owner deleted the repo ryanportfolio/local (it was an old copy of
another repo), so its published audit report is retired.

## Scope (this PR)

- Delete `reports/local.md` and `reports/data/local.json`.
- Remove the ryanportfolio/local row from the README scoreboard block and
  from `reports/README.md`.
- No other rows, scores, or copy change. Remaining reports keep their
  pinned commits; nothing is re-collected.
- Local (gitignored) `app/fleet.config.json` drops the repo from the
  include list so future fleet runs skip it.

## Verification

- Gate green (README invariants, tests untouched).
- Post-merge: audit.corewise.academy index lists 9 reports and
  /local.html returns 404.
