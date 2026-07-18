# Governance: human-in-the-loop checkpoints & audit trail

One page. What a human must approve, what gets recorded, and how each
control maps to NIST AI RMF vocabulary. This describes **this repo's**
pipeline; it formalizes practices used across the owner's other projects,
which did not all run this full pipeline.

## Checkpoints

| # | Checkpoint | Who/what decides | Enforced by |
|---|-----------|------------------|-------------|
| 1 | **Plan before code** | Agent writes `plans/NNNN-*.md`; scope is fixed before the diff exists | PR convention; plan linkage checked by the AI reviewer |
| 2 | **CI test+eval gate** | Deterministic: repo invariants, typecheck, 44-test Vitest suite, golden-report + determinism evals | `.github/workflows/gate.yml` — must pass on every PR |
| 3 | **Independent AI review** | Fresh-context reviewer with an adversarial prompt (refute, don't approve); posts findings, holds no approve/merge power | `.github/workflows/ai-review.yml` |
| 4 | **Human-only merge** | The owner reads the diff, the review, and the gate result; only a human merges | Repo practice: no agent has merge rights; every merge in the history is human |
| 5 | **Report publication** | Every fleet-audit report is read and explicitly approved by the owner before it is committed; excluded repos are never audited or published | Local-only fleet config with a mandatory exclude list; publication only via human-merged PR |

LLM use is confined to the plan and review lanes. The scoring path is
deterministic — no LLM call can influence a published score.

## Audit trail

Every merged change leaves, publicly:

- the **plan note** (`plans/`) — intent and scope, written before the code;
- the **PR** — diff, linked plan, description of what was verified;
- the **AI review comment** — the independent adversarial pass, verbatim;
- the **gate run** — CI logs for tests and evals at the merged SHA;
- the **merge event** — which human merged, when;
- for fleet reports: the **report file itself** carries provenance (head
  SHA, collection time, sample sizes and truncation) so any score can be
  re-derived and checked.

## NIST AI RMF mapping

| Control here | AI RMF function | Rationale |
|--------------|-----------------|-----------|
| This governance page; confinement of LLMs to plan/review lanes | **Govern** | Roles, permitted AI use, and accountability are written down and versioned |
| Plan notes fixing scope before build | **Map** | Context and intended behavior established before the system changes |
| Deterministic scoring core; golden-report + determinism evals in CI; "could not verify" over guessing | **Measure** | Verifiable, repeatable measurement with drift caught by CI |
| Adversarial independent review; human-only merge; human-approved publication of every report | **Manage** | Risks surfaced by an independent pass and dispositioned by a human before release |

## Honest limits

Solo project, zero external users. The AI-review lane is inert until the
`ANTHROPIC_API_KEY` secret is configured. Branch-protection settings are not
publicly verifiable from outside the repo; the enforceable public evidence
for checkpoint 4 is the merge history itself.
