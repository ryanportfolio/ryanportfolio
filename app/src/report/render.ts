/**
 * Report renderer: ScoreReport → publishable markdown.
 * Renders aggregates and provenance only; the privacy boundary is upstream
 * (collection never retains source excerpts, message bodies, or config).
 */
import type { ScoreReport } from "../types.js";
import {
  PLAIN_LIMITS,
  PLAIN_LIMITS_TITLE,
  PLAIN_MEANING,
  PLAIN_MEANING_TITLE,
  PLAIN_QUESTIONS,
} from "./plain.js";

function scoreCell(score: number | null): string {
  return score === null ? "could not verify" : `${score}/100`;
}

export function renderReportMarkdown(report: ScoreReport): string {
  const lines: string[] = [];
  lines.push(`# Agentic-SDLC audit: ${report.repo}`);
  lines.push("");
  lines.push(
    `**Overall: ${report.overall === null ? "Unscorable" : `${report.overall}/100`}, ${report.grade}**`,
  );
  lines.push("");
  lines.push(`- Collected: ${report.collectedAt}`);
  lines.push(`- Head commit: \`${report.headSha ?? "(no commits)"}\``);
  lines.push(
    `- Sample: ${report.sample.commits} commits${report.sample.commitsTruncated ? " (truncated at collection limit)" : ""}, ${report.sample.mergedPullRequests} merged PRs${report.sample.pullRequestsTruncated ? " (truncated at collection limit)" : ""}`,
  );
  lines.push("");
  lines.push(`## ${PLAIN_MEANING_TITLE}`);
  lines.push("");
  for (const p of PLAIN_MEANING) lines.push(p, "");
  lines.push("## Dimensions");
  lines.push("");
  lines.push("| Dimension | Score | Weight | Basis |");
  lines.push("|-----------|-------|--------|-------|");
  for (const d of report.dimensions) {
    lines.push(`| ${d.label} | ${scoreCell(d.score)} | ${d.weight} | ${d.detail} |`);
  }
  lines.push("");
  lines.push("In plain terms, each dimension asks:");
  lines.push("");
  for (const d of report.dimensions) {
    const q = PLAIN_QUESTIONS[d.key];
    if (q) lines.push(`- **${d.label}**: ${q}`);
  }
  lines.push("");

  const withMetrics = report.dimensions.filter((d) => Object.keys(d.metrics).length > 0);
  if (withMetrics.length > 0) {
    lines.push("## Context metrics");
    lines.push("");
    for (const d of withMetrics) {
      const parts = Object.entries(d.metrics).map(([k, v]) => `${k}=${v ?? "n/a"}`);
      lines.push(`- **${d.label}**: ${parts.join(", ")}`);
    }
    lines.push("");
  }

  if (report.unverified.length > 0) {
    lines.push("## Could not verify");
    lines.push("");
    lines.push(
      "The following dimensions had no verifiable signal in the sample. They are excluded from the overall score (weights renormalized) rather than guessed:",
    );
    lines.push("");
    for (const key of report.unverified) {
      const dim = report.dimensions.find((d) => d.key === key);
      lines.push(`- ${dim?.label ?? key}: ${dim?.detail ?? "no signal"}`);
    }
    lines.push("");
  }

  lines.push(`## ${PLAIN_LIMITS_TITLE}`);
  lines.push("");
  for (const p of PLAIN_LIMITS) lines.push(`- ${p}`);
  lines.push("");
  lines.push("## Methodology");
  lines.push("");
  lines.push(
    "Scores are computed deterministically from GitHub API metadata (commits, pull requests, reviews, check runs, workflow presence): same repo state, same score; no LLM in the scoring path. Reports contain aggregate metrics only: no source code, commit-message bodies, PR text, or configuration values are collected or published. Tool: [agentic-sdlc-audit](../app/).",
  );
  lines.push("");
  return lines.join("\n");
}
