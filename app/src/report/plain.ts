/**
 * Plain-language explanations shared by the markdown renderer and the site
 * generator, so both surfaces always say the same thing. Voice: short,
 * concrete, no jargon, no em dashes.
 */
import type { DimensionKey } from "../score/dimensions.js";

export const PLAIN_MEANING: string[] = [
  "This score measures process discipline, not code quality. The tool never reads the code. It reads only GitHub metadata: commits, pull requests, reviews, check runs, and merge events.",
  "It answers one question: when AI agents help write the code, what does this repo's history prove about the checks standing between a change and the main branch?",
  "Each dimension is a 0 to 100 answer to one concrete question, or 'could not verify' when the evidence is missing. The overall score is the weighted average of the verified dimensions, and grades band it: 90+ Elite, 75+ Strong, 60+ Developing, 40+ Early, under 40 Ad-hoc.",
];

/** One plain question per dimension key, rendered next to each score.
 * Typed against DimensionKey so adding a dimension without a question is a
 * compile error, not a silently missing row. */
export const PLAIN_QUESTIONS: Record<DimensionKey, string> = {
  agent_attribution:
    "Can every commit be traced to who or what made it (a linked account, a bot identity, or a co-author trailer)?",
  review_coverage:
    "Of the merged pull requests, how many did anyone other than the author look at before merge?",
  review_catch_rate:
    "When a review happened, did it change anything (new commits after the review, before the merge)?",
  human_merge_gate: "Are merges performed by people, or does automation merge by itself?",
  ci_gate: "Do automated tests exist, and did pull requests actually pass them before merging?",
  batch_size: "Are changes small, reviewable chunks, or thousand-line dumps?",
  lead_time: "How long does work take from first commit to being merged?",
  plan_evidence: "Do pull requests link to an issue or plan that existed before the code?",
  audit_trail:
    "Could a stranger reconstruct why each change happened (real descriptions, recorded reviews, recorded checks)?",
};

export const PLAIN_LIMITS: string[] = [
  "Work that leaves no GitHub artifact is invisible. Reviews run in a separate AI session, audits handed to another tool, and local test runs do not exist to this tool unless they were posted back to the pull request.",
  "Solo accounts have a built-in blind spot: review credit requires a reviewer who is not the pull request's author. A solo owner who runs an independent review in a fresh session and posts the result from their own account gets no review-coverage credit for it. That can make a disciplined solo repo look weaker on review dimensions than it is.",
  "These are under-measurements, not corrections. The tool states what it could not see instead of guessing.",
];

export const PLAIN_LIMITS_TITLE = "What this score cannot see";
export const PLAIN_MEANING_TITLE = "What this score means";
