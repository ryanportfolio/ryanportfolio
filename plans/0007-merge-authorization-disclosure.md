# Plan 0007 — Merge-authorization disclosure

**Goal:** owner decision (2026-07-18): merges are agent-executed under a
standing, session-scoped owner authorization (`/merge`), revocable at any
time ("stop merge"). The repo's published claims said "human-only merge";
leaving them would make the flagship's central claim false. Amend every
such claim to the honest version before any merge lands.

## Scope

- README experiment section + loop diagram: "human-only merge" →
  owner-authorized merge, with disclosure link to governance.
- governance/README.md: checkpoint 4 reworded to merge *authorization*;
  audit-trail bullet; NIST row; honest-limits gains a dated disclosure —
  including that the audit tool cannot distinguish agent-executed merges
  made with the owner's credentials (merger identity is the owner
  account), so this page discloses it instead; bootstrap chain PRs #1–#7
  merged this way and predate the live review lane.
- playbook.md: merge lane describes both modes (strict human-click vs
  disclosed standing authorization) and requires stating which you run.
- ai-review.yml comment + adversarial-review skill wording: "merge
  authority stays with the owner" replaces "human-only".
- Fleet-report carve-out stated: `reports/` never publishes without
  explicit per-report owner approval, auto-merge or not.

## Verification

Gate + Codex contract pass; grep confirms no stale "human-only merge"
claim remains in published copy.
