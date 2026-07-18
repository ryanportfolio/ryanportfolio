import { describe, expect, it } from "vitest";
import { collectRepoFacts } from "../src/collect.js";
import { GithubClient, type FetchLike } from "../src/github.js";

/** Route-table fetch stub keyed by path prefix (query string stripped). */
function stubFetch(routes: Record<string, unknown>): FetchLike {
  return async (url) => {
    const path = new URL(url).pathname;
    if (path in routes) {
      return new Response(JSON.stringify(routes[path]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("{}", { status: 404 });
  };
}

const routes: Record<string, unknown> = {
  "/repos/o/r": { default_branch: "main", private: false },
  "/repos/o/r/commits": [
    {
      sha: "aaa",
      commit: {
        message: "feat: x\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>",
        committer: { date: "2026-01-02T00:00:00Z" },
      },
      author: { login: "ryan", type: "User" },
    },
    {
      sha: "bbb",
      commit: { message: "chore: y", committer: { date: "2026-01-01T00:00:00Z" } },
      author: null,
    },
  ],
  "/repos/o/r/pulls": [
    { number: 7, merged_at: "2026-01-02T10:00:00Z" },
    { number: 6, merged_at: null }, // closed unmerged: excluded
  ],
  "/repos/o/r/pulls/7": {
    number: 7,
    body: "Implements plans/0001-x.md for #3",
    user: { login: "ryan", type: "User" },
    created_at: "2026-01-01T00:00:00Z",
    merged_at: "2026-01-02T10:00:00Z",
    merged_by: { login: "ryan", type: "User" },
    additions: 100,
    deletions: 10,
    changed_files: 5,
    commits: 2,
    head: { sha: "aaa" },
  },
  "/repos/o/r/pulls/7/reviews": [
    {
      user: { login: "reviewer[bot]", type: "Bot" },
      state: "CHANGES_REQUESTED",
      submitted_at: "2026-01-01T12:00:00Z",
    },
    // self-review by the author must be excluded
    { user: { login: "ryan", type: "User" }, state: "COMMENTED", submitted_at: "2026-01-01T13:00:00Z" },
  ],
  "/repos/o/r/pulls/7/commits": [
    { commit: { committer: { date: "2026-01-01T09:00:00Z" } } },
    { commit: { committer: { date: "2026-01-01T15:00:00Z" } } }, // after first review
  ],
  "/repos/o/r/commits/aaa/check-runs": {
    total_count: 2,
    check_runs: [{ conclusion: "success" }, { conclusion: "failure" }],
  },
  "/repos/o/r/contents/.github/workflows": [
    { name: "gate.yml", type: "file" },
    { name: "README.md", type: "file" },
  ],
};

describe("collectRepoFacts", () => {
  it("normalizes API responses into privacy-safe facts", async () => {
    const client = new GithubClient({ fetchImpl: stubFetch(routes) });
    const facts = await collectRepoFacts(client, "o", "r", {
      now: () => "2026-02-01T00:00:00Z",
    });

    expect(facts.repo.headSha).toBe("aaa");
    expect(facts.commits).toHaveLength(2);
    expect(facts.commits[0]?.hasAgentCoAuthorTrailer).toBe(true);
    // privacy: no message/body fields survive collection
    expect(JSON.stringify(facts)).not.toContain("feat: x");
    expect(JSON.stringify(facts)).not.toContain("Implements plans/");

    expect(facts.pullRequests).toHaveLength(1);
    const pr = facts.pullRequests[0]!;
    expect(pr.number).toBe(7);
    expect(pr.bodyRefsIssue).toBe(true);
    expect(pr.bodyRefsPlanDoc).toBe(true);
    expect(pr.reviews).toHaveLength(1); // self-review excluded
    expect(pr.commitsAfterFirstReview).toBe(1);
    expect(pr.checks).toEqual({ total: 2, passed: 1 });
    expect(pr.firstCommitAt).toBe("2026-01-01T09:00:00Z");

    expect(facts.workflows.workflowFileCount).toBe(1); // only .yml files
    expect(facts.repo.collectedAt).toBe("2026-02-01T00:00:00Z");
  });

  it("missing workflows dir → hasWorkflowDir false", async () => {
    const { ["/repos/o/r/contents/.github/workflows"]: _omit, ...withoutWorkflows } = routes;
    const client = new GithubClient({ fetchImpl: stubFetch(withoutWorkflows) });
    const facts = await collectRepoFacts(client, "o", "r", {
      now: () => "2026-02-01T00:00:00Z",
    });
    expect(facts.workflows).toEqual({ hasWorkflowDir: false, workflowFileCount: 0 });
  });
});
