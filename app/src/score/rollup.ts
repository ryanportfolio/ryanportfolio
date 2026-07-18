/** Rollup: weighted mean over scorable dimensions, weights renormalized. */
import type { RepoFacts, ScoreReport } from "../types.js";
import { ALL_DIMENSIONS } from "./dimensions.js";

/** Below this share of scorable weight, an overall score would be built on
 * too little verified signal — report Unscorable instead of guessing. */
const MIN_SCORABLE_WEIGHT = 0.5;

export function gradeFor(overall: number | null): ScoreReport["grade"] {
  if (overall === null) return "Unscorable";
  if (overall >= 90) return "Elite";
  if (overall >= 75) return "Strong";
  if (overall >= 60) return "Developing";
  if (overall >= 40) return "Early";
  return "Ad-hoc";
}

export function scoreRepo(facts: RepoFacts): ScoreReport {
  const dimensions = ALL_DIMENSIONS.map((fn) => fn(facts));
  const scored = dimensions.filter(
    (d): d is typeof d & { score: number } => d.score !== null,
  );
  const totalWeight = scored.reduce((sum, d) => sum + d.weight, 0);
  const overall =
    totalWeight >= MIN_SCORABLE_WEIGHT
      ? Math.round(
          (scored.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight) * 10,
        ) / 10
      : null;

  return {
    repo: `${facts.repo.owner}/${facts.repo.name}`,
    collectedAt: facts.repo.collectedAt,
    headSha: facts.repo.headSha,
    dimensions,
    overall,
    grade: gradeFor(overall),
    unverified: dimensions.filter((d) => d.score === null).map((d) => d.key),
    sample: {
      commits: facts.commits.length,
      mergedPullRequests: facts.pullRequests.length,
      commitsTruncated: facts.limits.commitsTruncated,
      pullRequestsTruncated: facts.limits.pullRequestsTruncated,
    },
  };
}
