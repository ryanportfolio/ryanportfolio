/**
 * Static site generator: ScoreReport[] → recruiter-facing viewer.
 * Pure HTML/CSS, no frameworks, no scripts, no third-party origins. Brand
 * fonts are self-hosted on corewise.academy (the owner's own origin) and
 * load cross-origin, which requires CORS `*` on /fonts/ there; serif/mono
 * fallback stacks keep the site readable if they fail. Deterministic:
 * same reports → same bytes. Renders aggregates only (privacy boundary
 * upstream).
 */
import type { DimensionResult, ScoreReport } from "../types.js";
import {
  PLAIN_LIMITS_ITEMS,
  PLAIN_LIMITS_TITLE,
  PLAIN_MEANING_ITEMS,
  PLAIN_MEANING_TITLE,
  PLAIN_QUESTIONS,
  type PlainClause,
} from "../report/plain.js";

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

/** Throw on slug collisions instead of silently overwriting a report page. */
export function assertUniqueSlugs(reports: ScoreReport[]): void {
  const seen = new Map<string, string>();
  for (const r of reports) {
    const slug = slugOf(r);
    const prior = seen.get(slug);
    if (prior !== undefined) {
      throw new Error(`slug collision: "${prior}" and "${r.repo}" both map to ${slug}.html`);
    }
    seen.set(slug, r.repo);
  }
}

const GRADE_CLASS: Record<string, string> = {
  Elite: "elite",
  Strong: "strong",
  Developing: "developing",
  Early: "early",
  "Ad-hoc": "adhoc",
  Unscorable: "unscorable",
};

function gradeChip(grade: string, overall: number | null, stamp = false): string {
  const cls = GRADE_CLASS[grade] ?? "unscorable";
  const score = overall === null ? "–" : `${overall}`;
  return `<span class="chip ${cls}${stamp ? " stamp" : ""}"><b>${esc(score)}</b> ${esc(grade)}</span>`;
}

function bar(d: DimensionResult): string {
  if (d.score === null) {
    return `<div class="bar unverified" title="could not verify"><span>could not verify</span></div>`;
  }
  // A true 0 renders as an empty bar; unflattering scores stay unflattering.
  const width = d.score === 0 ? 0 : Math.min(100, Math.max(2, Math.round(d.score)));
  return `<div class="bar"><i style="width:${width}%"></i><span>${esc(String(d.score))}</span></div>`;
}

/** Brand-font origin: the owner's own site; requires CORS `*` on /fonts/.
 * Interpolated raw into the <style> block: must stay a compile-time
 * constant, never configurable input (no CSS escaping exists here). */
const FONT_ORIGIN = "https://corewise.academy";

