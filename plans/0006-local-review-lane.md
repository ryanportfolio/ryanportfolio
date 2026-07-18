# Plan 0006 — Local subscription-billed review lane

**Goal:** make the independent adversarial review lane runnable locally on
the owner's Claude subscription (decision: solo workflow — PRs are only
pushed while the owner's machine is on, so a local lane loses nothing), and
reposition the CI workflow as the portable, inert template.

## Scope

- `.claude/skills/adversarial-review/SKILL.md` (+ generated Codex adapter):
  `/adversarial-review <PR#>` spawns a **fresh-context** reviewer session
  with the same refute-don't-approve checklist as the workflow; it reads
  only the PR (diff, plan note, description) and posts findings as a PR
  comment. No approve/request-changes/merge power.
- `.github/workflows/ai-review.yml`: header updated — portable template for
  other repos, intentionally inert here until a secret is added; the live
  lane in this repo is the local skill.
- `governance/README.md` checkpoint 3 + honest limits, and `playbook.md`
  review-lane wording updated to describe both runtimes honestly: local
  lane is invocation-required (the human-merge gate blocks on a missing
  review), CI lane is event-driven.

## Out of scope

Codex native PR review (owner can enable independently; noted as optional
cross-vendor upgrade). Fleet audit (Phase 3).

## Verification

- Codex sync + contract scripts pass; repo gate passes.
- Skill activates in future sessions once merged (session skill list loads
  at start) — cannot be exercised in this session; flagged, not claimed.
