import fs from 'node:fs';
import path from 'node:path';

const HERE = import.meta.dirname;
const DATA = path.resolve('reports/data');

const repos = fs.readdirSync(DATA).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')))
  .sort((a, b) => b.overall - a.overall);

const DIMS = repos[0].dimensions.map(d => ({ key: d.key, label: d.label, weight: d.weight }));
const COLLECTED = repos.map(r => r.collectedAt).sort().slice(-1)[0].slice(0, 10);
const ZERO_REVIEW = repos.filter(r => {
  const d = r.dimensions.find(x => x.key === 'review_coverage');
  return d && d.score === 0;
}).length;
const CNV_CATCH = repos.filter(r => {
  const d = r.dimensions.find(x => x.key === 'review_catch_rate');
  return !d || d.score === null;
}).length;

const PRIVATE = new Set(['Corewise.Academy', 'PixelSwarm', 'range', 'Extract-Video-Wisdom', 'githelp']);

// Plain-language question per dimension, matching the wording the generated
// reports already use, so the doc and the reports stay in one voice.
const QUESTION = {
  agent_attribution: 'Can every commit be traced to who or what made it?',
  review_coverage:   'How many merged PRs carry a recorded review by someone other than the author?',
  review_catch_rate: 'When a review happened, did it change anything before the merge?',
  human_merge_gate:  'Are merges performed by people, or does automation merge by itself?',
  ci_gate:           'Do automated tests exist, and did PRs actually pass them before merging?',
  batch_size:        'Are changes small reviewable chunks, or thousand-line dumps?',
  lead_time:         'How long does work take from first commit to merge?',
  plan_evidence:     'Do PRs link to an issue or plan that existed before the code?',
  audit_trail:       'Could a stranger reconstruct why each change happened?',
};

// Scoreboard rows come straight from reports/data, so the table and the matrix
// image can never disagree with the reports they both read from.
const rows = repos.map(r => {
  const name = r.repo.split('/')[1];
  const label = PRIVATE.has(name) ? `${r.repo} (private)` : r.repo;
  return `| ${label} | ${r.overall}/100 | ${r.grade} | [report](reports/${name}.md) |`;
}).join('\n');

const dimRows = DIMS.map(d =>
  `| ${d.label} | ${d.weight} | ${QUESTION[d.key]} |`).join('\n');

function pic(base, alt) {
  return `<picture>
<source media="(max-width: 500px) and (prefers-color-scheme: dark)" srcset="assets/${base}-narrow-dark.svg">
<source media="(max-width: 500px)" srcset="assets/${base}-narrow-light.svg">
<source media="(prefers-color-scheme: dark)" srcset="assets/${base}-dark.svg">
<img alt="${alt}" src="assets/${base}-light.svg">
</picture>`;
}

