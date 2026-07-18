/** Scoreboard + reports index rendering, and README scoreboard block update. */
import type { ScoreReport } from "../types.js";

export interface ScoreboardRow {
  repo: string;
  overall: number | null;
  grade: string;
  /** Path of the rendered report, relative to the link site. */
  reportPath: string;
  isPrivate: boolean;
}

export function toScoreboardRow(report: ScoreReport, isPrivate: boolean): ScoreboardRow {
  const slug = report.repo.split("/")[1] ?? report.repo;
  return {
    repo: report.repo,
    overall: report.overall,
    grade: report.grade,
    reportPath: `reports/${slug}.md`,
    isPrivate,
  };
}

/** Sort: scored rows descending, then unscorable, alphabetical within ties. */
export function sortRows(rows: ScoreboardRow[]): ScoreboardRow[] {
  return [...rows].sort((a, b) => {
    if (a.overall !== null && b.overall !== null && a.overall !== b.overall) {
      return b.overall - a.overall;
    }
    if ((a.overall === null) !== (b.overall === null)) return a.overall === null ? 1 : -1;
    // Code-point compare, not localeCompare: byte-determinism across runtimes.
    return a.repo < b.repo ? -1 : a.repo > b.repo ? 1 : 0;
  });
}

export function renderScoreboardTable(rows: ScoreboardRow[], linkPrefix = ""): string {
  const lines = ["| Repo | Score | Grade | Report |", "|------|-------|-------|--------|"];
  for (const row of sortRows(rows)) {
    const name = row.repo + (row.isPrivate ? " (private)" : "");
    const score = row.overall === null ? "unscorable" : `${row.overall}/100`;
    lines.push(`| ${name} | ${score} | ${row.grade} | [report](${linkPrefix}${row.reportPath}) |`);
  }
  return lines.join("\n");
}

export function renderReportsIndex(rows: ScoreboardRow[], generatedAt: string): string {
  const lines: string[] = [];
  lines.push("# Fleet audit reports");
  lines.push("");
  lines.push(
    "One deterministic, scored engineering report per audited repo. Private repos are audited locally with an owner-scoped token; only aggregate metrics are published, and every report is human-approved before it lands here.",
  );
  lines.push("");
  lines.push(renderScoreboardTable(rows, "../"));
  lines.push("");
  lines.push(`_Last regenerated: ${generatedAt}. Unflattering scores stay in — the credibility is the honesty._`);
  lines.push("");
  return lines.join("\n");
}

export const SCOREBOARD_START = "<!-- scoreboard:start -->";
export const SCOREBOARD_END = "<!-- scoreboard:end -->";

/** Replace the scoreboard block between markers. Throws if markers missing. */
export function updateReadmeScoreboard(readme: string, table: string): string {
  const start = readme.indexOf(SCOREBOARD_START);
  const end = readme.indexOf(SCOREBOARD_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("README scoreboard markers not found or malformed.");
  }
  return (
    readme.slice(0, start + SCOREBOARD_START.length) +
    "\n" +
    table +
    "\n" +
    readme.slice(end)
  );
}
