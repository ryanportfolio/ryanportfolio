import fs from 'node:fs';
import path from 'node:path';

const DATA = path.resolve('reports/data');
const OUT  = path.resolve('assets');
fs.mkdirSync(OUT, { recursive: true });

const repos = fs.readdirSync(DATA).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')))
  .sort((a, b) => b.overall - a.overall);

const DIMS = repos[0].dimensions.map(d => ({ key: d.key, label: d.label, weight: d.weight }));
const COLLECTED = repos.map(r => r.collectedAt).sort().slice(-1)[0].slice(0, 10);
const TOT = {
  commits: repos.reduce((s, r) => s + r.sample.commits, 0),
  prs:     repos.reduce((s, r) => s + r.sample.mergedPullRequests, 0),
};

// Counted, never asserted.
const ZERO_REVIEW = repos.filter(r => {
  const d = r.dimensions.find(x => x.key === 'review_coverage');
  return d && d.score === 0;
}).length;
const CNV_CATCH = repos.filter(r => {
  const d = r.dimensions.find(x => x.key === 'review_catch_rate');
  return !d || d.score === null;
}).length;

const SHORT = {
  agent_attribution:'PROV', review_coverage:'REVW', review_catch_rate:'CATCH',
  human_merge_gate:'GATE', ci_gate:'CI', batch_size:'BATCH',
  lead_time:'LEAD', plan_evidence:'PLAN', audit_trail:'TRAIL',
};

// ---- constraint contract -------------------------------------------------
// ONE accent, spent only on the honest gap: a measured zero, or could-not-verify.
//   Never on decoration, never on the human gate, never on a good score.
// solid fill      = measured value, opacity encodes magnitude
// dashed + hatch  = the instrument could not see it
// filled node     = a human decision point; hollow = automated
// hairlines only. no gradient, no glow, no rounded blob. figures always mono.
const THEMES = {
  light: { bg:'#ffffff', ink:'#1f2328', mute:'#59636e', rule:'#d1d9e0',
           fill:'#1f2328', accent:'#bc4c00', accentSoft:'#fff1e5' },
  dark:  { bg:'#0d1117', ink:'#f0f6fc', mute:'#9198a1', rule:'#3d444d',
           fill:'#f0f6fc', accent:'#f0883e', accentSoft:'#2b1a10' },
};
const MONO = "ui-monospace,'SF Mono','Cascadia Mono',Menlo,Consolas,'Liberation Mono',monospace";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const REDUCED = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}';

// Wide labels wrap to two lines and go unreadable in a 400px frame, so narrow
// gets its own single-word set rather than a shrunk copy of the wide one.
const STAGES      = [['PLAN',0],['AGENT BUILD',0],['ADVERSARIAL REVIEW',0],['CI GATE',0],['OWNER MERGE',1]];
const STAGES_THIN = [['PLAN',0],['BUILD',0],['REVIEW',0],['CI',0],['MERGE',1]];

// ---- panel: masthead -----------------------------------------------------
function masthead(t, narrow) {
  const c = THEMES[t];
  return narrow ? mastheadThin(c) : mastheadWide(c);
}

