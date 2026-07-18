# Agentic-SDLC audit: ryanportfolio/ryanportfolio

**Overall: 78/100, Strong**

- Collected: 2026-07-18T18:47:29.588Z
- Head commit: `332bbc418b1f908c7f63be07e0309f245e2812a6`
- Sample: 26 commits, 10 merged PRs

## What this score means

This score measures process discipline, not code quality. The tool never reads the code. It reads only GitHub metadata: commits, pull requests, reviews, check runs, and merge events. It scores only what is recorded on GitHub; discipline that leaves no artifact there earns nothing.

It answers one question: when AI agents help write the code, what does this repo's history prove about the checks standing between a change and the main branch?

Each dimension is a 0 to 100 answer to one concrete question, or 'could not verify' when the evidence is missing. The overall score is the weighted average of the verified dimensions, and grades band it: 90+ Elite, 75+ Strong, 60+ Developing, 40+ Early, under 40 Ad-hoc.

## Dimensions

| Dimension | Score | Weight | Basis |
|-----------|-------|--------|-------|
| Agent attribution & provenance | 100/100 | 0.1 | 26/26 commits have clear provenance (linked account, bot identity, or co-author trailer). Agent-involved share is reported as context, not judged. |
| Recorded review coverage | 0/100 | 0.15 | 0/10 merged PRs received at least one review not authored by the PR author. |
| Recorded review catch rate | could not verify | 0.1 | Could not verify: no reviewed PRs in sample. |
| Human merge gate | 100/100 | 0.15 | 10/10 sampled merges were performed by a non-bot account. |
| CI test/eval gate | 100/100 | 0.15 | 3 workflow file(s) present (40pts). 100% of sampled merged PRs had all check runs passing at head (up to 60pts). |
| Batch size | 85/100 | 0.1 | Median merged-PR diff size is 286.5 lines (additions+deletions). Small batches score higher. |
| Lead time (first commit → merge) | 100/100 | 0.05 | Median lead time from first PR commit to merge is 0.4h. |
| Plan-before-code evidence | 100/100 | 0.1 | 10/10 merged PRs reference a linked issue or plan document in the PR body. |
| Audit-trail completeness | 66.7/100 | 0.1 | Mean of: substantive PR description ≥120 chars (10/10), review recorded (0/10), CI checks recorded (10/10). |

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

- **Agent attribution & provenance**: commits_sampled=26, agent_involved_pct=53.8, commits_per_week=2492
- **Recorded review coverage**: merged_prs=10, reviewed_prs=0
- **Human merge gate**: merges_with_known_merger=10, human_merges=10
- **CI test/eval gate**: workflow_files=3, prs_with_checks=10, pr_check_pass_rate_pct=100
- **Batch size**: median_diff_lines=286.5, p90_diff_lines=1030
- **Lead time (first commit → merge)**: median_lead_time_hours=0.4, prs_measured=10
- **Plan-before-code evidence**: merged_prs=10, prs_with_plan_ref=10
- **Audit-trail completeness**: substantive_description_prs=10, review_recorded_prs=0, checks_recorded_prs=10

## Could not verify

The following dimensions had no verifiable signal in the sample. They are excluded from the overall score (weights renormalized) rather than guessed:

- Recorded review catch rate: Could not verify: no reviewed PRs in sample.

## What this score cannot see

- Work that leaves no GitHub artifact is invisible. Reviews run in a separate AI session, audits handed to another tool, and local test runs do not exist to this tool unless they were posted back to the pull request.
- Solo accounts have a built-in blind spot: review credit requires a reviewer who is not the pull request's author. A solo owner who runs an independent review in a fresh session and posts the result from their own account gets no review-coverage credit for it. That can make a disciplined solo repo look weaker on review dimensions than it is.
- These are under-measurements, not corrections. The tool states what it could not see instead of guessing.

## Methodology

Scores are computed deterministically from GitHub API metadata (commits, pull requests, reviews, check runs, workflow presence): same repo state, same score; no LLM in the scoring path. Reports contain aggregate metrics only: no source code, commit-message bodies, PR text, or configuration values are collected or published. Tool: [agentic-sdlc-audit](../app/).
