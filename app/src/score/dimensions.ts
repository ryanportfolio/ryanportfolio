/**
 * Dimension scorers. Pure functions: RepoFacts → DimensionResult.
 * No network, no clock, no LLM. Unverifiable signal → score null, never guessed.
 */
import { isAgentInvolvedCommit } from "../agents.js";
import type { DimensionResult, RepoFacts } from "../types.js";

export const WEIGHTS = {
  agent_attribution: 0.1,
  review_coverage: 0.15,
  review_catch_rate: 0.1,
  human_merge_gate: 0.15,
  ci_gate: 0.15,
  batch_size: 0.1,
  lead_time: 0.05,
  plan_evidence: 0.1,
  audit_trail: 0.1,
} as const;

export type DimensionKey = keyof typeof WEIGHTS;

const round1 = (n: number): number => Math.round(n * 10) / 10;
const pct = (num: number, den: number): number => round1((num / den) * 100);

function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  const lo = sorted[mid - 1];
  const hi = sorted[mid];
  if (sorted.length % 2 === 0 && lo !== undefined && hi !== undefined) {
    return (lo + hi) / 2;
  }
  return hi ?? null;
}

function banded(value: number, bands: [max: number, score: number][], floor: number): number {
  for (const [max, score] of bands) {
    if (value <= max) return score;
  }
  return floor;
}

export function scoreAgentAttribution(facts: RepoFacts): DimensionResult {
  const key = "agent_attribution";
  const label = "Agent attribution & provenance";
  const commits = facts.commits;
  if (commits.length === 0) {
    return {
      key,
      label,
      score: null,
      weight: WEIGHTS[key],
      detail: "Could not verify: no commits in sample.",
      metrics: {},
    };
  }
  const attributable = commits.filter(
    (c) => c.authorLogin !== null || c.authorIsBot || c.hasAnyCoAuthorTrailer,
  ).length;
  const agentInvolved = commits.filter(isAgentInvolvedCommit).length;

  const dates = commits
    .map((c) => c.committedAt)
    .filter((d): d is string => d !== null)
    .sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  let perWeek: number | null = null;
  if (first !== undefined && last !== undefined && first !== last) {
    const weeks = (Date.parse(last) - Date.parse(first)) / (7 * 24 * 3600 * 1000);
    if (weeks > 0) perWeek = round1(commits.length / weeks);
  }

  return {
    key,
    label,
    score: pct(attributable, commits.length),
    weight: WEIGHTS[key],
    detail: `${attributable}/${commits.length} commits have clear provenance (linked account, bot identity, or co-author trailer). Agent-involved share is reported as context, not judged.`,
    metrics: {
      commits_sampled: commits.length,
      agent_involved_pct: pct(agentInvolved, commits.length),
      commits_per_week: perWeek,
    },
  };
}

export function scoreReviewCoverage(facts: RepoFacts): DimensionResult {
  const key = "review_coverage";
  const label = "PR review coverage";
  const prs = facts.pullRequests;
  if (prs.length === 0) {
    return {
      key,
      label,
      score: null,
      weight: WEIGHTS[key],
      detail: "Could not verify: no merged PRs in sample.",
      metrics: {},
    };
  }
  const reviewed = prs.filter((p) => p.reviews.length > 0).length;
  return {
    key,
    label,
    score: pct(reviewed, prs.length),
    weight: WEIGHTS[key],
    detail: `${reviewed}/${prs.length} merged PRs received at least one review not authored by the PR author.`,
    metrics: { merged_prs: prs.length, reviewed_prs: reviewed },
  };
}

export function scoreReviewCatchRate(facts: RepoFacts): DimensionResult {
  const key = "review_catch_rate";
  const label = "Review catch rate";
  const reviewed = facts.pullRequests.filter((p) => p.reviews.length > 0);
  if (reviewed.length === 0) {
    return {
      key,
      label,
      score: null,
      weight: WEIGHTS[key],
      detail: "Could not verify: no reviewed PRs in sample.",
      metrics: {},
    };
  }
  const caught = reviewed.filter((p) => p.commitsAfterFirstReview > 0).length;
  return {
    key,
    label,
    score: pct(caught, reviewed.length),
    weight: WEIGHTS[key],
    detail: `${caught}/${reviewed.length} reviewed PRs had commits pushed after the first review and before merge (review produced change).`,
    metrics: { reviewed_prs: reviewed.length, prs_changed_after_review: caught },
  };
}

export function scoreHumanMergeGate(facts: RepoFacts): DimensionResult {
  const key = "human_merge_gate";
  const label = "Human merge gate";
  const prs = facts.pullRequests.filter((p) => p.mergedByLogin !== null || p.mergedByIsBot);
  if (prs.length === 0) {
    return {
      key,
      label,
      score: null,
      weight: WEIGHTS[key],
      detail: "Could not verify: merger identity unavailable for sampled PRs.",
      metrics: {},
    };
  }
  const humanMerged = prs.filter((p) => !p.mergedByIsBot).length;
  return {
    key,
    label,
    score: pct(humanMerged, prs.length),
    weight: WEIGHTS[key],
    detail: `${humanMerged}/${prs.length} sampled merges were performed by a non-bot account.`,
    metrics: { merges_with_known_merger: prs.length, human_merges: humanMerged },
  };
}

