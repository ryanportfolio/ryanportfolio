# Plan 0019: viewer info sections become audit clauses, not prose walls

**Goal:** owner request: the viewer is also a design showpiece, and large
walls of text are banned. The upfront caveat (PR 0018) currently renders
as four stacked paragraphs.

## Conceit (derived from the subject, not decoration)

The site presents an audit. Audit documents structure caveats as numbered
clauses: scope, exclusions, declarations. So:

- "What this score cannot see" renders as an EXCLUSIONS clause list
  (E-1, E-2, E-3), each row a short scannable label plus the full
  approved sentence as a small detail line. No meaning is dropped;
  the wall is.
- The owner-practice statement renders as a DECLARATION row (D-1) with
  an explicit UNVERIFIED tag, visually distinct from tool clauses.
- "What this score means" renders as SCOPE clauses (S-1, S-2, S-3).
- The footer compresses to segmented mono spec lines, links kept.

## Constraint contract

- Accent blue: tool voice and structure. Amber (the existing developing
  token): unverified owner claims only. No other semantic color use.
- Mono uppercase: clause numbers, tags, labels only. Serif: content.
- Info sections: no paragraph block over two rendered lines except
  clause detail lines, which are intentionally small and secondary.

## Scope (this PR)

- `app/src/report/plain.ts`: limits and meaning become structured items
  (id, label, text). PLAIN_LIMITS / PLAIN_MEANING re-derive from the
  items so the markdown renderer output is byte-identical.
- `app/src/site/generate.ts`: clause components replace the paragraph
  callout and meaning sections on index and report pages; footer
  restructured; CSS for clause rows and the UNVERIFIED tag.
- Tests: full detail sentences still asserted (no meaning loss), plus
  clause-structure assertions (numbering present, declaration tagged
  unverified, markdown output unchanged by the refactor).
- Additions from the independent design critique of the first render
  (fresh-context reviewer, rendered screenshots): declaration ordered
  after the exclusions and trimmed of a redundant clause; provenance
  line becomes a document-control colophon (commit, collected, sample,
  status); report grade chip becomes a rotated double-border stamp;
  scoreboard rows gain dotted ledger leaders and mono report links;
  section glyph is the section sign, not a sparkle; clause numbers are
  self-link anchors with a :target highlight; method box becomes clause
  M-1; Early gets a distinct ink from Developing; dark muted text and
  light Early contrast re-measured above AA; dimension table stacks on
  mobile; unverified bars drop the track so absence looks like absence.
  The caveat stays above the scoreboard: owner decision from plan 0018
  outranks the critic's ordering preference; the compaction answers the
  same concern.

## Verification

- Typecheck, tests, evals, gate green; markdown renderer output proven
  unchanged; screenshot passes (desktop light/dark, mobile) plus an
  independent design-lens critique of the rendered pages; adversarial
  PR review before merge; live check after.
