# Playbook: run this agentic pipeline on any repo

The pipeline this repo is built with, reduced to steps you can apply to any
project. It assumes GitHub, but nothing here is specific to this codebase.

## The loop

```
plan → agent build → independent AI review → CI test+eval gate → owner-gated merge
```

Five lanes, one rule each:

1. **Plan** — before any code, the agent writes a short plan note
   (`plans/NNNN-<slug>.md`): goal, scope, out-of-scope, verification. The PR
   links it. Scope creep becomes visible as a diff between plan and diff.
2. **Build** — the agent works on a branch, small batches: one concern per
   PR. It never merges, never pushes to main, never mutates anything outside
   its branch.
3. **Review** — a *different* agent session with fresh context reviews the
   PR with an adversarial prompt: refute, don't approve. It posts findings
   and has no approve/merge power. The builder never grades its own work.
   Two equivalent runtimes: an event-driven CI workflow (needs an API/OAuth
   secret), or a locally invoked fresh-context session on a subscription —
   for a solo dev who only pushes PRs while at the machine, the local lane
   loses nothing as long as the merge gate blocks unreviewed PRs.
4. **Gate** — deterministic CI on every PR: tests, typecheck, and evals
   (golden outputs + determinism checks) that fail on any unexplained drift.
5. **Merge** — merge authority belongs to a human. Two honest modes: the
   owner clicks every merge themselves, or the owner grants the agent a
   standing, session-scoped, revocable merge authorization. Either is
   defensible — what is not defensible is running the second while
   claiming the first. State which mode you run (this repo's statement
   lives in its governance page); the merge history plus that disclosure
   is the audit trail.

## Setup on a fresh repo

1. Copy `.github/workflows/gate.yml` from this repo; replace the app test
   steps with your own test/eval commands. Keep it failing-closed.
2. Pick a review-lane runtime. Event-driven: copy
   `.github/workflows/ai-review.yml`, adjust the checklist to your
   project's invariants, add an `ANTHROPIC_API_KEY` (or subscription
   OAuth-token) secret — it skips with a visible notice until then.
   Local/subscription: copy `.claude/skills/adversarial-review` and invoke
   it on every PR before merge, with the merge gate refusing unreviewed
   PRs.
3. Create `plans/` and require a linked plan note in every PR body.
4. Decide what agents may never do (merge, release, touch main) and write it
   down — in this repo that lives in [governance/](governance/README.md).
5. If the work involves scoring, generation, or any output that can drift:
   commit golden outputs and make CI compare against them byte-for-byte, so
   changes are explicit and reviewed.

## Conventions that make it work

- **Small batches.** Big PRs defeat both the reviewer and the merge gate.
- **Verification is claimed, not assumed.** A PR says what was actually run
  and what could not be verified from the environment.
- **Unverifiable signal is reported as such** — "could not verify" beats a
  confident guess, in reports and in PR descriptions alike.
- **LLMs stay out of deterministic paths.** Plan and review lanes only;
  anything scored or measured is reproducible from inputs.

## Honest scope

This playbook is extracted from a solo project with zero external users. It
formalizes practices used across the owner's projects; it is evidence of a
working process, not of team-scale adoption.
