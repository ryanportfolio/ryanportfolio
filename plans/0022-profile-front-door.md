# Plan 0022: split the profile front door from the audit tool's own page

**Goal:** owner decision. `ryanportfolio/ryanportfolio` is the GitHub profile
README *and* the audit tool's README. One file was doing both jobs, so the
profile front door read as a spec sheet for a scoring tool rather than as a
portfolio. Split the two surfaces and rebuild the front door as a visual page.

## What moves where

- `README.md` becomes the profile front door: shipped work first, the review
  method second, links last. It is what a stranger sees on the profile page.
- `AUDIT.md` becomes the audit tool's surface: the fleet matrix, the scoreboard,
  the scored dimensions, the experiment, the layout, the method. Nothing is lost;
  the prose moves across largely intact.

## Owner direction taken during the build

- "Engineering proof" reads as defensive; the section is just **Engineering**.
- Prototypes get a real image linking to `fullbuild.ai/prototype`, not a text line,
  and individual prototypes are not enumerated.
- The 0/100 review-coverage panel came off the front door. It was reading as the
  headline when the interesting thing is *how* the reviews run. The zero survives
  as one clause in the method paragraph, and the full treatment lives in AUDIT.md.
- Custom art, in the reference site's register, rather than more prose.

## Why the front door still mentions the zero at all

Removing it entirely would have been the flattering edit. The method paragraph
now says the scorer records zero for review work and publishes it rather than
weighting around it, which is the same disclosure in one sentence instead of a
panel. AUDIT.md keeps the full version.

## Honesty constraints held

- No adoption or user-count claims anywhere. The owner's instruction was to stay
  silent on that, so the copy describes what each thing does and nothing more.
- Every asserted number is recomputed from `reports/data` at build time.
- Product cards use real captures of the running products. Generated art is used
  only where there is nothing to photograph: the two drafting illustrations.

## Build and verification

- `scripts/profile/` regenerates both pages. Each step verifies its own counts
  and exits non-zero on mismatch: panel numbers against `reports/data`, one card
  per inventory item, every referenced asset present on disk, every inventory
  item linked exactly once, scoreboard rows against report count.
- `app/src/fleet.ts` now writes the scoreboard into `AUDIT.md`. Left pointed at
  `README.md` it would have thrown on the next fleet run, since
  `updateReadmeScoreboard` requires the markers.
- `scripts/gate.mjs` follows the split: README keeps its product-link checks and
  gains MAIMCOIL and the prototypes CTA; the scoreboard and experiment checks now
  target AUDIT.md, and the markers are asserted so the fleet run cannot silently
  lose its injection point.
- Rendered in a specimen harness built on GitHub's own markdown API and CSS, at
  880px light, 880px dark, and a real 390px viewport.

## Known unverified at merge time

SVG animation in the masthead, and the `max-width` media query that serves the
phone variants, both survive GitHub's markdown API sanitizer. Neither has been
observed on a live GitHub profile page. First push is the test; if camo or the
profile render path drops either, the page degrades to a static wide panel rather
than breaking.

## Second pass, after the page went live

Owner review of the live profile drove these:

- **The review method became a drawing.** Three paragraphs describing a handoff
  audit and a cross-vendor review are now one animated panel: one diff, two
  passes sweeping it from opposite ends, each marking the lines it flagged on its
  own side. The prose under it shrank to the two skill links and the CTA.
- **The panel asserts no numbers.** The 0/100 review-coverage line came off it
  entirely. Scorer behaviour is the audit tool's subject and belongs on AUDIT.md,
  so `NEED` in panels.mjs no longer lists the review panel: there is nothing on it
  to recheck.
- **Motion that anyone actually sees.** The masthead draw-in was measured on the
  live page and it does run; it is simply a one-shot that finishes in under a
  second, so the panel is already static by the time a reader looks. Both panels
  now carry a looping element as well, which is the part that reads as alive.
- **Reduced motion was broken and is fixed.** `animation:none` alone left the
  rules at full dash offset and the nodes transparent, so a reader who asks for
  reduced motion got a masthead with its lines missing. The media query now
  restores the end state.
- **Panels fill their container** via `width="100%"`, and the hero and review
  illustrations link to fullbuild.ai rather than to themselves.
- **Harness Firmware got a CTA** in the review section, described by what it
  actually does: the reference library the agent writes pitfalls back into.
- **Two product captures were retaken** at 1920 wide against owner-supplied
  reference framings, replacing a sparse Kine Fractal shot and a CoreWise shot
  with an announcement bar across it.
- **The Elsewhere footer went.** Two of its three links were already cards in the
  grid, so it was duplicating the page. What replaced it points at fullbuild.ai
  and the about page, neither of which appears elsewhere.

### Still unverified

The looping animation and the narrow-variant media queries are verified in a
local specimen at 1x and 2x, not on the live profile. Headless Chromium advances
an `<img>`-hosted SVG clock only as it paints, so captured frames land earlier in
the loop than wall-clock time suggests; that is a capture artifact, not a defect.
First push is the real test.

## Third pass: the pipeline speaks the site's language

The five-box rail was the diagram any generator draws. fullbuild.ai states its
process as a sentence with one cycling slot and a drawn mark
(`idea → design → engineering → ⟨audit⟩ ⟳ shipped`), so the masthead now uses the
same construction: `plan → build → ⟨audit⟩ → ci ⟳ merged`, cycling the site's own
four words, audit / iterate / refine / harden.

- The underline is the site's `greenline`, same construction: fifteen points, a
  sine wobble along the run, a 0.8 degree tilt, drawn over 340ms on the same
  easing. Amplitude and stroke scale with the type instead of staying at the
  hero's fixed 4px, which at 13px would have read as a bar.
- The loop is drawn, not `U+27F3`. That glyph is missing from plenty of system
  monospace fonts and would have fallen back to a blank or a box.
- Word widths come from the monospace advance, which is what makes a per-word
  underline length computable at build time without a font engine.

### Contract amendment

The accent was reserved for the honest gap. It now also carries the review mark on
the front door. The mark that says "this is being worked" and the mark that says
"the instrument went blind here" are the same idea, so they share the one colour
and nothing else uses it.

### Masthead copy

The Steam game came out of the positioning line. Appending it to a list made the
line carry an inventory item, which reads as padding however it is worded, and two
attempts to reword it did not fix that. MAIMCOIL is a product card with a real
capture, so the grid proves the range and the masthead only makes the claim.