export function scoreCiGate(facts: RepoFacts): DimensionResult {
  const key = "ci_gate";
  const label = "CI test/eval gate";
  const hasWorkflows = facts.workflows.workflowFileCount > 0;
  const withChecks = facts.pullRequests.filter((p) => p.checks !== null && p.checks.total > 0);

  if (!hasWorkflows && facts.pullRequests.length === 0) {
    return {
      key,
      label,
      score: null,
      weight: WEIGHTS[key],
      detail: "Could not verify: no workflows detected and no merged PRs sampled.",
      metrics: {},
    };
  }

  const presence = hasWorkflows ? 40 : 0;
  let history = 0;
  let passRate: number | null = null;
  if (withChecks.length > 0) {
    const passed = withChecks.filter((p) => {
      const c = p.checks;
      return c !== null && c.passed >= c.total;
    }).length;
    passRate = pct(passed, withChecks.length);
    history = (passRate / 100) * 60;
  }
  return {
    key,
    label,
    score: round1(presence + history),
    weight: WEIGHTS[key],
    detail: hasWorkflows
      ? `${facts.workflows.workflowFileCount} workflow file(s) present (40pts). ${withChecks.length > 0 ? `${passRate}% of sampled merged PRs had all check runs passing at head (up to 60pts).` : "No check-run history on sampled PRs (0/60pts)."}`
      : "No CI workflow files detected.",
    metrics: {
      workflow_files: facts.workflows.workflowFileCount,
      prs_with_checks: withChecks.length,
      pr_check_pass_rate_pct: passRate,
    },
  };
}

export function scoreBatchSize(facts: RepoFacts): DimensionResult {
  const key = "batch_size";
  const label = "Batch size";
  const sizes = facts.pullRequests.map((p) => p.additions + p.deletions).sort((a, b) => a - b);
  const med = median(sizes);
  if (med === null) {
    return {
      key,
      label,
      score: null,
      weight: WEIGHTS[key],
      detail: "Could not verify: no merged PRs in sample.",
      metrics: {},
    };
  }
  const score = banded(
    med,
    [
      [200, 100],
      [400, 85],
      [800, 70],
      [1500, 50],
      [3000, 30],
    ],
    10,
  );
  return {
    key,
    label,
    score,
    weight: WEIGHTS[key],
    detail: `Median merged-PR diff size is ${med} lines (additions+deletions). Small batches score higher.`,
    metrics: {
      median_diff_lines: med,
      p90_diff_lines: sizes[Math.min(sizes.length - 1, Math.ceil(sizes.length * 0.9) - 1)] ?? null,
    },
  };
}

export function scoreLeadTime(facts: RepoFacts): DimensionResult {
  const key = "lead_time";
  const label = "Lead time (first commit → merge)";
  const hours = facts.pullRequests
    .filter((p) => p.firstCommitAt !== null && p.mergedAt !== null)
    .map((p) => (Date.parse(p.mergedAt as string) - Date.parse(p.firstCommitAt as string)) / 3600000)
    .filter((h) => h >= 0)
    .sort((a, b) => a - b);
  const med = median(hours);
  if (med === null) {
    return {
      key,
      label,
      score: null,
      weight: WEIGHTS[key],
      detail: "Could not verify: no PRs with both first-commit and merge timestamps.",
      metrics: {},
    };
  }
  const score = banded(
    med,
    [
      [24, 100],
      [72, 85],
      [168, 70],
      [336, 50],
      [720, 30],
    ],
    10,
  );
  return {
    key,
    label,
    score,
    weight: WEIGHTS[key],
    detail: `Median lead time from first PR commit to merge is ${round1(med)}h.`,
    metrics: { median_lead_time_hours: round1(med), prs_measured: hours.length },
  };
}

export function scorePlanEvidence(facts: RepoFacts): DimensionResult {
  const key = "plan_evidence";
  const label = "Plan-before-code evidence";
  const prs = facts.pullRequests;
  if (prs.length === 0) {
    return {
      key,
      label,
      score: null,
      weight: WEIGHTS[key],
      detail: "Could not verify: no merged PRs in sample.",
      metrics: {},
    };
  }
  const planned = prs.filter((p) => p.bodyRefsIssue || p.bodyRefsPlanDoc).length;
  return {
    key,
    label,
    score: pct(planned, prs.length),
    weight: WEIGHTS[key],
    detail: `${planned}/${prs.length} merged PRs reference a linked issue or plan document in the PR body.`,
    metrics: { merged_prs: prs.length, prs_with_plan_ref: planned },
  };
}

export function scoreAuditTrail(facts: RepoFacts): DimensionResult {
  const key = "audit_trail";
  const label = "Audit-trail completeness";
  const prs = facts.pullRequests;
  if (prs.length === 0) {
    return {
      key,
      label,
      score: null,
      weight: WEIGHTS[key],
      detail: "Could not verify: no merged PRs in sample.",
      metrics: {},
    };
  }
  const substantiveBody = prs.filter((p) => p.bodyLength >= 120).length;
  const reviewRecorded = prs.filter((p) => p.reviews.length > 0).length;
  const checksRecorded = prs.filter((p) => p.checks !== null && p.checks.total > 0).length;
  const score = round1(
    (pct(substantiveBody, prs.length) +
      pct(reviewRecorded, prs.length) +
      pct(checksRecorded, prs.length)) /
      3,
  );
  return {
    key,
    label,
    score,
    weight: WEIGHTS[key],
    detail: `Mean of: substantive PR description ≥120 chars (${substantiveBody}/${prs.length}), review recorded (${reviewRecorded}/${prs.length}), CI checks recorded (${checksRecorded}/${prs.length}).`,
    metrics: {
      substantive_description_prs: substantiveBody,
      review_recorded_prs: reviewRecorded,
      checks_recorded_prs: checksRecorded,
    },
  };
}

export const ALL_DIMENSIONS: ((facts: RepoFacts) => DimensionResult)[] = [
  scoreAgentAttribution,
  scoreReviewCoverage,
  scoreReviewCatchRate,
  scoreHumanMergeGate,
  scoreCiGate,
  scoreBatchSize,
  scoreLeadTime,
  scorePlanEvidence,
  scoreAuditTrail,
];
