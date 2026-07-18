---
description: Run the independent adversarial AI-review lane on a PR and post findings as a PR comment. Use when the user says /adversarial-review <PR#>, asks to run the review lane on a PR, or a PR still needs its independent review before merge.
---

# Adversarial review: independent fresh-context PR review lane

Runs the review lane of this repo's pipeline locally (subscription-billed).
The reviewer must have **fresh context**: it never reuses the builder
session's state, sees only the PR itself, and tries to refute the change.
Output is a posted PR comment; it has no approve/request-changes/merge
power; merge authority stays with the owner (see governance/ for the
merge-execution disclosure).

The PR number comes from the skill arguments; if missing, ask which open PR to review.

## Step 1: Gather the PR, nothing else

Run: `gh pr view <N> --json title,body,baseRefName,headRefName,url` and
`gh pr diff <N>`. Identify the linked `plans/NNNN-*.md` note from the PR
body and read it from the PR's head branch.

## Step 2: Spawn a fresh-context reviewer

Dispatch a subagent (fresh context; do not review in the builder session
yourself; if you built this PR in the current session you are disqualified
from being the reviewer). Give it ONLY: the PR metadata, the diff, the plan
note, and this charge:

> You are the independent reviewer lane. You did not build this change.
> Your job is to REFUTE it, not approve it. Check, in order:
> 1. Plan linkage; does the PR link a plans/ note; does the diff stay in scope?
> 2. Determinism; nothing nondeterministic (clock, network, LLM, randomness,
>    unordered iteration) enters app/src/score/.
> 3. Privacy boundary; no source excerpts, commit-message bodies, PR text,
>    file contents, or config values in collected facts or rendered reports.
> 4. Honesty rails; unverifiable signal surfaces as "could not verify";
>    no silent guessing; copy never overclaims (solo project, zero users).
> 5. Tests; every changed behavior has a test that fails without it;
>    golden updates are justified.
> 6. Correctness; edge cases, error handling, API misuse.
> Lead with the most serious issue. If a genuine refutation attempt finds
> nothing, say exactly that and list what was checked. Never rubber-stamp.

## Step 3: Post the review comment

Write the reviewer's findings verbatim to a temp file, prefixed with:
`**Independent adversarial review (fresh-context, local lane)**: refute-first pass; no approve/merge power.`
Then run: `gh pr comment <N> --body-file <file>`.

## Step 4: Report

Tell the user the comment URL and the most serious finding (or "no
refutation found"). Do not approve, request changes, merge, or edit the PR.

## Anti-patterns

- Don't review in the builder's own session context; fresh subagent always.
- Don't feed the reviewer anything beyond the PR, its diff, and its plan note.
- Don't soften findings; refute-first, and say so when nothing survives.
- Don't approve/request-changes via review APIs; comment only; humans merge.
- Don't skip posting because findings are embarrassing; the trail is the point.
