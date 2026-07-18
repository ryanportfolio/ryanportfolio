# Agentic-SDLC audit: ryanportfolio/PixelSwarm

**Overall: 68.4/100, Developing**

- Collected: 2026-07-18T18:46:07.755Z
- Head commit: `c04fe98b179e6152dd036f1060f4a7e1e3c50895`
- Sample: 196 commits, 50 merged PRs (truncated at collection limit)

## What this score means

This score measures process discipline, not code quality. The tool never reads the code. It reads only GitHub metadata: commits, pull requests, reviews, check runs, and merge events. It scores only what is recorded on GitHub; discipline that leaves no artifact there earns nothing.

It answers one question: when AI agents help write the code, what does this repo's history prove about the checks standing between a change and the main branch?

Each dimension is a 0 to 100 answer to one concrete question, or 'could not verify' when the evidence is missing. The overall score is the weighted average of the verified dimensions, and grades band it: 90+ Elite, 75+ Strong, 60+ Developing, 40+ Early, under 40 Ad-hoc.

## Dimensions

| Dimension | Score | Weight | Basis |
|-----------|-------|--------|-------|
| Agent attribution & provenance | 100/100 | 0.1 | 196/196 commits have clear provenance (linked account, bot identity, or co-author trailer). Agent-involved share is reported as context, not judged. |
| Recorded review coverage | 0/100 | 0.15 | 0/50 merged PRs received at least one review not authored by the PR author. |
| Recorded review catch rate | could not verify | 0.1 | Could not verify: no reviewed PRs in sample. |
| Human merge gate | 100/100 | 0.15 | 50/50 sampled merges were performed by a non-bot account. |
| CI test/eval gate | 100/100 | 0.15 | 1 workflow file(s) present (40pts). 100% of sampled merged PRs had all check runs passing at head (up to 60pts). |
| Batch size | 100/100 | 0.1 | Median merged-PR diff size is 192.5 lines (additions+deletions). Small batches score higher. |
| Lead time (first commit → merge) | 100/100 | 0.05 | Median lead time from first PR commit to merge is 0.1h. |
| Plan-before-code evidence | 2/100 | 0.1 | 1/50 merged PRs reference a linked issue or plan document in the PR body. |
| Audit-trail completeness | 63.3/100 | 0.1 | Mean of: substantive PR description ≥120 chars (45/50), review recorded (0/50), CI checks recorded (50/50). |

In plain terms, each dimension asks:

- **Agent attribution & provenance**: Can every commit be traced to who or what made it (a linked account, a bot identity, or a co-author trailer)?
- **Recorded review coverage**: Of the merged pull requests, how many carry a recorded review by anyone other than the author?
- **Recorded review catch rate**: When a recorded review happened, did it change anything (new commits after the review, before the merge)?
- **Human merge gate**: Are merges performed by people, or does automation merge by itself?
- **CI test/eval gate**: Do automated tests exist, and did pull requests actually pass them before merging?
- **Batch size**: Are changes small, reviewable chunks, or thousand-line dumps?
- **Lead time (first commit → merge)**: How long does work take from first commit to being merged?
- **Plan-before-code evidence**: Do pull requests link to an issue or plan that existed before the code?
- **Audit-trail completeness**: Could a stranger reconstruct why each change happened (real descriptions, recorded reviews, recorded checks)?

## Context metrics

- **Agent attribution & provenance**: commits_sampled=196, agent_involved_pct=49.5, commits_per_week=118.9
- **Recorded review coverage**: merged_prs=50, reviewed_prs=0
- **Human merge gate**: merges_with_known_merger=50, human_merges=50
- **CI test/eval gate**: workflow_files=1, prs_with_checks=50, pr_check_pass_rate_pct=100
- **Batch size**: median_diff_lines=192.5, p90_diff_lines=711
- **Lead time (first commit → merge)**: median_lead_time_hours=0.1, prs_measured=50
- **Plan-before-code evidence**: merged_prs=50, prs_with_plan_ref=1
- **Audit-trail completeness**: substantive_description_prs=45, review_recorded_prs=0, checks_recorded_prs=50

## Could not verify

The following dimensions had no verifiable signal in the sample. They are excluded from the overall score (weights renormalized) rather than guessed:

- Recorded review catch rate: Could not verify: no reviewed PRs in sample.

## Owner attestation

Stated by the repo owner. The tool has not verified this and it earns no score credit.

> Independent review for this repo happens as fresh-context AI audit sessions outside GitHub (handoff audits). Those sessions leave no GitHub artifacts, so they earn no credit in the recorded-review dimensions above.

## What this score cannot see

- Work that leaves no GitHub artifact is invisible. Reviews run in a separate AI session, audits handed to another tool, and local test runs do not exist to this tool unless they were posted back to the pull request.
- Solo accounts have a built-in blind spot: review credit requires a reviewer who is not the pull request's author. A solo owner who runs an independent review in a fresh session and posts the result from their own account gets no review-coverage credit for it. That can make a disciplined solo repo look weaker on review dimensions than it is.
- These are under-measurements, not corrections. The tool states what it could not see instead of guessing.

## Methodology

Scores are computed deterministically from GitHub API metadata (commits, pull requests, reviews, check runs, workflow presence): same repo state, same score; no LLM in the scoring path. Reports contain aggregate metrics only: no source code, commit-message bodies, PR text, or configuration values are collected or published. Tool: [agentic-sdlc-audit](../app/).
