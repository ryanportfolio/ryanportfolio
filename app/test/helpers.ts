import type { CommitFact, PullRequestFact, RepoFacts, ReviewFact } from "../src/types.js";

export function makeCommit(overrides: Partial<CommitFact> = {}): CommitFact {
  return {
    sha: "abc1234",
    authorLogin: "ryan",
    authorIsBot: false,
    hasAgentCoAuthorTrailer: false,
    hasAnyCoAuthorTrailer: false,
    committedAt: "2026-01-10T12:00:00Z",
    ...overrides,
  };
}

export function makeReview(overrides: Partial<ReviewFact> = {}): ReviewFact {
  return {
    reviewerLogin: "reviewer-bot[bot]",
    reviewerIsBot: true,
    state: "CHANGES_REQUESTED",
    submittedAt: "2026-01-11T12:00:00Z",
    ...overrides,
  };
}

export function makePull(overrides: Partial<PullRequestFact> = {}): PullRequestFact {
  return {
    number: 1,
    authorLogin: "ryan",
    authorIsBot: false,
    bodyLength: 400,
    bodyRefsIssue: true,
    bodyRefsPlanDoc: true,
    createdAt: "2026-01-10T12:00:00Z",
    mergedAt: "2026-01-12T12:00:00Z",
    mergedByLogin: "ryan",
    mergedByIsBot: false,
    additions: 80,
    deletions: 20,
    changedFiles: 4,
    commitCount: 3,
    firstCommitAt: "2026-01-10T09:00:00Z",
    reviews: [makeReview()],
    commitsAfterFirstReview: 1,
    checks: { total: 2, passed: 2 },
    ...overrides,
  };
}

export function makeFacts(overrides: Partial<RepoFacts> = {}): RepoFacts {
  return {
    repo: {
      owner: "ryanportfolio",
      name: "example",
      defaultBranch: "main",
      isPrivate: false,
      collectedAt: "2026-02-01T00:00:00Z",
      headSha: "abc1234",
    },
    commits: [makeCommit()],
    pullRequests: [makePull()],
    workflows: { hasWorkflowDir: true, workflowFileCount: 2 },
    limits: {
      maxCommits: 300,
      maxPullRequests: 50,
      commitsTruncated: false,
      pullRequestsTruncated: false,
    },
    ...overrides,
  };
}
