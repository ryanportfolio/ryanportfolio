# Plan 0020: first-person declaration + showcase the handoff-audit skill

**Goal:** owner request: the D-1 declaration must speak in first person
("My reviews almost always run as...") since it is the owner's own
statement, and the custom /handoff-audit skill behind that practice
should be showcased, not just alluded to.

## Grounding

The skill is real and public:
AI-Firmware/.claude/skills/handoff-audit/SKILL.md (verified via the
GitHub API this session). It drafts a single self-contained audit prompt
the owner pastes into a fresh session with zero context, and charges that
session to falsify the work, not rubber-stamp it. Copy describing it must
match that file; nothing invented.

## Scope (this PR)

- `app/src/site/generate.ts`: D-1 text rewritten in first person; the
  attribution now lives in the clause label ("Owner's declaration") plus
  the voice itself, and the conditional honesty framing stays ("The tool
  has not verified that claim; if the claim is accurate..."). clauseRow
  gains an optional reference link rendered after the detail line; D-1
  uses it to link the public skill file.
- `README.md`: the caveat line links the same skill file with a one-line
  accurate description.
- Tests: assertions updated to the first-person string; new assertion
  pins the skill link on the index and its absence on report pages
  (portability rail).

## Verification

- Typecheck, tests, gate green; screenshot check; live check post-merge.
- Known accepted risk (review finding): the skill link targets blob/main,
  a mutable ref in another repo; the published description can drift if
  that file changes and no CI here would notice. Owner-accepted in favor
  of always pointing at the current skill; revisit if the skill is
  reworked.
