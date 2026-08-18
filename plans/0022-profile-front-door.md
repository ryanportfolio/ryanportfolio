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