const md = `# Agentic-SDLC audit

[![gate](https://github.com/ryanportfolio/ryanportfolio/actions/workflows/gate.yml/badge.svg)](https://github.com/ryanportfolio/ryanportfolio/actions/workflows/gate.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Point it at any GitHub repo and get a deterministic, scored report on AI-agent development discipline. Same repo state, same score, no LLM anywhere in the scoring path.

It reads GitHub metadata only: commits, pull requests, reviews, check runs, merge events. It never reads the code. So it scores recorded process, not code quality, and discipline that leaves no artifact on GitHub earns nothing.

## The fleet, scored

<picture>
<source media="(prefers-color-scheme: dark)" srcset="assets/matrix-dark.svg">
<img alt="Fleet audit matrix: ${repos.length} repositories scored across ${DIMS.length} deterministic dimensions." src="assets/matrix-light.svg">
</picture>

<!-- scoreboard:start -->
| Repo | Score | Grade | Report |
|------|-------|-------|--------|
${rows}
<!-- scoreboard:end -->

Collected ${COLLECTED}. Browse the rendered reports at **[audit.corewise.academy](https://audit.corewise.academy/)**. Most of the portfolio is private: the tool and the pipeline are public and deterministic, and the published reports give a scored read on repos you cannot open, reproducible by the owner from the pinned commit.

## What the orange means

${pic('strip', `Recorded review coverage scores zero on ${ZERO_REVIEW} of ${repos.length} repositories.`)}

Recorded review coverage scores 0 on ${ZERO_REVIEW} of ${repos.length} repos, and review catch rate could not be verified on ${CNV_CATCH} of ${repos.length}. Both are true readings, and neither means the work went unreviewed.

Every repo here is solo. Review credit requires a reviewer who is not the pull request's author, and my reviews run as [handoff audits](https://github.com/ryanportfolio/AI-Firmware/blob/main/.claude/skills/handoff-audit/SKILL.md) and [cross-vendor reviews](https://github.com/ryanportfolio/AI-Firmware/blob/main/.claude/skills/codex-review/SKILL.md) in separate sessions, which leave no GitHub artifact. The deterministic scorer cannot see those sessions and gives them no credit, so the review dimensions understate the actual practice.

These are under-measurements, not corrections. Every report states what it could not see instead of guessing, and the weights renormalize around anything unverified rather than scoring it zero by default.

## The scored dimensions

| Dimension | Weight | The question it answers |
|-----------|--------|-------------------------|
${dimRows}

Grades band the weighted average: 90+ Elite, 75+ Strong, 60+ Developing, 40+ Early, under 40 Ad-hoc.

## The experiment

Every change since the bootstrap commit is built **exclusively through the pipeline it documents**:

\`\`\`mermaid
flowchart LR
    A["Plan note"] --> B["Agent build"]
    B --> C["Independent AI review<br/>(fresh context, adversarial)"]
    C --> D["CI test + eval gate"]
    D --> E["Owner-authorized merge"]
\`\`\`

- The building agent never grades its own work: the reviewing agent gets fresh context and an adversarial prompt, told to refute rather than approve.
- Merge authority stays with the owner. Merges are agent-executed under a standing, session-scoped owner authorization, revocable at any time. That is disclosed, not dressed up as a manual click; details in [governance](governance/README.md).
- Every PR links a plan note, passes the gate, and carries its review trail.

The public PR history of this repo *is* the living demo. Solo project, zero external users. The pitch is publicly auditable process, a reusable framework, and verified portfolio evidence, not adoption.

## Layout

| Path | Purpose |
|------|---------|
| \`app/\` | The audit tool: scoring engine, collector, CLI, report renderer, site generator (TypeScript / Node 20, GitHub API). |
| \`.github/workflows/\` | The pipeline itself: test+eval gate, AI-reviewer template. Written to be copy-pastable into other repos. Viewer deploys via Vercel (\`vercel.json\`). |
| \`governance/\` | Human-in-the-loop checkpoint map, audit-trail contents, NIST AI RMF mapping, merge-execution disclosure. |
| \`plans/\` | One plan note per PR, the plan-before-code evidence this tool scores. |
| \`reports/\` | Published fleet audit reports, live. One per audited repo. Each report was owner-approved before publication. |
| \`playbook.md\` | How to run this pipeline on any repo. |

## Method

Scores are computed deterministically from GitHub API metadata: same repo state, same score, no LLM in the scoring path. Reports contain aggregate metrics only. No source code, commit-message bodies, PR text, or configuration values are collected or published.
`;

fs.writeFileSync(path.resolve('AUDIT.md'), md);

// The scoreboard must list every scored repo exactly once.
const listed = (md.match(/\| \[report\]/g) || []).length;
console.log(`AUDIT.md: ${listed} scoreboard rows for ${repos.length} reports, ${DIMS.length} dimensions documented`);
if (listed !== repos.length) { console.error('MISMATCH: scoreboard rows vs reports'); process.exit(1); }
console.log('verify ok: scoreboard covers every report');
