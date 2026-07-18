import { describe, expect, it } from "vitest";
import { jsonArtifactName, publicReportJson, toPublicReport } from "../src/report/public.js";
import { scoreRepo } from "../src/score/index.js";
import { makeFacts, makePull } from "./helpers.js";

const report = scoreRepo(makeFacts({ pullRequests: [makePull(), makePull({ number: 2 })] }));

describe("toPublicReport (privacy projection)", () => {
  it("emits exactly the allowlisted top-level keys, nothing rides along", () => {
    const pub = toPublicReport(report);
    expect(Object.keys(pub).sort()).toEqual([
      "collectedAt",
      "dimensions",
      "grade",
      "headSha",
      "overall",
      "repo",
      "sample",
      "unverified",
    ]);
    for (const d of pub.dimensions) {
      expect(Object.keys(d).sort()).toEqual([
        "detail",
        "key",
        "label",
        "metrics",
        "score",
        "weight",
      ]);
    }
  });

  it("a field added to ScoreReport does NOT leak into the artifact", () => {
    const tampered = { ...report, secretNotes: "private-repo details" } as never;
    const json = publicReportJson(tampered);
    expect(json).not.toContain("secretNotes");
    expect(json).not.toContain("private-repo details");
  });

  it("non-scalar metric values are dropped, scalars kept", () => {
    const tampered = structuredClone(report);
    (tampered.dimensions[0]!.metrics as Record<string, unknown>).blob = { nested: "data" };
    const pub = toPublicReport(tampered as never);
    expect(pub.dimensions[0]!.metrics).not.toHaveProperty("blob");
    expect(Object.keys(pub.dimensions[0]!.metrics).length).toBeGreaterThan(0);
  });

  it("artifact carries no code/diff/message-shaped content from realistic facts", () => {
    const json = publicReportJson(report);
    for (const forbidden of ["diff --git", "commit message", "function ", "```"]) {
      expect(json).not.toContain(forbidden);
    }
  });
});

describe("jsonArtifactName", () => {
  it("sanitizes to the same charset as html slugs", () => {
    expect(jsonArtifactName("My Repo!")).toBe("my-repo-.json");
    expect(jsonArtifactName("Thin.Repo")).toBe("thin.repo.json");
  });
});