const CSS = `
@font-face{font-family:"Alembic Titling";src:url(${FONT_ORIGIN}/fonts/AlembicTitling.otf);font-display:swap}
@font-face{font-family:Newsreader;font-style:normal;font-weight:400 700;font-display:swap;src:url(${FONT_ORIGIN}/fonts/newsreader-normal-400_700-latin.woff2) format("woff2")}
@font-face{font-family:Newsreader;font-style:italic;font-weight:400 700;font-display:swap;src:url(${FONT_ORIGIN}/fonts/newsreader-italic-400_700-latin.woff2) format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:400;font-display:swap;src:url(${FONT_ORIGIN}/fonts/ibm-plex-mono-normal-400-latin.woff2) format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:500;font-display:swap;src:url(${FONT_ORIGIN}/fonts/ibm-plex-mono-normal-500-latin.woff2) format("woff2")}
:root{--font-display:"Alembic Titling","Didot",Georgia,serif;
--font-body:"Newsreader",Georgia,serif;
--font-mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
--tracking-caps:.14em;--ease:cubic-bezier(.22,1,.36,1);--dur:.45s;
--paper:#f3efe4;--paper-2:#ece6d6;--panel:#faf7ef;
--ink:#1c1914;--ink-soft:#574f43;--ink-mute:#6b6252;
--line:rgba(28,25,20,.16);--line-soft:rgba(28,25,20,.08);
--accent:#2743d0;--accent-deep:#1c31a4;--accent-wash:rgba(39,67,208,.09);
--elite:#2e6b34;--strong:#1c31a4;--developing:#8a6a15;--early:#9c3f12;--adhoc:#a12525;--unscorable:#766d5d}
@media (prefers-color-scheme: dark){:root{
--paper:#121420;--paper-2:#0d0f18;--panel:#181b2a;
--ink:#e8e4d8;--ink-soft:#a9a496;--ink-mute:#9a9685;
--line:rgba(232,228,216,.16);--line-soft:rgba(232,228,216,.07);
--accent:#96a8ff;--accent-deep:#b4c1ff;--accent-wash:rgba(150,168,255,.1);
--elite:#7fc98b;--strong:#96a8ff;--developing:#d9b45c;--early:#e0885a;--adhoc:#e57373;--unscorable:#84806f}}
*{margin:0;box-sizing:border-box}
html{font-size:clamp(16px,1.1vw,19px)}
body{font-family:var(--font-body);font-size:1.0625rem;line-height:1.68;background:var(--paper);color:var(--ink);-webkit-font-smoothing:antialiased}
body:after{content:"";position:fixed;inset:0;pointer-events:none;z-index:60;opacity:.5;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.5 0 0 0 0 0.48 0 0 0 0 0.44 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")}
a{color:var(--accent-deep);text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--accent) 40%,transparent);text-underline-offset:3px;transition:text-decoration-color var(--dur) var(--ease)}
a:hover{text-decoration-color:var(--accent)}
::selection{background:var(--accent);color:var(--paper)}
code{font-family:var(--font-mono);font-size:.82em;background:var(--accent-wash);padding:.08em .35em}
.masthead{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.8rem 2rem;border-bottom:1px solid var(--line);background:var(--paper);background:color-mix(in srgb,var(--paper) 84%,transparent);backdrop-filter:blur(10px)}
.wordmark{font-family:var(--font-display);font-size:1.15rem;letter-spacing:.02em;color:var(--ink);text-decoration:none}
.wordmark em{font-style:normal;color:var(--accent-deep)}
.masthead nav{display:flex;gap:1.6rem;align-items:center}
.masthead nav a{font-family:var(--font-mono);font-size:.76rem;letter-spacing:var(--tracking-caps);text-transform:uppercase;color:var(--ink-soft);text-decoration:none}
.masthead nav a:hover{color:var(--accent-deep)}
main{max-width:960px;margin:0 auto;padding:2.8rem 1.25rem 4rem}
h1{font-family:var(--font-display);font-weight:400;font-size:2.07rem;line-height:1.08;margin:0 0 .5rem;overflow-wrap:anywhere}
h2{font-family:var(--font-mono);font-weight:500;font-size:.76rem;text-transform:uppercase;letter-spacing:var(--tracking-caps);color:var(--accent-deep);margin:2.6rem 0 .9rem}
h2:before{content:"\\00a7\\00a0\\00a0"/"";color:var(--accent)}
.muted{color:var(--ink-mute)}.small{font-size:.88rem}
.backlink{font-family:var(--font-mono);font-size:.76rem;letter-spacing:.08em;text-transform:uppercase}
table{width:100%;border-collapse:collapse;margin:.6rem 0}
th,td{text-align:left;vertical-align:top;padding:.6rem .6rem;border-bottom:1px solid var(--line-soft)}
tr:last-child td{border-bottom:1px solid var(--line)}
th{font-family:var(--font-mono);color:var(--ink-mute);font-weight:500;font-size:.68rem;text-transform:uppercase;letter-spacing:var(--tracking-caps);border-bottom:1px solid var(--line)}
.chip{display:inline-block;font-family:var(--font-mono);font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;padding:.28rem .7rem;border:1px solid currentColor;background:var(--panel);white-space:nowrap}
.chip b{font-size:.95rem;font-weight:500}
.chip.elite{color:var(--elite)}.chip.strong{color:var(--strong)}
.chip.developing{color:var(--developing)}.chip.early{color:var(--early)}
.chip.adhoc{color:var(--adhoc)}.chip.unscorable{color:var(--unscorable)}
.bar{position:relative;height:1.35rem;background:var(--paper-2);border:1px solid var(--line);min-width:180px;overflow:hidden}
.bar i{position:absolute;inset:0;width:0;background:var(--accent);opacity:.3}
.bar span{position:absolute;inset:0;display:flex;align-items:center;padding-left:.5rem;font-family:var(--font-mono);font-size:.72rem}
.bar.unverified{background:transparent;border-color:transparent}
.bar.unverified span{color:var(--ink-mute);font-style:italic;font-family:var(--font-body);font-size:.8rem;padding-left:0}
.question{margin-top:.25rem;max-width:28rem}
.panel{background:var(--panel);border:1px solid var(--line);padding:1rem 1.2rem;margin:.8rem 0}
.panel ul{padding-left:1.1rem}
.callout{border:1px solid var(--accent);border-left:4px solid var(--accent);background:var(--accent-wash);padding:.9rem 1.3rem 1rem;margin:1.4rem 0}
.callout .callout-title{font-family:var(--font-mono);font-weight:500;font-size:.76rem;text-transform:uppercase;letter-spacing:var(--tracking-caps);color:var(--accent-deep);display:block;margin-bottom:.3rem}
.clause{display:grid;grid-template-columns:2.8rem 1fr;gap:0 .7rem;padding:.6rem 0;border-top:1px solid var(--line-soft)}
.clauses .clause:first-child{border-top:0}
.clause:target{box-shadow:inset 3px 0 0 var(--accent)}
a.clause-no{font-family:var(--font-mono);font-size:.72rem;color:var(--accent-deep);padding-top:.28rem;text-decoration:none}
a.clause-no:hover{text-decoration:underline}
.clause-label{margin:0;font-size:1rem;font-weight:600;display:flex;flex-wrap:wrap;align-items:center;gap:.5rem}
.clause-detail{margin:.15rem 0 0;font-size:.82rem;line-height:1.55;color:var(--ink-mute)}
.clauses{margin:.4rem 0 0}
.tag-notscored{font-family:var(--font-mono);font-weight:400;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--developing);background:var(--panel);border:1px dashed currentColor;padding:.1rem .45rem;white-space:nowrap}
.callout .clause-detail{color:var(--ink-soft)}
.clause-ref{margin:.35rem 0 0;font-family:var(--font-mono);font-size:.68rem;letter-spacing:.02em;color:var(--ink-soft)}
.dot-row{display:flex;align-items:baseline;gap:.5rem}
.dot-row .dots{flex:1;min-width:2rem;border-bottom:1px dotted var(--line);transform:translateY(-.28em)}
.report-arrow{font-family:var(--font-mono);font-size:.76rem;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;color:var(--accent-deep)}
.report-arrow:hover{text-decoration:underline}
.colophon{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--line);margin:1.2rem 0;background:var(--panel)}
.colophon>div{display:grid;grid-template-columns:6.5rem 1fr;gap:0 .8rem;padding:.55rem .9rem;border-top:1px solid var(--line-soft)}
.colophon>div:nth-child(-n+2){border-top:0}
.colophon>div:nth-child(odd){border-right:1px solid var(--line-soft)}
.colophon dt{font-family:var(--font-mono);font-size:.62rem;letter-spacing:var(--tracking-caps);text-transform:uppercase;color:var(--ink-mute);padding-top:.22em}
.colophon dd{margin:0;font-family:var(--font-mono);font-size:.76rem;overflow-wrap:anywhere}
.colophon code{background:none;padding:0}
.stampline{margin:.4rem 0 0}
.chip.stamp{border-style:double;border-width:3px;padding:.5rem 1.05rem;font-size:.88rem;transform:rotate(-2deg);transform-origin:left center;margin:.3rem 0 .5rem .2rem;opacity:.92}
.chip.stamp b{font-size:1.15rem}
footer span{display:block}
footer{margin-top:3.5rem;padding-top:1.2rem;border-top:1px solid var(--line);font-family:var(--font-mono);font-size:.72rem;line-height:1.7;letter-spacing:.02em;color:var(--ink-mute)}
footer a{color:var(--ink-soft)}
@media(max-width:720px){.masthead{padding:.8rem 1rem}.masthead nav{display:none}
h1{font-size:1.66rem}
table{display:block;overflow-x:auto}
.clause{grid-template-columns:1fr;gap:.1rem 0}
a.clause-no{padding-top:0}
.colophon{grid-template-columns:1fr}
.colophon>div{border-right:0!important}
.colophon>div:nth-child(2){border-top:1px solid var(--line-soft)}
.dimtable{display:block;overflow:visible}
.dimtable thead{display:none}
.dimtable tbody,.dimtable tr,.dimtable td{display:block;border:0;padding:0}
.dimtable tr{border-top:1px solid var(--line);padding:.7rem 0}
.dimtable td{padding:.2rem 0}
.dimtable .bar{max-width:100%}}
@media print{body:after,.masthead{display:none}}
`;

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<header class="masthead">
<a class="wordmark" href="index.html">audit.<em>corewise.academy</em></a>
<nav>
<a href="https://corewise.academy/">corewise.academy</a>
<a href="https://github.com/ryanportfolio/ryanportfolio">source</a>
</nav>
</header>
<main>
${body}
</main></body>
</html>
`;
}

/** Owner-voice declaration for the fleet index only; the generic tool copy
 * in PLAIN_LIMITS_ITEMS stays repo-agnostic.
 * First person by design: this is the owner speaking about his own
 * practice, stated as fact (owner decision, plan 0021; evidenced there
 * from local session history). The honest limit that remains published
 * is scoring status: the scorer cannot see those sessions. */
const FLEET_DECLARATION: PlainClause = {
  id: "D-1",
  label: "Owner's declaration: reviews run off GitHub",
  text: "Every repo on this board is solo. My reviews almost always run as handoff audits in separate AI sessions, which leave no GitHub artifact. The deterministic scorer cannot see those sessions and gives them no score credit, so the review dimensions here understate that practice. Where I have stated it for a repo, its report carries the statement as an attestation outside the scored evidence.",
};

/** The public skill behind the declared practice: it drafts a
 * self-contained audit prompt for a zero-context session, charged to
 * falsify the work, not approve it. Description must track that file. */
const HANDOFF_SKILL_URL =
  "https://github.com/ryanportfolio/AI-Firmware/blob/main/.claude/skills/handoff-audit/SKILL.md";
const HANDOFF_SKILL_REF = `The skill behind that practice is public: <a href="${HANDOFF_SKILL_URL}">/handoff-audit</a> drafts a self-contained audit prompt for a zero-context session and charges it to falsify the work, not approve it.`;

/** One audit clause: mono number (a self-link anchor), scannable label,
 * full sentence(s) as a small detail line. The detail keeps every qualifier
 * of the approved copy; only the wall-of-text presentation is gone.
 * refHtml is trusted markup from module constants only, never data. */
function clauseRow(c: PlainClause, tag: string | null = null, refHtml: string | null = null): string {
  const anchor = c.id.toLowerCase();
  return `<div class="clause" id="${esc(anchor)}"><a class="clause-no" href="#${esc(anchor)}">${esc(c.id)}</a><div>
