#!/usr/bin/env node
/** CLI: agentic-audit <owner>/<repo> [--json <file>] */
import { writeFileSync } from "node:fs";
import process from "node:process";
import { collectRepoFacts } from "./collect.js";
import { GithubClient } from "./github.js";
import { renderReportMarkdown } from "./report/render.js";
import { scoreRepo } from "./score/index.js";
import type { ScoreReport } from "./types.js";

function usage(): never {
  console.error("Usage: agentic-audit <owner>/<repo> [--json <file>] [--report <file.md>]");
  process.exit(2);
}

function renderTable(report: ScoreReport): string {
  const lines: string[] = [];
  lines.push(`Repo:      ${report.repo}`);
  lines.push(`Collected: ${report.collectedAt} @ ${report.headSha ?? "(no commits)"}`);
  lines.push(
    `Sample:    ${report.sample.commits} commits${report.sample.commitsTruncated ? " (truncated)" : ""}, ${report.sample.mergedPullRequests} merged PRs${report.sample.pullRequestsTruncated ? " (truncated)" : ""}`,
  );
  lines.push("");
  const width = Math.max(...report.dimensions.map((d) => d.label.length));
  for (const d of report.dimensions) {
    const score = d.score === null ? "could not verify" : `${d.score}/100`;
    lines.push(`${d.label.padEnd(width)}  ${score.padStart(16)}  (weight ${d.weight})`);
  }
  lines.push("");
  lines.push(
    `Overall:   ${report.overall === null ? "unscorable" : `${report.overall}/100`}  →  ${report.grade}`,
  );
  if (report.unverified.length > 0) {
    lines.push(`Unverified (excluded from rollup): ${report.unverified.join(", ")}`);
  }
  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const target = args[0];
  if (!target || !/^[\w.-]+\/[\w.-]+$/.test(target)) usage();
  const jsonIdx = args.indexOf("--json");
  const jsonPath = jsonIdx >= 0 ? args[jsonIdx + 1] : undefined;
  if (jsonIdx >= 0 && !jsonPath) usage();
  const reportIdx = args.indexOf("--report");
  const reportPath = reportIdx >= 0 ? args[reportIdx + 1] : undefined;
  if (reportIdx >= 0 && !reportPath) usage();

  const [owner, name] = target.split("/") as [string, string];
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  const client = new GithubClient({ token });

  console.error(`Collecting facts for ${owner}/${name}...`);
  const facts = await collectRepoFacts(client, owner, name);
  const report = scoreRepo(facts);

  if (jsonPath) {
    writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n");
    console.error(`Report JSON written to ${jsonPath}`);
  }
  if (reportPath) {
    writeFileSync(reportPath, renderReportMarkdown(report));
    console.error(`Markdown report written to ${reportPath}`);
  }
  console.log(renderTable(report));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
