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

// README.md is the GitHub profile front door; the audit tool's own surface,
// including the scoreboard the fleet run rewrites, lives in AUDIT.md.
const auditPath = resolve(root, "AUDIT.md");
check("AUDIT.md exists", existsSync(auditPath));
const audit = existsSync(auditPath) ? readFileSync(auditPath, "utf8") : "";

check("README links AUDIT.md", readme.includes("AUDIT.md"));
check(
  "AUDIT.md has the scoreboard markers the fleet run rewrites",
  audit.includes("<!-- scoreboard:start -->") && audit.includes("<!-- scoreboard:end -->"),
);
check(
  "AUDIT.md states the experiment",
  audit.includes("exclusively through the pipeline it documents"),
);

// Every product the front door claims must actually be linked from it.
const requiredProducts = [
  "https://store.steampowered.com/app/4975550/MAIMCOIL",
  "https://fullbuild.ai/prototype",
];
for (const link of requiredProducts) {
  check(`README links ${link}`, readme.includes(link));
}

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