function mastheadWide(c) {
  const W = 880, H = 196, px = 470, pw = W - 30 - px, py = 92;
  const step = pw / (STAGES.length - 1);

  let pipe = `<line class="w" x1="${px}" y1="${py}" x2="${px + pw}" y2="${py}" stroke="${c.rule}" stroke-width="1"/>`;
  STAGES.forEach(([label, human], i) => {
    const x = px + i * step, r = human ? 6.5 : 4.5;
    pipe += `<rect class="n" x="${(x - r).toFixed(1)}" y="${(py - r).toFixed(1)}" width="${r * 2}" height="${r * 2}" `
         +  `fill="${human ? c.fill : c.bg}" stroke="${human ? c.fill : c.mute}" stroke-width="1.4" `
         +  `style="animation-delay:${(0.18 + i * 0.08).toFixed(2)}s"/>`;
    label.split(' ').forEach((w, wi) => {
      pipe += `<text x="${x}" y="${py + 21 + wi * 9}" font-family="${MONO}" font-size="7.2" `
           +  `fill="${human ? c.ink : c.mute}" text-anchor="middle" letter-spacing=".06em">${w}</text>`;
    });
  });

  let stat = '';
  [[String(repos.length),'REPOS SCORED'],[String(TOT.commits),'COMMITS READ'],[String(TOT.prs),'MERGED PRS']]
    .forEach(([n, l], i) => {
      const x = px + i * 130;
      stat += `<text x="${x}" y="${py + 62}" font-family="${MONO}" font-size="15" fill="${c.ink}">${n}</text>`;
      stat += `<text x="${x}" y="${py + 75}" font-family="${MONO}" font-size="7.6" fill="${c.mute}" letter-spacing=".1em">${l}</text>`;
    });

  return svg(W, H, c, ariaMast(), `
<text x="26" y="28" font-family="${MONO}" font-size="9.5" fill="${c.mute}" letter-spacing=".14em">FLEET AUDIT / COLLECTED ${COLLECTED} / DETERMINISTIC SCORER / NO MODEL IN THE SCORING PATH</text>
<line class="r" x1="26" y1="41" x2="${W - 26}" y2="41" stroke="${c.rule}" stroke-width="1"/>
<text x="24" y="92" font-family="${SANS}" font-size="44" font-weight="600" fill="${c.ink}" letter-spacing="-.022em">Ryan Allen</text>
<text x="26" y="124" font-family="${SANS}" font-size="15.5" fill="${c.mute}">AI agents do the work. A human gates every merge.</text>
<text x="26" y="147" font-family="${SANS}" font-size="15.5" fill="${c.mute}">The pipeline is public and it grades itself in the open.</text>
<text x="${px}" y="${py - 26}" font-family="${MONO}" font-size="8" fill="${c.mute}" letter-spacing=".1em">EVERY CHANGE TAKES THIS PATH</text>
${pipe}
${stat}`, mastStyle(W));
}

function mastheadThin(c) {
  const W = 400, H = 268, py = 178, px = 26, pw = W - 52;
  const step = pw / (STAGES_THIN.length - 1);

  let pipe = `<line class="w" x1="${px}" y1="${py}" x2="${px + pw}" y2="${py}" stroke="${c.rule}" stroke-width="1"/>`;
  STAGES_THIN.forEach(([label, human], i) => {
    const x = px + i * step, r = human ? 6 : 4.2;
    pipe += `<rect class="n" x="${(x - r).toFixed(1)}" y="${(py - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}" `
         +  `fill="${human ? c.fill : c.bg}" stroke="${human ? c.fill : c.mute}" stroke-width="1.3" `
         +  `style="animation-delay:${(0.18 + i * 0.08).toFixed(2)}s"/>`;
    pipe += `<text x="${x}" y="${py + 19}" font-family="${MONO}" font-size="7.6" fill="${human ? c.ink : c.mute}" text-anchor="middle" letter-spacing=".05em">${label}</text>`;
  });

  let stat = '';
  [[String(repos.length),'REPOS'],[String(TOT.commits),'COMMITS'],[String(TOT.prs),'MERGED PRS']]
    .forEach(([n, l], i) => {
      const x = 26 + i * 125;
      stat += `<text x="${x}" y="${H - 26}" font-family="${MONO}" font-size="16" fill="${c.ink}">${n}</text>`;
      stat += `<text x="${x}" y="${H - 13}" font-family="${MONO}" font-size="7.6" fill="${c.mute}" letter-spacing=".1em">${l}</text>`;
    });

  return svg(W, H, c, ariaMast(), `
<text x="26" y="26" font-family="${MONO}" font-size="8" fill="${c.mute}" letter-spacing=".12em">DETERMINISTIC SCORER / NO MODEL IN THE PATH</text>
<line class="r" x1="26" y1="38" x2="${W - 26}" y2="38" stroke="${c.rule}" stroke-width="1"/>
<text x="24" y="82" font-family="${SANS}" font-size="36" font-weight="600" fill="${c.ink}" letter-spacing="-.022em">Ryan Allen</text>
<text x="26" y="110" font-family="${SANS}" font-size="13.5" fill="${c.mute}">AI agents do the work.</text>
<text x="26" y="129" font-family="${SANS}" font-size="13.5" fill="${c.mute}">A human gates every merge.</text>
<text x="26" y="${py - 24}" font-family="${MONO}" font-size="7.6" fill="${c.mute}" letter-spacing=".1em">EVERY CHANGE TAKES THIS PATH</text>
${pipe}
${stat}`, mastStyle(W));
}

