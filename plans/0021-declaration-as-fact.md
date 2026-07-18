# Plan 0021: the owner declaration states the practice as fact

**Goal:** owner decision: D-1's hedged framing ("The tool has not
verified that claim; if the claim is accurate...") is retired. The
practice is real; the owner is the authority on his own practice and has
directed that it be stated as fact.

## Evidence (recorded here so the change is provenance-backed, not spin)

Verified this session, on the owner's machine, from local agent session
history. Two runtimes, because the owner runs the skill in both:

- Claude Code (~/.claude/projects): roughly 29 distinct sessions by the
  slash-command / skill-launch markers, concentrated in about 7 projects
  (over half in Extract-Video-Wisdom; the rest across range, kbase,
  Corewise.Academy, tracebench, claude-starter).
- Codex (~/.codex/sessions): the original count omitted this runtime
  entirely; the owner flagged the gap. Re-checked with a cleaner,
  tool-agnostic signal: the distinctive skill-body line "single fenced
  markdown block" appears only when the SKILL.md is loaded into a
  session, so it does not match catalog listings. That signal finds 6
  Codex sessions (Extract-Video-Wisdom, Resume x2, firewall,
  claude-starter, kbase) and, applied to Claude for consistency, 34
  Claude sessions: about 40 skill-body loads across both runtimes.

Caveats: the raw file-mention counts (hundreds per runtime) are dominated
by skill-catalog listings and git file dumps and are NOT usage; only the
marker / body-load signals above are. The grep-marker method also admits
quoted-mention false positives (the pipeline session that ran the count
matches itself), so figures are approximate. The counts prove the
practice is real and recurrent across both tools, not a proportion of all
reviews. The "almost always" characterization is the owner's own
statement about his own practice, made in first person on owner-voice
surfaces only. The skill file itself is public in AI-Firmware. What
remains true and stays published is that the deterministic scorer cannot
see those sessions and gives them no score credit.

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
