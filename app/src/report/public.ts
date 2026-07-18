/**
 * Public projection of a ScoreReport for the published JSON artifacts.
 *
 * PRIVACY ENFORCEMENT, not trust: JSON.stringify(report) would publish
 * whatever the object carries now and forever. This allowlist projection is
 * the only path to reports/data/*.json — a field added to ScoreReport in a
 * future PR stays private until it is added here (and to the key-set test)
 * on purpose.
 */
import type { DimensionResult, ScoreReport } from "../types.js";

export interface PublicDimension {
  key: string;
  label: string;
  score: number | null;
  weight: number;
  detail: string;
  metrics: Record<string, number | string | null>;
}

export interface PublicReport {
  repo: string;
  collectedAt: string;
  headSha: string | null;
  overall: number | null;
  grade: ScoreReport["grade"];
  unverified: string[];
  sample: ScoreReport["sample"];
  dimensions: PublicDimension[];
}

function projectDimension(d: DimensionResult): PublicDimension {
  return {
    key: d.key,
    label: d.label,
    score: d.score,
    weight: d.weight,
    detail: d.detail,
    metrics: Object.fromEntries(
      Object.entries(d.metrics).filter(
        ([, v]) => v === null || typeof v === "number" || typeof v === "string",
      ),
    ),
  };
}

export function toPublicReport(report: ScoreReport): PublicReport {
  return {
    repo: report.repo,
    collectedAt: report.collectedAt,
    headSha: report.headSha,
    overall: report.overall,
    grade: report.grade,
    unverified: [...report.unverified],
    sample: {
      commits: report.sample.commits,
      mergedPullRequests: report.sample.mergedPullRequests,
      commitsTruncated: report.sample.commitsTruncated,
      pullRequestsTruncated: report.sample.pullRequestsTruncated,
    },
    dimensions: report.dimensions.map(projectDimension),
  };
}

/** Serialized public artifact — the only string fleet.ts writes to reports/data/. */
export function publicReportJson(report: ScoreReport): string {
  return JSON.stringify(toPublicReport(report), null, 2) + "\n";
}

/** Sanitized artifact filename, consistent with the site's HTML slug rules. */
export function jsonArtifactName(repoName: string): string {
  return `${repoName.toLowerCase().replace(/[^a-z0-9._-]/g, "-")}.json`;
}
