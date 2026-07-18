# Plan 0021: the owner declaration states the practice as fact

**Goal:** owner decision: D-1's hedged framing ("The tool has not
verified that claim; if the claim is accurate...") is retired. The
practice is real; the owner is the authority on his own practice and has
directed that it be stated as fact.

## Evidence (recorded here so the change is provenance-backed, not spin)

Verified this session, on the owner's machine, from the local Claude
session history (~/.claude/projects): 30 distinct sessions across
roughly 20 projects and worktrees invoked the /handoff-audit skill
(counted by its skill-launch and slash-command markers, not by incidental
mentions). The skill file itself is public in AI-Firmware. The practice
claim is factual and evidenced; what remains true and stays published is
that the deterministic scorer cannot see those sessions and gives them no
score credit.

## Scope (this PR)

- D-1 (index) and the README caveat line state the practice as fact.
  The honest limit moves from epistemic doubt to scoring status: the tag
  becomes NOT SCORED (class renamed accordingly), and the copy says the
  scorer cannot see those sessions and gives them no credit, so the
  review dimensions understate the practice.
- Constraint contract update: dashed amber marker = outside the scored
  evidence. Solid chips = scored grades. Unchanged otherwise.
- Report pages: unchanged. The generic attestation disclaimer ("The tool
  has not verified this and it earns no score credit") stays: the tool is
  portable and cannot vouch for arbitrary third-party owners; that copy
  is tool-voice, not the owner's surface.
- Tests updated to pin the new strings and tag.

## Verification

- Typecheck, tests, gate green; screenshot check; live check post-merge.
