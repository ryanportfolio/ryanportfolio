# Plan 0021: the owner declaration states the practice as fact

**Goal:** owner decision: D-1's hedged framing ("The tool has not
verified that claim; if the claim is accurate...") is retired. The
practice is real; the owner is the authority on his own practice and has
directed that it be stated as fact.

## Evidence (recorded here so the change is provenance-backed, not spin)

Verified this session, on the owner's machine, from local agent session
history. Two runtimes, because the owner runs the skill in both. All
figures are approximate; the signals and their known false positives are
stated so the count can be re-audited, not trusted blind.

- Codex (~/.codex/sessions): the original count omitted this runtime
  entirely; the owner flagged the gap. Checked with a tool-agnostic
  body-load signal: the distinctive skill-body line "single fenced
  markdown block" lands in a session only when the SKILL.md is loaded, so
  it excludes catalog listings. 6 Codex sessions match
  (Extract-Video-Wisdom, Resume x2, firewall, claude-starter, kbase).
- Claude Code (~/.claude/projects): the same body-load signal finds 34
  sessions. A stricter slash-invocation marker
  (`<command-name>/handoff-audit`) finds 14; an earlier looser count put
  it near 29. Treat 14 as the floor of clean slash invocations and the
  body-load figure as the wider "skill was loaded" set.

False positives, per the independent review of this PR (do not read the
raw numbers as clean usage):

- The body-load signal also fires when the SKILL.md is being edited, not
  run. The claude-starter match in BOTH runtimes is an authoring session
  (that repo is where the skill lives), not an audit; subtract one per
  runtime before reading these as usage.
- The signal self-increments: any session that greps or quotes the phrase
  matches, including this pipeline's own review sessions. Excluding those
  self-matches, the Claude body-load set is about 32.
- Raw file-mention counts (thousands per runtime for bare "handoff-audit",
  and even literal "/handoff-audit", which sits in the skill's own
  description line) are catalog noise from the always-loaded skills list,
  NOT usage. Only the marker and body-load signals count.

Net: genuine invocations are in the low tens across both runtimes,
concentrated in Extract-Video-Wisdom with a real spread across range,
kbase, Corewise.Academy, firewall, Resume, and others. That proves the
practice is real and recurrent across both tools; it does not measure a
proportion of all reviews. The "almost always" characterization is the
owner's own statement about his own practice, made in first person on
owner-voice surfaces only. The skill file itself is public in AI-Firmware.
What remains true and stays published is that the deterministic scorer
cannot see those sessions and gives them no score credit.

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
