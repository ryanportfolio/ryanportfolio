# Agentic-SDLC audit: ryanportfolio/Truenote

**Overall: 71.2/100, Developing**

- Collected: 2026-07-18T18:44:34.356Z
- Head commit: `857c5c96b0df48a326ea8ddc364edeb51e9dbe03`
- Sample: 300 commits (truncated at collection limit), 50 merged PRs (truncated at collection limit)

## What this score means

This score measures process discipline, not code quality. The tool never reads the code. It reads only GitHub metadata: commits, pull requests, reviews, check runs, and merge events. It scores only what is recorded on GitHub; discipline that leaves no artifact there earns nothing.

It answers one question: when AI agents help write the code, what does this repo's history prove about the checks standing between a change and the main branch?

Each dimension is a 0 to 100 answer to one concrete question, or 'could not verify' when the evidence is missing. The overall score is the weighted average of the verified dimensions, and grades band it: 90+ Elite, 75+ Strong, 60+ Developing, 40+ Early, under 40 Ad-hoc.

## Dimensions

| Dimension | Score | Weight | Basis |
|-----------|-------|--------|-------|
| Agent attribution & provenance | 98.7/100 | 0.1 | 296/300 commits have clear provenance (linked account, bot identity, or co-author trailer). Agent-involved share is reported as context, not judged. |
| Recorded review coverage | 2/100 | 0.15 | 1/50 merged PRs received at least one review not authored by the PR author. |
| Recorded review catch rate | 100/100 | 0.1 | 1/1 reviewed PRs had commits pushed after the first review and before merge (review produced change). |
| Human merge gate | 100/100 | 0.15 | 50/50 sampled merges were performed by a non-bot account. |
| CI test/eval gate | 95.1/100 | 0.15 | 1 workflow file(s) present (40pts). 91.9% of sampled merged PRs had all check runs passing at head (up to 60pts). |
| Batch size | 100/100 | 0.1 | Median merged-PR diff size is 147.5 lines (additions+deletions). Small batches score higher. |
| Lead time (first commit → merge) | 100/100 | 0.05 | Median lead time from first PR commit to merge is 0.1h. |
| Plan-before-code evidence | 10/100 | 0.1 | 5/50 merged PRs reference a linked issue or plan document in the PR body. |
| Audit-trail completeness | 58/100 | 0.1 | Mean of: substantive PR description ≥120 chars (49/50), review recorded (1/50), CI checks recorded (37/50). |

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

- **Agent attribution & provenance**: commits_sampled=300, agent_involved_pct=34.3, commits_per_week=305.2
- **Recorded review coverage**: merged_prs=50, reviewed_prs=1
- **Recorded review catch rate**: reviewed_prs=1, prs_changed_after_review=1
- **Human merge gate**: merges_with_known_merger=50, human_merges=50
- **CI test/eval gate**: workflow_files=1, prs_with_checks=37, pr_check_pass_rate_pct=91.9
- **Batch size**: median_diff_lines=147.5, p90_diff_lines=1122
- **Lead time (first commit → merge)**: median_lead_time_hours=0.1, prs_measured=50
- **Plan-before-code evidence**: merged_prs=50, prs_with_plan_ref=5
- **Audit-trail completeness**: substantive_description_prs=49, review_recorded_prs=1, checks_recorded_prs=37

## Owner attestation

Stated by the repo owner. The tool has not verified this and it earns no score credit.

> Independent review for this repo happens as fresh-context AI audit sessions outside GitHub (handoff audits). Those sessions leave no GitHub artifacts, so they earn no credit in the recorded-review dimensions above.

## What this score cannot see

- Work that leaves no GitHub artifact is invisible. Reviews run in a separate AI session, audits handed to another tool, and local test runs do not exist to this tool unless they were posted back to the pull request.
- Solo accounts have a built-in blind spot: review credit requires a reviewer who is not the pull request's author. A solo owner who runs an independent review in a fresh session and posts the result from their own account gets no review-coverage credit for it. That can make a disciplined solo repo look weaker on review dimensions than it is.
- These are under-measurements, not corrections. The tool states what it could not see instead of guessing.

## Methodology

Scores are computed deterministically from GitHub API metadata (commits, pull requests, reviews, check runs, workflow presence): same repo state, same score; no LLM in the scoring path. Reports contain aggregate metrics only: no source code, commit-message bodies, PR text, or configuration values are collected or published. Tool: [agentic-sdlc-audit](../app/).
