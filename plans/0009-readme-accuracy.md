# Plan 0009 — README accuracy pass

**Goal:** owner flagged the README bio as containing false and misleading
descriptions (e.g. "audio at truenote.org" — Truenote is a cited-answers
assistant for customer-service teams). Replace every invented descriptor
with copy grounded in each site's own published self-description, and fix
adjacent overclaims.

## Grounding (fetched 2026-07-18 from the live sites)

- corewise.academy/about: "Ryan Allen — AI systems builder shipping end to
  end"; free guides on working with AI; four live systems, AI agents as
  workforce, human approval gates on deployments.
- corewise.video (CoreWise): turns videos and articles into actionable
  insights, synthesized across multiple AI models.
- truenote.org (Truenote): "Cited Knowledge Answers for Customer Service
  Teams"; cites or declines when documentation doesn't support an answer.
- willaicite.com (willaicite): free deterministic audit scoring whether AI
  answer engines can retrieve, extract, and quote a page.
- kinefractal.com (KineFractal): tagline "buys fear → trims the strength";
  a systematic trading strategy. Described minimally — least
  self-describing site; owner should correct if off.

## Also fixed

- Scoreboard blurb: "verifiable engineering assessment" of private repos →
  the honest split (tool + pipeline public and deterministic; private-repo
  reports owner-reproducible), matching the site copy fixed in PR #8.
- "built exclusively through the pipeline it documents" gains "every change
  since the bootstrap commit" — the two scaffold commits predate the
  pipeline; the gate-checked phrase is retained.
- Layout table phase markers updated to what now exists (app/, governance/,
  playbook shipped; reports/ pending Phase 3).

## Verification

Gate (README link + phrase checks) passes; no invented descriptor remains —
every claim traceable to a fetched self-description or removed.
