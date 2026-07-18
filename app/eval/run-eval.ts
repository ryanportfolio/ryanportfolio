/**
 * Eval harness: golden-report + determinism evals for the scoring core.
 *
 * Each app/eval/fixtures/<name>.facts.json is scored and byte-compared to
 * app/eval/goldens/<name>.report.json. Any scoring change that shifts any
 * number forces an explicit `--update` + reviewed golden diff in the PR.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { scoreRepo } from "../src/score/index.js";
import type { RepoFacts } from "../src/types.js";

const evalDir = resolve(import.meta.dirname);
const fixturesDir = resolve(evalDir, "fixtures");
const goldensDir = resolve(evalDir, "goldens");
const update = process.argv.includes("--update");

const fixtures = readdirSync(fixturesDir)
  .filter((f) => f.endsWith(".facts.json"))
  .sort();
if (fixtures.length === 0) {
  console.error("No fixtures found — eval lane is vacuous.");
  process.exit(1);
}

let failures = 0;
for (const file of fixtures) {
  const name = file.replace(/\.facts\.json$/, "");
  const facts = JSON.parse(readFileSync(resolve(fixturesDir, file), "utf8")) as RepoFacts;

  const first = JSON.stringify(scoreRepo(facts), null, 2) + "\n";
  const second = JSON.stringify(scoreRepo(facts), null, 2) + "\n";
  if (first !== second) {
    console.error(`FAIL ${name}: nondeterministic — two runs over identical facts differ.`);
    failures += 1;
    continue;
  }

  const goldenPath = resolve(goldensDir, `${name}.report.json`);
  if (update) {
    writeFileSync(goldenPath, first);
    console.log(`updated ${name}.report.json`);
    continue;
  }

  let golden: string;
  try {
    golden = readFileSync(goldenPath, "utf8");
  } catch {
    console.error(`FAIL ${name}: missing golden ${name}.report.json (run --update).`);
    failures += 1;
    continue;
  }
  if (first === golden) {
    const report = JSON.parse(first) as { overall: number | null; grade: string };
    console.log(`ok   ${name}: matches golden (overall ${report.overall ?? "null"}, ${report.grade})`);
  } else {
    console.error(
      `FAIL ${name}: report drifted from golden. If intentional, rerun with --update and justify the diff in the PR.`,
    );
    failures += 1;
  }
}

if (failures > 0) {
  console.error(`\nEval failed: ${failures}/${fixtures.length} fixture(s).`);
  process.exit(1);
}
console.log(`\nEval passed: ${fixtures.length} fixture(s) deterministic and matching goldens.`);
