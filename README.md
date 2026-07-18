# Ryan

Solo builder shipping AI-assisted software end to end — video-knowledge tooling at [corewise.video](https://corewise.video), an education platform at [corewise.academy](https://corewise.academy/about), audio at [truenote.org](https://truenote.org), generative art at [kinefractal.com](https://kinefractal.com), and citation tooling at [willaicite.com](https://willaicite.com). This repo is the flagship piece: a public, auditable agentic software-development pipeline **and** the audit tool it exists to build.

## Fleet audit scoreboard

*One scored engineering report per repo in the portfolio — browse the visual viewer at **[ryanportfolio.github.io/ryanportfolio](https://ryanportfolio.github.io/ryanportfolio/)**. Most of the portfolio is private; the published reports are how a recruiter reads a scored, verifiable engineering assessment of repos they cannot open. First fleet run lands in Phase 3.*

<!-- scoreboard:start -->
| Repo | Score | Report |
|------|-------|--------|
| *pending first audit run* | — | — |
<!-- scoreboard:end -->

## What this repo is

An **agentic-SDLC audit tool**: point it at any GitHub repo and get a deterministic, scored report on AI-agent development discipline. Scored dimensions include agent-vs-human commit ratio, PR review coverage and review-catch rate, human merge-gate presence, CI test/eval gate presence and pass history, batch size, commit→merge lead time, plan-before-code evidence, and audit-trail completeness — rolled up DORA-style. The scoring core is deterministic: same repo state → same score, no LLM calls in the scoring path.

## The experiment

This repo is built **exclusively through the pipeline it documents**. Every change flows:

```
plan → agent build → independent fresh-context AI review → CI test+eval gate → owner-authorized merge
```

- The building agent never grades its own work: the reviewing agent gets fresh context and an adversarial prompt (refute, don't approve).
- Merge authority stays with the owner. Merges are agent-executed under a standing, session-scoped owner authorization, revocable at any time — disclosed, not dressed up as a manual click; details in [governance](governance/README.md).
- Every PR links a plan note, passes the gate, and carries its review trail.

The public PR history of this repo *is* the living demo. Solo project, zero external users — the pitch is publicly auditable process, a reusable framework, and verified portfolio evidence, not adoption.

## Layout

| Path | Purpose |
|------|---------|
| `app/` | The audit tool (TypeScript / Node 20, GitHub API, CLI). *Phase 1.* |
| `.github/workflows/` | The pipeline itself — test+eval gate, independent AI reviewer. Written to be copy-pastable into other repos. |
| `governance/` | Human-in-the-loop checkpoint map, audit-trail contents, NIST AI RMF mapping. *Phase 2.* |
| `plans/` | One plan note per PR — the plan-before-code evidence this tool scores. |
| `reports/` | Published fleet audit reports. *Phase 3.* |
| `playbook.md` | How to run this pipeline on any repo. *Phase 4.* |