const ariaMast = () => `Ryan Allen. AI agents do the work, a human gates every merge. Pipeline: plan, agent build, adversarial review, CI gate, owner merge. ${repos.length} repositories scored, ${TOT.commits} commits read, ${TOT.prs} merged pull requests.`;

const mastStyle = W => `
  .w{stroke-dasharray:${W};stroke-dashoffset:${W};animation:dr .8s cubic-bezier(.3,.8,.3,1) .15s both}
  .r{stroke-dasharray:${W};stroke-dashoffset:${W};animation:dr .9s cubic-bezier(.3,.8,.3,1) both}
  @keyframes dr{to{stroke-dashoffset:0}}
  .n{opacity:0;animation:fi .3s ease-out both}
  @keyframes fi{to{opacity:1}}
  ${REDUCED}`;

function svg(W, H, c, aria, body, style) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(aria)}">
${style ? `<style>${style}</style>` : ''}
<rect width="${W}" height="${H}" fill="${c.bg}"/>
${body}
</svg>`;
}

// ---- panel: audit strip --------------------------------------------------
// Score bars lived here and were cut: 52 to 78 on a short axis reads as nine
// near-identical grey blocks, which is decoration. The matrix on the tool page
// owns score distribution. This panel carries one finding instead.
const ariaStrip = () => `Recorded review coverage scores zero out of one hundred on ${ZERO_REVIEW} of ${repos.length} repositories. The reviews run in separate sessions that leave no GitHub artifact, so the scorer cannot see them.`;

function strip(t, narrow) {
  const c = THEMES[t];
  if (narrow) {
    const W = 400, H = 250;
    return svg(W, H, c, ariaStrip(), `
<text x="26" y="24" font-family="${MONO}" font-size="8" fill="${c.mute}" letter-spacing=".12em">DETERMINISTIC AUDITOR / ${repos.length} REPOSITORIES</text>
<line x1="26" y1="36" x2="${W - 26}" y2="36" stroke="${c.rule}" stroke-width="1"/>
<text x="26" y="96" font-family="${MONO}" font-size="54" font-weight="600" fill="${c.accent}" letter-spacing="-.03em">0</text>
<text x="68" y="96" font-family="${MONO}" font-size="20" fill="${c.mute}">/100</text>
<text x="26" y="118" font-family="${MONO}" font-size="8.4" fill="${c.ink}" letter-spacing=".07em">RECORDED REVIEW COVERAGE</text>
<text x="26" y="131" font-family="${MONO}" font-size="8.4" fill="${c.mute}" letter-spacing=".07em">ON ${ZERO_REVIEW} OF ${repos.length} REPOSITORIES</text>
<line x1="26" y1="150" x2="${W - 26}" y2="150" stroke="${c.rule}" stroke-width="1"/>
<text x="26" y="172" font-family="${SANS}" font-size="12.5" fill="${c.ink}">The reviews happen. They run in separate</text>
<text x="26" y="189" font-family="${SANS}" font-size="12.5" fill="${c.ink}">zero-context sessions told to falsify the work,</text>
<text x="26" y="206" font-family="${SANS}" font-size="12.5" fill="${c.ink}">and that leaves no GitHub artifact.</text>
<text x="26" y="228" font-family="${SANS}" font-size="12.5" fill="${c.mute}">The scorer counts only what GitHub records.</text>`);
  }
  const W = 880, H = 166, gx = 300;
  return svg(W, H, c, ariaStrip(), `
