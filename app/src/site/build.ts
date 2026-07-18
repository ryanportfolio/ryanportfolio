#!/usr/bin/env node
/** Site build entry: reports/data/*.json → site/dist/. */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ScoreReport } from "../types.js";
import { generateIndexHtml, generateReportHtml, slugOf } from "./generate.js";

const appDir = resolve(import.meta.dirname, "..", "..");
const repoRoot = resolve(appDir, "..");
const dataDir = resolve(repoRoot, "reports", "data");
const outDir = resolve(repoRoot, "site", "dist");

const reports: ScoreReport[] = existsSync(dataDir)
  ? readdirSync(dataDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => JSON.parse(readFileSync(resolve(dataDir, f), "utf8")) as ScoreReport)
  : [];

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "index.html"), generateIndexHtml(reports));
for (const report of reports) {
  writeFileSync(resolve(outDir, `${slugOf(report)}.html`), generateReportHtml(report));
}
console.log(`site/dist built: index + ${reports.length} report page(s).`);
