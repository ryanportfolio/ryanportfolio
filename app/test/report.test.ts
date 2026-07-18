import { describe, expect, it } from "vitest";
import { renderReportMarkdown } from "../src/report/render.js";
import {
  renderReportsIndex,
  renderScoreboardTable,
  sortRows,
  toScoreboardRow,
  updateReadmeScoreboard,
  SCOREBOARD_END,
  SCOREBOARD_START,
} from "../src/report/scoreboard.js";
import { gradeFor, scoreRepo } from "../src/score/index.js";
import { PLAIN_MEANING, PLAIN_QUESTIONS } from "../src/report/plain.js";
import { makeFacts, makePull } from "./helpers.js";

describe("renderReportMarkdown", () => {
  it("renders grade, provenance, dimensions, and methodology", () => {
    const report = scoreRepo(makeFacts());
    const md = renderReportMarkdown(report);
    expect(md).toContain("# Agentic-SDLC audit: ryanportfolio/example");
    expect(md).toContain(`, ${report.grade}**`);
    expect(md).toContain("Head commit: `abc1234`");
    expect(md).toContain("| Dimension | Score | Weight | Basis |");
    expect(md).toContain("## Methodology");
    expect(md).toContain("## What this score means");
    expect(md).toContain("process discipline, not code quality");
    expect(md).toContain("## What this score cannot see");
    expect(md).toContain("Solo accounts have a built-in blind spot");
    expect(md).toContain("In plain terms, each dimension asks:");
    expect(md).toContain(
      "- **Recorded review coverage**: Of the merged pull requests, how many carry a recorded review by anyone other than the author?",
    );
  });

  it("owner attestation renders labeled and unscored; absent renders nothing", () => {
    const report = scoreRepo(makeFacts());
    const md = renderReportMarkdown(report, "Reviews happen in fresh AI sessions.");
    expect(md).toContain("## Owner attestation");
    expect(md).toContain("has not verified this and it earns no score credit");
    expect(md).toContain("> Reviews happen in fresh AI sessions.");
    expect(renderReportMarkdown(report)).not.toContain("## Owner attestation");
  });

  it("multi-line attestations cannot escape the blockquote", () => {
    const report = scoreRepo(makeFacts());
    const md = renderReportMarkdown(report, "Audited.\n\n## CI gate\n\nVerified independently.");
    expect(md).toContain("> Audited.");
    expect(md).toContain("> ## CI gate");
    expect(md).not.toContain("\n## CI gate");
  });

  it("plain-language grade bands match the engine's gradeFor thresholds", () => {
    const sentence = PLAIN_MEANING.join(" ");
    for (const [score, grade] of [
      [90, "Elite"],
      [75, "Strong"],
      [60, "Developing"],
      [40, "Early"],
      [39.9, "Ad-hoc"],
    ] as const) {
      expect(gradeFor(score)).toBe(grade);
    }
    expect(sentence).toContain("90+ Elite");
    expect(sentence).toContain("75+ Strong");
    expect(sentence).toContain("60+ Developing");
    expect(sentence).toContain("40+ Early");
    expect(sentence).toContain("under 40 Ad-hoc");
    expect(sentence).toContain("could not verify");
  });

  it("every scored dimension has a plain question", () => {
    const report = scoreRepo(makeFacts());
    for (const d of report.dimensions) {
      expect(PLAIN_QUESTIONS[d.key as keyof typeof PLAIN_QUESTIONS], d.key).toBeTruthy();
    }
  });

  it("lists could-not-verify dimensions explicitly", () => {
    const report = scoreRepo(makeFacts({ pullRequests: [] }));
    const md = renderReportMarkdown(report);
    expect(md).toContain("## Could not verify");
    expect(md).toContain("could not verify");
    expect(md).toContain("**Overall: Unscorable");
  });

  it("notes sample truncation", () => {
    const facts = makeFacts();
    facts.limits.commitsTruncated = true;
    const md = renderReportMarkdown(scoreRepo(facts));
    expect(md).toContain("(truncated at collection limit)");
  });
});

describe("scoreboard", () => {
  const rows = [
    toScoreboardRow(scoreRepo(makeFacts()), true),
    {
      repo: "ryanportfolio/other",
      overall: null,
      grade: "Unscorable",
      reportPath: "reports/other.md",
      isPrivate: false,
    },
  ];

  it("sorts scored rows first, descending", () => {
    const sorted = sortRows(rows);
    expect(sorted[0]?.overall).not.toBeNull();
    expect(sorted[sorted.length - 1]?.overall).toBeNull();
  });

  it("renders table with privacy tag and report links", () => {
    const table = renderScoreboardTable(rows);
    expect(table).toContain("ryanportfolio/example (private)");
    expect(table).toContain("[report](reports/example.md)");
    expect(table).toContain("unscorable");
  });

  it("index includes honesty note and prefixed links", () => {
    const index = renderReportsIndex(rows, "2026-03-01T00:00:00Z");
    expect(index).toContain("[report](example.md)");
    expect(index).not.toContain("../reports/");
    expect(index).toContain("Unflattering scores stay in");
  });

  it("README block replacement is deterministic and idempotent", () => {
    const readme = `# hi\n\n${SCOREBOARD_START}\nold\n${SCOREBOARD_END}\n\ntail`;
    const table = renderScoreboardTable(rows);
    const once = updateReadmeScoreboard(readme, table);
    const twice = updateReadmeScoreboard(once, table);
    expect(once).toBe(twice);
    expect(once).toContain(table);
    expect(once).not.toContain("old");
    expect(once).toContain("tail");
  });

  it("throws when markers are missing", () => {
    expect(() => updateReadmeScoreboard("no markers", "t")).toThrow(/markers/);
  });
});

describe("privacy: rendered output carries no source text", () => {
  it("report built from realistic facts contains only aggregates", () => {
    const facts = makeFacts({ pullRequests: [makePull(), makePull({ number: 2 })] });
    const md = renderReportMarkdown(scoreRepo(facts));
    // Facts schema has no message/title/body/diff fields at all; assert the
    // renderer also never emits placeholders for them.
    for (const forbidden of ["commit message", "diff --git", "```"]) {
      expect(md).not.toContain(forbidden);
    }
  });
});
