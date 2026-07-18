import { describe, expect, it } from "vitest";
import { gradeFor, scoreRepo } from "../src/score/index.js";
import { makeFacts, makePull } from "./helpers.js";

describe("scoreRepo", () => {
  it("produces a deterministic report: same facts → identical JSON", () => {
    const facts = makeFacts();
    const a = JSON.stringify(scoreRepo(facts));
    const b = JSON.stringify(scoreRepo(facts));
    expect(a).toBe(b);
  });

  it("marks unverifiable dimensions null and lists them", () => {
    const facts = makeFacts({ pullRequests: [] }); // most PR dims unverifiable
    const report = scoreRepo(facts);
    expect(report.unverified.length).toBeGreaterThan(0);
    for (const key of report.unverified) {
      const dim = report.dimensions.find((d) => d.key === key);
      expect(dim?.score).toBeNull();
    }
  });

  it("too little verified signal → Unscorable, not a flattering rollup", () => {
    // only agent_attribution (0.1) + ci_gate (0.15) scorable = 0.25 weight < 0.5
    const facts = makeFacts({ pullRequests: [] });
    const report = scoreRepo(facts);
    expect(report.overall).toBeNull();
    expect(report.grade).toBe("Unscorable");
  });

  it("empty repo → unscorable, never guessed", () => {
    const facts = makeFacts({
      commits: [],
      pullRequests: [],
      workflows: { hasWorkflowDir: false, workflowFileCount: 0 },
    });
    const report = scoreRepo(facts);
    expect(report.overall).toBeNull();
    expect(report.grade).toBe("Unscorable");
  });

  it("healthy fixture rolls up to a high grade", () => {
    const facts = makeFacts({
      pullRequests: [makePull(), makePull({ number: 2 }), makePull({ number: 3 })],
    });
    const report = scoreRepo(facts);
    expect(report.overall).toBeGreaterThanOrEqual(75);
    expect(["Elite", "Strong"]).toContain(report.grade);
  });
});

describe("gradeFor", () => {
  it("bands are stable", () => {
    expect(gradeFor(null)).toBe("Unscorable");
    expect(gradeFor(95)).toBe("Elite");
    expect(gradeFor(80)).toBe("Strong");
    expect(gradeFor(65)).toBe("Developing");
    expect(gradeFor(45)).toBe("Early");
    expect(gradeFor(20)).toBe("Ad-hoc");
  });
});
