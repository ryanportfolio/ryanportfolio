/**
 * Normalized repo facts.
 *
 * PRIVACY BOUNDARY: facts hold derived aggregates and booleans only. Never
 * commit-message bodies, PR titles/bodies, file contents, diffs, or config
 * values. Reports are rendered from facts, so what isn't collected here
 * cannot leak into a published report.
 */

export interface RepoFacts {
  repo: {
    owner: string;
    name: string;
    defaultBranch: string;
    isPrivate: boolean;
    /** ISO timestamp of collection — recorded for provenance, never used in scoring. */
    collectedAt: string;
    headSha: string | null;
  };
  /** Recent commits on the default branch (newest first). */
  commits: CommitFact[];
  /** Recent merged PRs (newest first). */
  pullRequests: PullRequestFact[];
  workflows: {
    hasWorkflowDir: boolean;
    workflowFileCount: number;
  };
  limits: {
    maxCommits: number;
    maxPullRequests: number;
    commitsTruncated: boolean;
    pullRequestsTruncated: boolean;
  };
}

export interface CommitFact {
  sha: string;
  authorLogin: string | null;
  authorIsBot: boolean;
  /** Derived from Co-Authored-By trailers; the message body itself is discarded. */
  hasAgentCoAuthorTrailer: boolean;
  hasAnyCoAuthorTrailer: boolean;
  committedAt: string | null;
}

export interface ReviewFact {
  reviewerLogin: string | null;
  reviewerIsBot: boolean;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING";
  submittedAt: string | null;
}

export interface PullRequestFact {
  number: number;
  authorLogin: string | null;
  authorIsBot: boolean;
  /** Length only — the body text is discarded at collection. */
  bodyLength: number;
  bodyRefsIssue: boolean;
  bodyRefsPlanDoc: boolean;
  createdAt: string;
  mergedAt: string | null;
  mergedByLogin: string | null;
  mergedByIsBot: boolean;
  additions: number;
  deletions: number;
  changedFiles: number;
  commitCount: number;
  firstCommitAt: string | null;
  reviews: ReviewFact[];
  /** Commits pushed after the first non-author review was submitted. */
  commitsAfterFirstReview: number;
  /** Check-run outcome for the head SHA; null = could not verify. */
  checks: { total: number; passed: number } | null;
}

/** A scored dimension. `score` null = could not verify (never guessed). */
export interface DimensionResult {
  key: string;
  label: string;
  /** 0–100, or null when the underlying signal could not be verified. */
  score: number | null;
  weight: number;
  /** Human-readable basis for the score — aggregate numbers only. */
  detail: string;
  /** Context metrics (aggregates only), for the report. */
  metrics: Record<string, number | string | null>;
}

export interface ScoreReport {
  repo: string;
  collectedAt: string;
  headSha: string | null;
  dimensions: DimensionResult[];
  /** Weighted mean over non-null dimensions, weights renormalized. */
  overall: number | null;
  grade: "Elite" | "Strong" | "Developing" | "Early" | "Ad-hoc" | "Unscorable";
  /** Dimensions excluded from the rollup as unverifiable. */
  unverified: string[];
  sample: {
    commits: number;
    mergedPullRequests: number;
    commitsTruncated: boolean;
    pullRequestsTruncated: boolean;
  };
}
