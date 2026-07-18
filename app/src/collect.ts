/**
 * Collector: GitHub REST API → RepoFacts.
 *
 * Privacy boundary lives here: raw messages/bodies are reduced to derived
 * flags and lengths in this module and never stored on the facts object.
 */
import { GithubClient } from "./github.js";
import { isBotLogin, scanCoAuthorTrailers } from "./agents.js";
import type { CommitFact, PullRequestFact, RepoFacts, ReviewFact } from "./types.js";

export interface CollectOptions {
  maxCommits?: number;
  maxPullRequests?: number;
  /** Injected clock for provenance stamping (determinism in tests). */
  now?: () => string;
}

const DEFAULT_MAX_COMMITS = 300;
const DEFAULT_MAX_PRS = 50;

const ISSUE_REF = /(?:^|\s)#\d+\b|github\.com\/[^\s)]+\/issues\/\d+/;
const PLAN_DOC_REF = /\bplans?\/[\w./-]+\.md\b|\bplan note\b|\bdesign doc\b|\brfc\b/i;

interface ApiRepo {
  default_branch: string;
  private: boolean;
}
interface ApiCommitListItem {
  sha: string;
  commit: { message: string; committer: { date: string | null } | null };
  author: { login: string; type: string } | null;
}
interface ApiPullListItem {
  number: number;
  merged_at: string | null;
}
interface ApiPull {
  number: number;
  body: string | null;
  user: { login: string; type: string } | null;
  created_at: string;
  merged_at: string | null;
  merged_by: { login: string; type: string } | null;
  additions: number;
  deletions: number;
  changed_files: number;
  commits: number;
  head: { sha: string };
}
interface ApiReview {
  user: { login: string; type: string } | null;
  state: string;
  submitted_at: string | null;
}
interface ApiPullCommit {
  commit: { committer: { date: string | null } | null };
}
interface ApiCheckRuns {
  total_count: number;
  check_runs: { conclusion: string | null }[];
}
interface ApiContentEntry {
  name: string;
  type: string;
}

function isBotUser(user: { login: string; type: string } | null): boolean {
  if (!user) return false;
  return user.type === "Bot" || isBotLogin(user.login);
}

export async function collectRepoFacts(
  client: GithubClient,
  owner: string,
  name: string,
  opts: CollectOptions = {},
): Promise<RepoFacts> {
  const maxCommits = opts.maxCommits ?? DEFAULT_MAX_COMMITS;
  const maxPullRequests = opts.maxPullRequests ?? DEFAULT_MAX_PRS;
  const now = opts.now ?? (() => new Date().toISOString());
  const base = `/repos/${owner}/${name}`;

  const repo = await client.get<ApiRepo>(base);

  const rawCommits = await client.paginate<ApiCommitListItem>(
    `${base}/commits?sha=${encodeURIComponent(repo.default_branch)}`,
    maxCommits + 1,
  );
  const commits: CommitFact[] = rawCommits.slice(0, maxCommits).map((c) => {
    const trailers = scanCoAuthorTrailers(c.commit.message);
    return {
      sha: c.sha,
      authorLogin: c.author?.login ?? null,
      authorIsBot: isBotUser(c.author),
      hasAgentCoAuthorTrailer: trailers.hasAgentCoAuthorTrailer,
      hasAnyCoAuthorTrailer: trailers.hasAnyCoAuthorTrailer,
      committedAt: c.commit.committer?.date ?? null,
    };
  });

  const closedPulls = await client.paginate<ApiPullListItem>(
    `${base}/pulls?state=closed&sort=updated&direction=desc`,
    200,
  );
  const mergedNumbers = closedPulls.filter((p) => p.merged_at !== null).map((p) => p.number);
  const pullRequestsTruncated = mergedNumbers.length > maxPullRequests;
  const pullRequests: PullRequestFact[] = [];
  for (const number of mergedNumbers.slice(0, maxPullRequests)) {
    pullRequests.push(await collectPullFacts(client, base, number));
  }

  const workflowEntries = await client.getOrNull<ApiContentEntry[]>(
    `${base}/contents/.github/workflows`,
  );
  const workflowFiles = Array.isArray(workflowEntries)
    ? workflowEntries.filter((e) => e.type === "file" && /\.ya?ml$/.test(e.name))
    : [];

  return {
    repo: {
      owner,
      name,
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      collectedAt: now(),
      headSha: commits[0]?.sha ?? null,
    },
    commits,
    pullRequests,
    workflows: {
      hasWorkflowDir: workflowEntries !== null,
      workflowFileCount: workflowFiles.length,
    },
    limits: {
      maxCommits,
      maxPullRequests,
      commitsTruncated: rawCommits.length > maxCommits,
      pullRequestsTruncated,
    },
  };
}

async function collectPullFacts(
  client: GithubClient,
  base: string,
  number: number,
): Promise<PullRequestFact> {
  const pull = await client.get<ApiPull>(`${base}/pulls/${number}`);
  const rawReviews = await client.paginate<ApiReview>(`${base}/pulls/${number}/reviews`, 100);
  const pullCommits = await client.paginate<ApiPullCommit>(
    `${base}/pulls/${number}/commits`,
    250,
  );

  const authorLogin = pull.user?.login ?? null;
  const reviews: ReviewFact[] = rawReviews
    .filter((r) => (r.user?.login ?? null) !== authorLogin)
    .map((r) => ({
      reviewerLogin: r.user?.login ?? null,
      reviewerIsBot: isBotUser(r.user),
      state: (r.state as ReviewFact["state"]) ?? "COMMENTED",
      submittedAt: r.submitted_at,
    }));

  const commitDates = pullCommits
    .map((c) => c.commit.committer?.date ?? null)
    .filter((d): d is string => d !== null)
    .sort();
  const firstReviewAt = reviews
    .map((r) => r.submittedAt)
    .filter((d): d is string => d !== null)
    .sort()[0];
  const commitsAfterFirstReview = firstReviewAt
    ? commitDates.filter((d) => d > firstReviewAt).length
    : 0;

  const checkRuns = await client.getOrNull<ApiCheckRuns>(
    `${base}/commits/${pull.head.sha}/check-runs`,
  );
  const checks =
    checkRuns === null
      ? null
      : {
          total: checkRuns.total_count,
          passed: checkRuns.check_runs.filter(
            (r) => r.conclusion === "success" || r.conclusion === "skipped",
          ).length,
        };

  const body = pull.body ?? "";
  return {
    number: pull.number,
    authorLogin,
    authorIsBot: isBotUser(pull.user),
    bodyLength: body.length,
    bodyRefsIssue: ISSUE_REF.test(body),
    bodyRefsPlanDoc: PLAN_DOC_REF.test(body),
    createdAt: pull.created_at,
    mergedAt: pull.merged_at,
    mergedByLogin: pull.merged_by?.login ?? null,
    mergedByIsBot: isBotUser(pull.merged_by),
    additions: pull.additions,
    deletions: pull.deletions,
    changedFiles: pull.changed_files,
    commitCount: pull.commits,
    firstCommitAt: commitDates[0] ?? null,
    reviews,
    commitsAfterFirstReview,
    checks,
  };
}
