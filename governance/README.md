# Governance: human-in-the-loop checkpoints & audit trail

One page. What a human must approve, what gets recorded, and how each
control maps to NIST AI RMF vocabulary. This describes **this repo's**
pipeline; it formalizes practices used across the owner's other projects,
which did not all run this full pipeline.

## Checkpoints

| # | Checkpoint | Who/what decides | Enforced by |
|---|-----------|------------------|-------------|
| 1 | **Plan before code** | Agent writes `plans/NNNN-*.md`; scope is fixed before the diff exists | PR convention; plan linkage checked by the AI reviewer |
| 2 | **CI test+eval gate** | Deterministic: repo invariants, typecheck, 44-test Vitest suite, golden-report + determinism evals | `.github/workflows/gate.yml`; must pass on every PR |
| 3 | **Independent AI review** | Fresh-context reviewer with an adversarial prompt (refute, don't approve); posts findings, holds no approve/merge power | Local lane: `.claude/skills/adversarial-review` (subscription-billed, invoked before merge; the merge gate blocks on a missing review). CI variant ships as a portable template: `.github/workflows/ai-review.yml`, intentionally inert here |
| 4 | **Merge authorization** | Merge authority belongs to the owner. Merges are agent-executed only under a standing, session-scoped authorization the owner grants explicitly (`/merge`) and can revoke at any time ("stop merge") | Authorization protocol + this disclosure; merges use the owner's account, so the distinction is disclosed here rather than visible in the history |
| 5 | **Report publication** | Every fleet-audit report is read and explicitly approved by the owner before it is committed; excluded repos are never audited or published | Local-only fleet config with a mandatory exclude list; publication only via human-merged PR |

LLM use is confined to the plan and review lanes. The scoring path is
deterministic: no LLM call can influence a published score.

## Audit trail

Every merged change leaves, publicly:

- the **plan note** (`plans/`): intent and scope, written before the code;
- the **PR**: diff, linked plan, description of what was verified;
- the **AI review comment**: the independent adversarial pass, verbatim;
- the **gate run**: CI logs for tests and evals at the merged SHA;
- the **merge event**: which account merged, when, and (below) the
  standing-authorization basis under which agent-executed merges happen;
- for fleet reports: the **report file itself** carries provenance (head
  SHA, collection time, sample sizes and truncation) so any score can be
  re-derived and checked.

## NIST AI RMF mapping

| Control here | AI RMF function | Rationale |
|--------------|-----------------|-----------|
| This governance page; confinement of LLMs to plan/review lanes | **Govern** | Roles, permitted AI use, and accountability are written down and versioned |
| Plan notes fixing scope before build | **Map** | Context and intended behavior established before the system changes |
| Deterministic scoring core; golden-report + determinism evals in CI; "could not verify" over guessing | **Measure** | Verifiable, repeatable measurement with drift caught by CI |
| Adversarial independent review; owner-held merge authority; human-approved publication of every report | **Manage** | Risks surfaced by an independent pass; release authority held and revocable by a human |

## Honest limits

Solo project, zero external users. The review lane runs locally on
invocation, not on PR events. The guarantee is the merge gate refusing
unreviewed PRs, and the public evidence is the posted review comment on
each PR (the CI template stays inert unless a secret is added).

**Merge-execution disclosure (2026-07-18).** Merges in this repo are
executed by the agent under a standing, session-scoped authorization the
owner grants explicitly and can revoke at any time. They are performed with
the owner's account, so the audit tool (and any outside reader) cannot
distinguish them from manual clicks; that is exactly why it is stated here
instead of implied away. The bootstrap chain (PRs #1–#7) was merged this
way and predates the live adversarial-review lane. One gate is never
delegated: nothing lands in `reports/` without the owner explicitly
approving each rendered page.

Branch-protection settings are not publicly verifiable from outside the
repo; the enforceable public evidence for checkpoint 4 is this disclosure
plus the merge history.
