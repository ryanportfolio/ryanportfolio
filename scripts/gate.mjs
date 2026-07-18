#!/usr/bin/env node
/**
 * Minimal CI gate (Phase 0). Checks real repo invariants.
 * Phase 1 extends the gate workflow with the Vitest suite; this script keeps
 * guarding the recruiter-facing README surface and the plans/ convention.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const failures = [];

function check(name, ok) {
  if (ok) {
    console.log(`ok   ${name}`);
  } else {
    failures.push(name);
    console.error(`FAIL ${name}`);
  }
}

const readmePath = resolve(root, "README.md");
check("README.md exists", existsSync(readmePath));
const readme = existsSync(readmePath) ? readFileSync(readmePath, "utf8") : "";

const requiredLinks = [
  "https://corewise.academy/about",
  "https://corewise.video",
  "https://kinefractal.com",
  "https://truenote.org",
  "https://willaicite.com",
];
for (const link of requiredLinks) {
  check(`README links ${link}`, readme.includes(link));
}

check(
  "README has fleet audit scoreboard section",
  /^## Fleet audit scoreboard$/m.test(readme),
);
check(
  "README states the experiment",
  readme.includes("exclusively through the pipeline it documents"),
);

const plansDir = resolve(root, "plans");
const planNotes = existsSync(plansDir)
  ? readdirSync(plansDir).filter((f) => /^\d{4}-.+\.md$/.test(f))
  : [];
check("plans/ has at least one NNNN-*.md plan note", planNotes.length > 0);

if (failures.length > 0) {
  console.error(`\nGate failed: ${failures.length} check(s).`);
  process.exit(1);
}
console.log(`\nGate passed: all checks ok.`);