<p class="clause-label"><span>${esc(c.label)}</span>${tag ? `<span class="tag-notscored">${esc(tag)}</span>` : ""}</p>
<p class="clause-detail">${esc(c.text)}</p>
${refHtml ? `<p class="clause-ref">${refHtml}</p>\n` : ""}</div></div>`;
}

/** Exclusions first, then the owner's declaration: what the instrument
 * cannot see, followed by what the owner states about that gap. */
function limitsCallout(withDeclaration: boolean): string {
  return `<aside class="callout"><span class="callout-title">${esc(PLAIN_LIMITS_TITLE)}</span>
${PLAIN_LIMITS_ITEMS.map((c) => clauseRow(c)).join("\n")}${withDeclaration ? "\n" + clauseRow(FLEET_DECLARATION, "Not scored", HANDOFF_SKILL_REF) : ""}
</aside>`;
}

function meaningSection(): string {
  return `<h2>${esc(PLAIN_MEANING_TITLE)}</h2>
<div class="clauses">
${PLAIN_MEANING_ITEMS.map((c) => clauseRow(c)).join("\n")}
</div>`;
}

const FOOTER = `<footer>
<span>Deterministic: same repo state, same score. No LLM in the scoring path.</span>
<span>Aggregates only: no source code, commit messages, PR text, or config values.</span>
<span>Every report owner-approved before publication: <a href="https://github.com/ryanportfolio/ryanportfolio/blob/main/governance/README.md">governance</a>.</span>
<span><a href="https://github.com/ryanportfolio/ryanportfolio">Pipeline &amp; tool source</a> · <a href="https://corewise.academy/">corewise.academy</a></span>
</footer>`;

export function generateIndexHtml(reports: ScoreReport[]): string {
  const sorted = [...reports].sort((a, b) => {
    if (a.overall !== null && b.overall !== null && a.overall !== b.overall) {
      return b.overall - a.overall;
    }
    if ((a.overall === null) !== (b.overall === null)) return a.overall === null ? 1 : -1;
    // Code-point compare, not localeCompare: byte-determinism across runtimes.
    return a.repo < b.repo ? -1 : a.repo > b.repo ? 1 : 0;
  });

  const rows =
    sorted.length === 0
      ? `<div class="panel">Fleet audit pending. Reports publish here only after per-report owner approval. The pipeline, scoring engine, and governance are already public in the <a href="https://github.com/ryanportfolio/ryanportfolio">repo</a>.</div>`
      : `<table><thead><tr><th>Repo</th><th>Score</th><th>Report</th></tr></thead><tbody>
