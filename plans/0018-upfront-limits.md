# Plan 0018: surface "what this score cannot see" upfront

**Goal:** owner request: the invisible-work and solo-blind-spot caveat is
the single most important context for reading these scores (every audited
repo is solo, and the owner's reviews almost always run as handoff audits
in separate AI sessions that leave no GitHub artifact), and it is
currently buried at the bottom of every surface. Move it to the top.

## Scope (this PR)

- `app/src/site/generate.ts`:
  - Index: a prominent callout directly under the intro, before the
    scoreboard: a fleet-specific lead (all solo, handoff-audit practice,
    attestations carry the owner's unverified account) followed by the
    shared PLAIN_LIMITS copy. Removed from the buried lower position.
  - Report pages: the same callout (generic tool copy only, no
    fleet-specific claims: the tool is portable) directly under the grade
    chip, before the dimension table.
  - CSS: `.callout` accent-bordered box, full-size text.
- `app/src/report/render.ts`: "What this score cannot see" moves above
  "What this score means", right after provenance. Affects future renders
  only; the 9 published reports are not regenerated in this PR.
- `README.md`: one italic line under the scoreboard intro stating the
  same caveat in the owner's voice.
- Honesty rails: the fleet-specific practice claim ("almost always
  handoff audits") is the owner's own statement about the owner's own
  fleet, stated in owner voice on owner surfaces (index intro, README)
  and always tied to "the tool has not verified this" via the
  attestation framing. Generic tool copy stays repo-agnostic.
- Tests: order assertions (limits before scoreboard on the index, before
  the dimension table on report pages, before "What this score means" in
  markdown).

## Verification

- Typecheck, tests, gate green; site rebuild + screenshot check.
- Post-merge: live index shows the callout above the scoreboard.