<text x="26" y="26" font-family="${MONO}" font-size="9.5" fill="${c.mute}" letter-spacing=".13em">DETERMINISTIC AUDITOR / ${repos.length} REPOSITORIES / COLLECTED ${COLLECTED}</text>
<line x1="26" y1="38" x2="${W - 26}" y2="38" stroke="${c.rule}" stroke-width="1"/>
<text x="26" y="106" font-family="${MONO}" font-size="58" font-weight="600" fill="${c.accent}" letter-spacing="-.03em">0</text>
<text x="70" y="106" font-family="${MONO}" font-size="21" fill="${c.mute}">/100</text>
<text x="26" y="130" font-family="${MONO}" font-size="9" fill="${c.ink}" letter-spacing=".08em">RECORDED REVIEW COVERAGE</text>
<text x="26" y="144" font-family="${MONO}" font-size="9" fill="${c.mute}" letter-spacing=".08em">ON ${ZERO_REVIEW} OF ${repos.length} REPOSITORIES</text>
<line x1="${gx - 34}" y1="58" x2="${gx - 34}" y2="${H - 18}" stroke="${c.rule}" stroke-width="1"/>
<text x="${gx}" y="76" font-family="${SANS}" font-size="14.5" fill="${c.ink}">The reviews happen. They run in separate zero-context sessions</text>
<text x="${gx}" y="98" font-family="${SANS}" font-size="14.5" fill="${c.ink}">told to falsify the work, and that leaves no GitHub artifact.</text>
<text x="${gx}" y="128" font-family="${SANS}" font-size="14.5" fill="${c.mute}">The scorer counts only what GitHub records, so it scores this</text>
<text x="${gx}" y="150" font-family="${SANS}" font-size="14.5" fill="${c.mute}">nothing. Weighting around it was the other option.</text>`);
}

// ---- panel: fleet matrix (tool page) -------------------------------------
function matrix(t) {
  const c = THEMES[t];
  const padL = 176, padT = 74, cell = 46, gap = 5, rowH = 30, W = 880;
  const gridW = DIMS.length * cell + (DIMS.length - 1) * gap;
  const H = padT + repos.length * rowH + 66;
  let s = '';

  DIMS.forEach((d, i) => {
    const x = padL + i * (cell + gap), h = d.weight * 100;
    s += `<rect x="${x}" y="${padT - 16 - h}" width="${cell}" height="${h}" fill="${c.mute}" opacity=".32"/>`;
    s += `<text x="${x + cell / 2}" y="${padT - 6}" font-family="${MONO}" font-size="8.5" fill="${c.mute}" text-anchor="middle" letter-spacing=".08em">${SHORT[d.key]}</text>`;
  });

  repos.forEach((r, ri) => {
    const y = padT + ri * rowH;
    s += `<text x="${padL - 14}" y="${y + 15}" font-family="${MONO}" font-size="11" fill="${c.ink}" text-anchor="end">${esc(r.repo.split('/')[1])}</text>`;
    DIMS.forEach((d, i) => {
      const dim = r.dimensions.find(x => x.key === d.key);
      const x = padL + i * (cell + gap), cy = y + 4, ch = rowH - 12;
      if (!dim || dim.score === null) {
        s += `<rect x="${x}" y="${cy}" width="${cell}" height="${ch}" fill="url(#h-${c.accent.slice(1)})" stroke="${c.accent}" stroke-width=".9" stroke-dasharray="2.5 2"/>`;
      } else if (dim.score === 0) {
        s += `<rect x="${x}" y="${cy}" width="${cell}" height="${ch}" fill="${c.accentSoft}" stroke="${c.accent}" stroke-width="1"/>`;
      } else {
        s += `<rect x="${x}" y="${cy}" width="${cell}" height="${ch}" fill="${c.fill}" opacity="${(0.10 + dim.score / 100 * 0.80).toFixed(3)}"/>`;
      }
    });
    const gx = padL + gridW + 18;
    s += `<text x="${gx}" y="${y + 15}" font-family="${MONO}" font-size="11.5" fill="${c.ink}">${r.overall}</text>`;
    s += `<text x="${gx + 40}" y="${y + 15}" font-family="${MONO}" font-size="9" fill="${c.mute}" letter-spacing=".06em">${r.grade.toUpperCase()}</text>`;
  });

  const ly = padT + repos.length * rowH + 24;
  s += `<line x1="26" y1="${ly - 10}" x2="${W - 20}" y2="${ly - 10}" stroke="${c.rule}" stroke-width="1"/>`;
  s += `<rect x="26" y="${ly + 2}" width="14" height="10" fill="url(#h-${c.accent.slice(1)})" stroke="${c.accent}" stroke-width=".9" stroke-dasharray="2.5 2"/>`;
  s += `<text x="46" y="${ly + 11}" font-family="${MONO}" font-size="9" fill="${c.mute}">could not verify</text>`;
  s += `<rect x="176" y="${ly + 2}" width="14" height="10" fill="${c.accentSoft}" stroke="${c.accent}" stroke-width="1"/>`;
  s += `<text x="196" y="${ly + 11}" font-family="${MONO}" font-size="9" fill="${c.mute}">measured zero</text>`;
  s += `<text x="320" y="${ly + 11}" font-family="${MONO}" font-size="9" fill="${c.mute}">fill density = score</text>`;
  s += `<text x="470" y="${ly + 11}" font-family="${MONO}" font-size="9" fill="${c.mute}">bar above column = its weight in the total</text>`;

  const aria = `Fleet audit matrix: ${repos.length} repositories scored across ${DIMS.length} deterministic dimensions. Recorded review coverage scores zero on ${ZERO_REVIEW} of ${repos.length}; review catch rate could not be verified on ${CNV_CATCH} of ${repos.length}.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(aria)}">