${sorted
  .map(
    (r) =>
      `<tr><td><span class="dot-row"><span>${esc(r.repo)}</span><i class="dots"></i></span></td><td>${gradeChip(r.grade, r.overall)}</td><td><a class="report-arrow" aria-label="full report: ${esc(r.repo)}" href="${esc(slugOf(r))}.html">report →</a></td></tr>`,
  )
  .join("\n")}
</tbody></table>`;

  const body = `<h1>Fleet audit: agentic engineering discipline</h1>
<p class="muted">Deterministic, scored reports on AI-agent development discipline across
<a href="https://github.com/ryanportfolio">ryanportfolio</a>'s repos, most private. The
tool and pipeline are public and deterministic; reports on private repos are reproducible
by the owner from the pinned commit. Unflattering scores stay in.</p>
${limitsCallout(true)}
<h2>Scoreboard</h2>
${rows}
${meaningSection()}
<h2>How these scores are made</h2>
<div class="clauses">
<div class="clause" id="m-1"><a class="clause-no" href="#m-1">M-1</a><div>
<p class="clause-label"><span>Built by the pipeline it documents</span></p>
<p class="clause-detail">Every change to the audit tool itself flows: plan → agent build → independent fresh-context
AI review → CI test+eval gate → owner-authorized merge. The repo's own PR history is the
living demo: <a href="https://github.com/ryanportfolio/ryanportfolio/pulls?q=is%3Apr">read it</a>.</p>
</div></div>
</div>
${FOOTER}`;
  return page("Fleet audit: ryanportfolio", body);
}

/** Site pages render from the published PublicReport JSON, which may carry
 * an owner attestation on top of the ScoreReport shape. Both the legacy
 * bare-string and the self-describing object shapes are accepted. */
export type SiteReport = ScoreReport & {
  attestation?: string | { text: string } | null;
};

function attestationText(report: SiteReport): string | null {
  const a = report.attestation;
  if (!a) return null;
  return typeof a === "string" ? a : a.text;
}

export function generateReportHtml(report: SiteReport): string {
  const dims = report.dimensions
    .map((d) => {
      const q = PLAIN_QUESTIONS[d.key as keyof typeof PLAIN_QUESTIONS];
      const question = q ? `<div class="small muted question">${esc(q)}</div>` : "";
      return `<tr><td>${esc(d.label)}${question}</td><td>${bar(d)}</td><td class="small muted">${esc(d.detail)}</td></tr>`;
    })
    .join("\n");

  const unverified =
    report.unverified.length === 0
      ? ""
      : `<h2>Could not verify</h2><div class="panel small">Excluded from the overall score rather than guessed: ${report.unverified
          .map((k) => esc(report.dimensions.find((d) => d.key === k)?.label ?? k))
          .join(", ")}.</div>`;

  const body = `<p class="backlink"><a href="index.html">← scoreboard</a></p>
