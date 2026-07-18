/**
 * Static site generator: ScoreReport[] → recruiter-facing viewer.
 * Pure HTML/CSS, no frameworks, no external assets. Deterministic: same
 * reports → same bytes. Renders aggregates only (privacy boundary upstream).
 */
import type { DimensionResult, ScoreReport } from "../types.js";

export function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function slugOf(report: ScoreReport): string {
  return (report.repo.split("/")[1] ?? report.repo).toLowerCase().replace(/[^a-z0-9._-]/g, "-");
}

const GRADE_CLASS: Record<string, string> = {
  Elite: "elite",
  Strong: "strong",
  Developing: "developing",
  Early: "early",
  "Ad-hoc": "adhoc",
  Unscorable: "unscorable",
};

function gradeChip(grade: string, overall: number | null): string {
  const cls = GRADE_CLASS[grade] ?? "unscorable";
  const score = overall === null ? "—" : `${overall}`;
  return `<span class="chip ${cls}"><b>${esc(score)}</b> ${esc(grade)}</span>`;
}

function bar(d: DimensionResult): string {
  if (d.score === null) {
    return `<div class="bar unverified" title="could not verify"><span>could not verify</span></div>`;
  }
  const width = Math.max(2, Math.round(d.score));
  return `<div class="bar"><i style="width:${width}%"></i><span>${esc(String(d.score))}</span></div>`;
}

const CSS = `
:root{--bg:#0e1116;--panel:#161b22;--text:#e6edf3;--muted:#8b949e;--line:#30363d;
--elite:#3fb950;--strong:#2f81f7;--developing:#d29922;--early:#db6d28;--adhoc:#f85149;--unscorable:#6e7681}
@media (prefers-color-scheme: light){:root{--bg:#ffffff;--panel:#f6f8fa;--text:#1f2328;--muted:#57606a;--line:#d0d7de}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);
font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:960px;margin:0 auto;padding:2.5rem 1.25rem}
h1{font-size:1.7rem;margin:0 0 .3rem}h2{font-size:1.15rem;margin:2.2rem 0 .8rem}
a{color:var(--strong);text-decoration:none}a:hover{text-decoration:underline}
.muted{color:var(--muted)}.small{font-size:.85rem}
table{width:100%;border-collapse:collapse;margin:.6rem 0}
th,td{text-align:left;padding:.55rem .6rem;border-bottom:1px solid var(--line)}
th{color:var(--muted);font-weight:600;font-size:.8rem;text-transform:uppercase;letter-spacing:.04em}
.chip{display:inline-block;padding:.12rem .6rem;border-radius:999px;font-size:.85rem;color:#fff}
.chip b{font-size:.95rem}
.chip.elite{background:var(--elite)}.chip.strong{background:var(--strong)}
.chip.developing{background:var(--developing)}.chip.early{background:var(--early)}
.chip.adhoc{background:var(--adhoc)}.chip.unscorable{background:var(--unscorable)}
.bar{position:relative;height:1.35rem;background:var(--panel);border:1px solid var(--line);border-radius:4px;min-width:180px;overflow:hidden}
.bar i{position:absolute;inset:0;width:0;background:var(--strong);opacity:.55}
.bar span{position:absolute;inset:0;display:flex;align-items:center;padding-left:.5rem;font-size:.8rem}
.bar.unverified span{color:var(--muted);font-style:italic}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:1rem 1.2rem;margin:.8rem 0}
footer{margin-top:3rem;padding-top:1rem;border-top:1px solid var(--line)}
`;

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body><main>
${body}
</main></body>
</html>
`;
}

const FOOTER = `<footer class="small muted">
Scores are deterministic — same repo state, same score; no LLM in the scoring path.
Reports contain aggregate metrics only: no source code, commit messages, PR text, or config values.
Every published report is explicitly approved by the owner first.
<a href="https://github.com/ryanportfolio/ryanportfolio">Pipeline, tool source &amp; governance</a>.
</footer>`;

export function generateIndexHtml(reports: ScoreReport[]): string {
  const sorted = [...reports].sort((a, b) => {
    if (a.overall !== null && b.overall !== null && a.overall !== b.overall) {
      return b.overall - a.overall;
    }
    if ((a.overall === null) !== (b.overall === null)) return a.overall === null ? 1 : -1;
    return a.repo.localeCompare(b.repo);
  });

  const rows =
    sorted.length === 0
      ? `<div class="panel">Fleet audit pending — reports publish here only after per-report owner approval. The pipeline, scoring engine, and governance are already public in the <a href="https://github.com/ryanportfolio/ryanportfolio">repo</a>.</div>`
      : `<table><thead><tr><th>Repo</th><th>Score</th><th>Report</th></tr></thead><tbody>
${sorted
  .map(
    (r) =>
      `<tr><td>${esc(r.repo)}</td><td>${gradeChip(r.grade, r.overall)}</td><td><a href="${esc(slugOf(r))}.html">full report</a></td></tr>`,
  )
  .join("\n")}
</tbody></table>`;

  const body = `<h1>Fleet audit — agentic engineering discipline</h1>
<p class="muted">Deterministic, scored reports on AI-agent development discipline across
<a href="https://github.com/ryanportfolio">ryanportfolio</a>'s repos — most private; these
reports are the publicly verifiable evidence layer. Unflattering scores stay in.</p>
<h2>Scoreboard</h2>
${rows}
<h2>How these scores are made</h2>
<div class="panel small">
Every change to the audit tool itself flows: plan → agent build → independent fresh-context
AI review → CI test+eval gate → owner-authorized merge. The repo's own PR history is the
living demo — <a href="https://github.com/ryanportfolio/ryanportfolio/pulls?q=is%3Apr">read it</a>.
</div>
${FOOTER}`;
  return page("Fleet audit — ryanportfolio", body);
}

export function generateReportHtml(report: ScoreReport): string {
  const dims = report.dimensions
    .map(
      (d) => `<tr><td>${esc(d.label)}</td><td>${bar(d)}</td><td class="small muted">${esc(d.detail)}</td></tr>`,
    )
    .join("\n");

  const unverified =
    report.unverified.length === 0
      ? ""
      : `<h2>Could not verify</h2><div class="panel small">Excluded from the overall score rather than guessed: ${report.unverified
          .map((k) => esc(report.dimensions.find((d) => d.key === k)?.label ?? k))
          .join(", ")}.</div>`;

  const body = `<p class="small"><a href="index.html">← scoreboard</a></p>
<h1>${esc(report.repo)}</h1>
<p>${gradeChip(report.grade, report.overall)}</p>
<p class="small muted">Collected ${esc(report.collectedAt)} at <code>${esc(report.headSha ?? "(no commits)")}</code> —
sample: ${report.sample.commits} commits${report.sample.commitsTruncated ? " (truncated)" : ""},
${report.sample.mergedPullRequests} merged PRs${report.sample.pullRequestsTruncated ? " (truncated)" : ""}.</p>
<h2>Dimensions</h2>
<table><thead><tr><th>Dimension</th><th>Score</th><th>Basis</th></tr></thead><tbody>
${dims}
</tbody></table>
${unverified}
${FOOTER}`;
  return page(`${report.repo} — agentic-SDLC audit`, body);
}