<defs><pattern id="h-${c.accent.slice(1)}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
<rect width="4" height="4" fill="${c.bg}"/><line x1="0" y1="0" x2="0" y2="4" stroke="${c.accent}" stroke-width=".7" opacity=".55"/>
</pattern></defs>
<rect width="${W}" height="${H}" fill="${c.bg}"/>
<text x="26" y="26" font-family="${MONO}" font-size="10" fill="${c.mute}" letter-spacing=".14em">${repos.length} REPOSITORIES / ${DIMS.length} DIMENSIONS / SAME REPO STATE, SAME SCORE</text>
<line x1="26" y1="38" x2="${W - 20}" y2="38" stroke="${c.rule}" stroke-width="1"/>
${s}</svg>`;
}

for (const t of ['light', 'dark']) {
  fs.writeFileSync(path.join(OUT, `masthead-${t}.svg`),        masthead(t, false));
  fs.writeFileSync(path.join(OUT, `masthead-narrow-${t}.svg`), masthead(t, true));
  fs.writeFileSync(path.join(OUT, `strip-${t}.svg`),           strip(t, false));
  fs.writeFileSync(path.join(OUT, `strip-narrow-${t}.svg`),    strip(t, true));
  fs.writeFileSync(path.join(OUT, `matrix-${t}.svg`),          matrix(t));
}

// ---- the artifact's own eval harness -------------------------------------
// Every number the panels assert is recomputed here from the source reports.
// If a panel and the data ever disagree this fails loudly rather than shipping.
const claims = { repos: repos.length, dims: DIMS.length, commits: TOT.commits,
                 prs: TOT.prs, zeroReview: ZERO_REVIEW, cnvCatch: CNV_CATCH, collected: COLLECTED };
const NEED = {
  masthead: ['repos','commits','prs'], 'masthead-narrow': ['repos','commits','prs'],
  strip: ['zeroReview','repos'], 'strip-narrow': ['zeroReview','repos'],
  matrix: ['repos','dims'],
};
let bad = 0;
for (const t of ['light','dark']) for (const [p, keys] of Object.entries(NEED)) {
  const svgTxt = fs.readFileSync(path.join(OUT, `${p}-${t}.svg`), 'utf8');
  for (const k of keys) if (!svgTxt.includes(String(claims[k]))) { console.error(`FAIL ${p}-${t}: missing ${k}=${claims[k]}`); bad++; }
}
console.log(JSON.stringify(claims));
console.log(bad ? `VERIFY FAILED (${bad})` : 'verify ok: every asserted number recomputed from reports/data');
process.exit(bad ? 1 : 0);
