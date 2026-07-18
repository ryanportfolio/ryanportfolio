import { describe, expect, it } from "vitest";
import {
  scoreAgentAttribution,
  scoreAuditTrail,
  scoreBatchSize,
  scoreCiGate,
  scoreHumanMergeGate,
  scoreLeadTime,
  scorePlanEvidence,
  scoreReviewCatchRate,
  scoreReviewCoverage,
} from "../src/score/dimensions.js";
import { makeCommit, makeFacts, makePull, makeReview } from "./helpers.js";

describe("agent_attribution", () => {
  it("scores share of attributable commits and reports agent share as context", () => {
    const facts = makeFacts({
      commits: [
        makeCommit({ authorLogin: "ryan" }),
        makeCommit({ authorLogin: null, hasAgentCoAuthorTrailer: true, hasAnyCoAuthorTrailer: true }),
        makeCommit({ authorLogin: null }),
        makeCommit({ authorLogin: null }),
      ],
    });
    const d = scoreAgentAttribution(facts);
    expect(d.score).toBe(50);
    expect(d.metrics.agent_involved_pct).toBe(25);
  });

  it("no commits → could not verify", () => {
    expect(scoreAgentAttribution(makeFacts({ commits: [] })).score).toBeNull();
  });
});

describe("review_coverage", () => {
  it("counts PRs with non-author reviews", () => {
    const facts = makeFacts({
      pullRequests: [makePull(), makePull({ number: 2, reviews: [] })],
    });
    const d = scoreReviewCoverage(facts);
    expect(d.score).toBe(50);
  });

  it("no merged PRs → could not verify", () => {
    expect(scoreReviewCoverage(makeFacts({ pullRequests: [] })).score).toBeNull();
  });
});

describe("review_catch_rate", () => {
  it("scores reviewed PRs with post-review commits", () => {
    const facts = makeFacts({
      pullRequests: [
        makePull({ commitsAfterFirstReview: 2 }),
        makePull({ number: 2, commitsAfterFirstReview: 0 }),
        makePull({ number: 3, reviews: [] }), // unreviewed, excluded from denominator
      ],
    });
    expect(scoreReviewCatchRate(facts).score).toBe(50);
  });

  it("no reviewed PRs → could not verify", () => {
    const facts = makeFacts({ pullRequests: [makePull({ reviews: [] })] });
    expect(scoreReviewCatchRate(facts).score).toBeNull();
  });
});

describe("human_merge_gate", () => {
  it("scores non-bot merges", () => {
    const facts = makeFacts({
      pullRequests: [
        makePull(),
        makePull({ number: 2, mergedByLogin: "merge-o-matic[bot]", mergedByIsBot: true }),
      ],
    });
    expect(scoreHumanMergeGate(facts).score).toBe(50);
  });

  it("unknown mergers → could not verify", () => {
    const facts = makeFacts({
      pullRequests: [makePull({ mergedByLogin: null, mergedByIsBot: false })],
    });
    expect(scoreHumanMergeGate(facts).score).toBeNull();
  });
});

describe("ci_gate", () => {
  it("workflows + all checks passing → 100", () => {
    expect(scoreCiGate(makeFacts()).score).toBe(100);
  });

  it("workflows but no check history → presence points only", () => {
    const facts = makeFacts({ pullRequests: [makePull({ checks: null })] });
    expect(scoreCiGate(facts).score).toBe(40);
  });

  it("no workflows, no PRs → could not verify", () => {
    const facts = makeFacts({
      pullRequests: [],
      workflows: { hasWorkflowDir: false, workflowFileCount: 0 },
    });
    expect(scoreCiGate(facts).score).toBeNull();
  });

  it("failing checks reduce history points", () => {
    const facts = makeFacts({
      pullRequests: [makePull(), makePull({ number: 2, checks: { total: 2, passed: 1 } })],
    });
    // presence 40 + 50% pass rate * 60 = 70
    expect(scoreCiGate(facts).score).toBe(70);
  });
});

describe("batch_size", () => {
  it("small median diff scores 100", () => {
    expect(scoreBatchSize(makeFacts()).score).toBe(100);
  });

  it("huge median diff scores at the floor", () => {
    const facts = makeFacts({
      pullRequests: [makePull({ additions: 5000, deletions: 1000 })],
    });
    expect(scoreBatchSize(facts).score).toBe(10);
  });
});

describe("lead_time", () => {
  it("fast merges score 100", () => {
    // helper: first commit 09:00 Jan 10 → merged 12:00 Jan 12 = 51h → 85 band
    expect(scoreLeadTime(makeFacts()).score).toBe(85);
    const fast = makeFacts({
      pullRequests: [makePull({ firstCommitAt: "2026-01-12T00:00:00Z" })],
    });
    expect(scoreLeadTime(fast).score).toBe(100);
  });

  it("missing timestamps → could not verify", () => {
    const facts = makeFacts({ pullRequests: [makePull({ firstCommitAt: null })] });
    expect(scoreLeadTime(facts).score).toBeNull();
  });
});

describe("plan_evidence", () => {
  it("scores PRs referencing issues or plan docs", () => {
    const facts = makeFacts({
      pullRequests: [
        makePull(),
        makePull({ number: 2, bodyRefsIssue: false, bodyRefsPlanDoc: false }),
      ],
    });
    expect(scorePlanEvidence(facts).score).toBe(50);
  });
});

describe("audit_trail", () => {
  it("full trail scores 100", () => {
    expect(scoreAuditTrail(makeFacts()).score).toBe(100);
  });

  it("bare PRs score 0", () => {
    const facts = makeFacts({
      pullRequests: [makePull({ bodyLength: 0, reviews: [], checks: null })],
    });
    expect(scoreAuditTrail(facts).score).toBe(0);
  });
});

describe("determinism", () => {
  it("same facts → identical result object", () => {
    const facts = makeFacts({
      pullRequests: [makePull(), makePull({ number: 2, reviews: [makeReview()] })],
    });
    const a = scoreReviewCoverage(facts);
    const b = scoreReviewCoverage(facts);
    expect(a).toEqual(b);
  });
});
