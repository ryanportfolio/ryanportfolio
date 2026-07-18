import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { writeReportArtifacts } from "../src/fleet.js";
import { scoreRepo } from "../src/score/index.js";
import { makeFacts, makePull } from "./helpers.js";

const dir = mkdtempSync(join(tmpdir(), "fleet-test-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const report = scoreRepo(makeFacts({ pullRequests: [makePull()] }));

describe("writeReportArtifacts", () => {
  it("JSON artifact goes through the allowlist projection, sanitized filename", () => {
    writeReportArtifacts(dir, "My Repo", report);
    const json = readFileSync(join(dir, "data", "my-repo.json"), "utf8");
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(Object.keys(parsed).sort()).toEqual([
      "collectedAt",
      "dimensions",
      "grade",
      "headSha",
      "overall",
      "repo",
      "sample",
      "unverified",
    ]);
    const md = readFileSync(join(dir, "My Repo.md"), "utf8");
    expect(md).toContain("# Agentic-SDLC audit");
  });

  it("colliding artifact filenames throw instead of overwriting", () => {
    const written = new Map<string, string>();
    writeReportArtifacts(dir, "range", report, written);
    expect(() => writeReportArtifacts(dir, "Range", report, written)).toThrow(
      /artifact collision/,
    );
  });
});
