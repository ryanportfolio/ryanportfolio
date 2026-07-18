#!/usr/bin/env node
/**
 * Fleet runner: audit every configured repo and write reports/ + scoreboard.
 *
 * Run locally with an owner-scoped token (private repos are never touched by
 * CI). Output lands in the working tree only; publication happens through a
 * human-reviewed, human-merged PR, and every report is approved by the owner
 * before it is committed. The config file is local and gitignored because it
 * names private repos, including excluded ones that must never appear
 * publicly.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { collectRepoFacts } from "./collect.js";
import { GithubClient } from "./github.js";
import { jsonArtifactName, publicReportJson } from "./report/public.js";
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
  /** Optional owner attestations per repo name. Rendered under an explicit
   * "stated, not verified, not scored" label. */
  attestations?: Record<string, string>;
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

/**
 * Write the per-repo artifacts. Exported for tests: the JSON artifact MUST
 * go through the allowlist projection (publicReportJson) and sanitized
 * filenames must not collide across the fleet.
 */
export function writeReportArtifacts(
  reportsDir: string,
  name: string,
  report: ReturnType<typeof scoreRepo>,
  written: Map<string, string> = new Map(),
  attestation: string | null = null,
): void {
  // Absent, empty, and whitespace-only all mean "no attestation".
  attestation = attestation?.trim() || null;
  const jsonName = jsonArtifactName(name);
  const prior = written.get(jsonName);
  if (prior !== undefined) {
    throw new Error(`artifact collision: "${prior}" and "${name}" both map to ${jsonName}`);
  }
  written.set(jsonName, name);
  writeFileSync(resolve(reportsDir, `${name}.md`), renderReportMarkdown(report, attestation));
  const dataDir = resolve(reportsDir, "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(resolve(dataDir, jsonName), publicReportJson(report, attestation));
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
  const writtenArtifacts = new Map<string, string>();
  for (const name of config.include) {
    if (excluded.has(name.toLowerCase())) {
      console.error(`skip ${name}: on the exclude list: never audited, never published.`);
      continue;
    }
    console.error(`auditing ${config.owner}/${name}...`);
    const facts = await collectRepoFacts(client, config.owner, name);
    const report = scoreRepo(facts);
    writeReportArtifacts(
      reportsDir,
      name,
      report,
      writtenArtifacts,
      config.attestations?.[name] ?? null,
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
    `\nDone: ${rows.length} report(s) rendered into the working tree. Review every page, then publish via PR. Nothing is public until the owner merges.`,
  );
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