<h1>${esc(report.repo)}</h1>
<p class="stampline">${gradeChip(report.grade, report.overall, true)}</p>
<dl class="colophon">
<div><dt>Commit</dt><dd><code>${esc(report.headSha ?? "(no commits)")}</code></dd></div>
<div><dt>Collected</dt><dd>${esc(report.collectedAt)}</dd></div>
<div><dt>Sample</dt><dd>${report.sample.commits} commits${report.sample.commitsTruncated ? " (truncated)" : ""} · ${report.sample.mergedPullRequests} merged PRs${report.sample.pullRequestsTruncated ? " (truncated)" : ""}</dd></div>
<div><dt>Publication</dt><dd>Requires prior owner approval: <a href="https://github.com/ryanportfolio/ryanportfolio/blob/main/governance/README.md">rule</a></dd></div>
</dl>
${limitsCallout(false)}
<h2>Dimensions</h2>
<table class="dimtable"><thead><tr><th>Dimension</th><th>Score</th><th>Basis</th></tr></thead><tbody>
${dims}
</tbody></table>
${unverified}
${(() => {
  const att = attestationText(report);
  return att
    ? `<h2>Owner attestation</h2>
<div class="panel small"><p class="muted">Stated by the repo owner. The tool has not verified this and it earns no score credit.</p>
<p>${esc(att)}</p></div>`
    : "";
})()}
${meaningSection()}
${FOOTER}`;
  return page(`${report.repo}: agentic-SDLC audit`, body);
}
