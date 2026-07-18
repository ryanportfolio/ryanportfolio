#!/usr/bin/env node
/**
 * Fleet runner: audit every configured repo and write reports/ + scoreboard.
 *
 * Run locally with an owner-scoped token (private repos are never touched by
 * CI). Output lands in the working tree only — publication happens through a
 * human-reviewed, human-merged PR, and every report is approved by the owner
 * before it is committed. The config file is local and gitignored because it
 * names private repos, including excluded ones that must never appear
 * publicly.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { collectRepoFacts } from "./collect.js";
import { GithubClient } from "./github.js";
import { renderReportMarkdown } from "./report/render.js";
import {
  renderReportsIndex,
  renderScoreboardTable,
  toScoreboardRow,
  updateReadmeScoreboard,
  type ScoreboardRow,
} from "./report/scoreboard.js";
import { scoreRepo } from "./score/index.js";

interface FleetConfig {
  owner: string;
  /** Repos to audit and (after human approval) publish. */
  include: string[];
  /** Do-not-feature list: refused even if also present in include. */
  exclude: string[];
}

const appDir = resolve(import.meta.dirname, "..");
const repoRoot = resolve(appDir, "..");
const configPath = resolve(appDir, "fleet.config.json");

function loadConfig(): FleetConfig {
  if (!existsSync(configPath)) {
    console.error(
      "app/fleet.config.json not found. Copy fleet.config.example.json and fill in the include/exclude lists (the file is gitignored: it names private repos).",
    );
    process.exit(2);
  }
  const raw = JSON.parse(readFileSync(configPath, "utf8")) as Partial<FleetConfig>;
  if (!raw.owner || !Array.isArray(raw.include) || !Array.isArray(raw.exclude)) {
    console.error(
      "fleet.config.json must declare owner, include[], and an explicit exclude[] (empty only if the owner truly excludes nothing).",
    );
    process.exit(2);
  }
  return raw as FleetConfig;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN/GH_TOKEN required: the fleet includes private repos.");
    process.exit(2);
  }
  const client = new GithubClient({ token });
  const excluded = new Set(config.exclude.map((r) => r.toLowerCase()));

  const reportsDir = resolve(repoRoot, "reports");
  mkdirSync(reportsDir, { recursive: true });

  const rows: ScoreboardRow[] = [];
  for (const name of config.include) {
    if (excluded.has(name.toLowerCase())) {
      console.error(`skip ${name}: on the exclude list — never audited, never published.`);
      continue;
    }
    console.error(`auditing ${config.owner}/${name}...`);
    const facts = await collectRepoFacts(client, config.owner, name);
    const report = scoreRepo(facts);
    const markdown = renderReportMarkdown(report);
    const outPath = resolve(reportsDir, `${name}.md`);
    writeFileSync(outPath, markdown);
    const dataDir = resolve(reportsDir, "data");
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(
      resolve(dataDir, `${name}.json`),
      JSON.stringify(report, null, 2) + "\n",
    );
    rows.push(toScoreboardRow(report, facts.repo.isPrivate));
    console.error(
      `  → ${report.overall === null ? "unscorable" : report.overall + "/100"} (${report.grade}) written to reports/${name}.md`,
    );
  }

  const generatedAt = new Date().toISOString();
  writeFileSync(resolve(reportsDir, "README.md"), renderReportsIndex(rows, generatedAt));

  const readmePath = resolve(repoRoot, "README.md");
  const readme = readFileSync(readmePath, "utf8");
  writeFileSync(readmePath, updateReadmeScoreboard(readme, renderScoreboardTable(rows)));

  console.error(
    `\nDone: ${rows.length} report(s) rendered into the working tree. Review every page, then publish via PR — nothing is public until the owner merges.`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
