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
// Switching the animations off is not enough: the drawn-in rules start at a full
// dash offset and the nodes start transparent, so a reader who asks for reduced
// motion would get a panel with its lines missing. Restore the end state too.
const REDUCED = '@media (prefers-reduced-motion:reduce){*{animation:none!important}'
              + '.w,.r{stroke-dashoffset:0}.n,.mk{opacity:1}}';

// Wide labels wrap to two lines and go unreadable in a 400px frame, so narrow
// gets its own single-word set rather than a shrunk copy of the wide one.
const STAGES      = [['PLAN',0],['AGENT BUILD',0],['ADVERSARIAL REVIEW',0],['CI GATE',0],['OWNER MERGE',1]];
const STAGES_THIN = [['PLAN',0],['BUILD',0],['REVIEW',0],['CI',0],['MERGE',1]];

// Line breaks are hand-set, not wrapped: the wide column runs out at roughly 57
// characters before it reaches the pipeline diagram, and a wrapper cannot know
// where the sentence wants to break.
const COPY = {
  wide:   ['I build AI systems, developer tools, and one Steam game.',
           'All of it ships through a review pipeline I built.'],
  narrow: ['I build AI systems, developer tools,', 'and one Steam game.',
           'All of it ships through a review', 'pipeline I built.'],
};

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
${COPY.wide.map((l, i) => `<text x="26" y="${124 + i * 22}" font-family="${SANS}" font-size="15.5" fill="${c.mute}">${esc(l)}</text>`).join('\n')}
<text x="${px}" y="${py - 26}" font-family="${MONO}" font-size="8" fill="${c.mute}" letter-spacing=".1em">EVERY CHANGE TAKES THIS PATH</text>
${pipe}
<rect class="tk" x="${(px - 2.5).toFixed(1)}" y="${py - 16}" width="5" height="5" fill="${c.fill}"/>
${stat}`, mastStyle(W, step));
}

function mastheadThin(c) {
  // Height follows the copy: a variant with an extra line would otherwise push
  // the sentences straight through the pipeline label.
  const W = 400, px = 26, pw = W - 52;
  const lastLine = 110 + (COPY.narrow.length - 1) * 19;
  const py = lastLine + 46;
  const H = py + 88;
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
${COPY.narrow.map((l, i) => `<text x="26" y="${110 + i * 19}" font-family="${SANS}" font-size="13.5" fill="${c.mute}">${esc(l)}</text>`).join('\n')}
<text x="26" y="${py - 24}" font-family="${MONO}" font-size="7.6" fill="${c.mute}" letter-spacing=".1em">EVERY CHANGE TAKES THIS PATH</text>
${pipe}
<rect class="tk" x="${(px - 2.5).toFixed(1)}" y="${py - 15}" width="5" height="5" fill="${c.fill}"/>
${stat}`, mastStyle(W, step));
}

// Read off the copy rather than restated, so the two cannot drift apart.
const ariaMast = () => `Ryan Allen. ${COPY.wide.join(' ')} Pipeline: `
  + `${STAGES.map(s => s[0].toLowerCase()).join(', ')}. `
  + `${repos.length} repositories scored, ${TOT.commits} commits read, ${TOT.prs} merged pull requests.`;

// The draw-in is a one-shot and it is over in under a second, which on a profile
// page means nobody sees it: the panel is already finished by the time you look.
// The travelling mark is the part that is actually visible, so it loops. It is
// ink, not accent, because it is a change moving normally rather than a finding.
const travel = step => {
  const at = i => `transform:translateX(${(i * step).toFixed(1)}px)`;
  const stops = [[10, 0], [18, 1], [26, 1], [34, 2], [46, 2], [54, 3], [62, 3], [70, 4]]
    .map(([pc, i]) => `${pc}%{${at(i)}}`).join('');
  return `
  .tk{opacity:0;animation:tk 9s cubic-bezier(.6,0,.4,1) 1.2s infinite}
  @keyframes tk{0%{${at(0)};opacity:0}4%{${at(0)};opacity:1}${stops}94%{${at(4)};opacity:1}100%{${at(4)};opacity:0}}`;
};

const mastStyle = (W, step) => `
  .w{stroke-dasharray:${W};stroke-dashoffset:${W};animation:dr .8s cubic-bezier(.3,.8,.3,1) .15s both}
  .r{stroke-dasharray:${W};stroke-dashoffset:${W};animation:dr .9s cubic-bezier(.3,.8,.3,1) both}
  @keyframes dr{to{stroke-dashoffset:0}}
  .n{opacity:0;animation:fi .3s ease-out both}
  @keyframes fi{to{opacity:1}}${travel(step)}
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

// ---- panel: review path --------------------------------------------------
// The masthead draws the whole path. This panel opens up one stage of it, the
// review, because that is the part that is unusual and the part a sentence
// describes badly. Two passes read the same diff and mark different lines,
// which is the whole argument for running two of them.
//
// Marks are ink, not accent. Running the accent here would spend it on a good
// outcome; it stays reserved for the footer, where the instrument goes blind.
const REV_ROWS = 18;
const P1_MARKS = [2, 7, 13];   // what the first pass caught
const P2_MARKS = [5, 7, 15];   // what the second caught: one row in common
const REV_COPY = {
  p1: ['A fresh session with no', 'memory of the build, told', 'to break the work'],
  p2: ['The same diff again,', 'through a different', "vendor's model"],
};

// Seeded so a rebuild is byte-identical and the light and dark panels agree.
const ROW_W = (() => {
  let s = 20260817;
  return Array.from({ length: REV_ROWS }, () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return 0.30 + (s / 0x7fffffff) * 0.66;
  });
})();

// One loop, ten seconds: pass one sweeps down, pass two sweeps back up, then a
// beat before it repeats. Each mark gets its own keyframes so it lands exactly
// when the sweep reaches its row instead of on a guessed delay.
function revStyle(bh, marks) {
  const pct = t => (t / 10 * 100).toFixed(1);
  let s = `
  .sw{opacity:0}
  .s1{animation:s1 10s cubic-bezier(.45,0,.55,1) infinite}
  .s2{animation:s2 10s cubic-bezier(.45,0,.55,1) infinite}
  @keyframes s1{0%{transform:translateY(0);opacity:0}2%{opacity:1}33%{transform:translateY(${bh}px);opacity:1}36%,100%{transform:translateY(${bh}px);opacity:0}}
  @keyframes s2{0%,40%{transform:translateY(${bh}px);opacity:0}42%{opacity:1}73%{transform:translateY(0);opacity:1}76%,100%{transform:translateY(0);opacity:0}}
  .mk{opacity:0}`;
  marks.forEach((at, i) => {
    s += `\n  .mk${i}{animation:mk${i} 10s linear infinite}`;
    s += `\n  @keyframes mk${i}{0%,${pct(at)}%{opacity:0}${pct(at + 0.15)}%{opacity:1}94%{opacity:1}100%{opacity:0}}`;
  });
  return s + `\n  ${REDUCED}`;
}

// Deliberately asserts no numbers. How the scorer treats these passes is the
// audit tool's business and lives on AUDIT.md; the front door just shows the shape.
const ariaRev = () => 'How the work gets reviewed. The same diff is read twice. '
  + 'The first pass is a handoff audit: a fresh session with no memory of the build, told to break the work. '
  + "The second is a cross-vendor review: the same diff through a different vendor's model. "
  + 'Each pass marks the lines it flagged, on its own side of the diff, and the two disagree.';

function review(t, narrow) {
  const c = THEMES[t];
  const L = narrow
    ? { W:400, bx:150, bw:190, by:150, gap:8,  mono:8,   sans:12,   lead:16 }
    : { W:880, bx:270, bw:340, by:78,  gap:10, mono:9.5, sans:13.5, lead:18 };
  L.gutL = L.bx - 24;
  L.gutR = L.bx + L.bw + 10;
  const bh = (REV_ROWS - 1) * L.gap;
  const rowY = i => L.by + i * L.gap;

  // Sweep time for a row: pass one runs 0 to 3.3s down the block, pass two runs
  // 4.0 to 7.3s back up it. A mark lands as its own sweep crosses it.
  const marks = [
    ...P1_MARKS.map(r => (r / (REV_ROWS - 1)) * 3.3),
    ...P2_MARKS.map(r => 4.0 + ((REV_ROWS - 1 - r) / (REV_ROWS - 1)) * 3.3),
  ];

  let rows = '';
  ROW_W.forEach((w, i) => {
    rows += `<line x1="${L.bx}" y1="${rowY(i)}" x2="${(L.bx + w * L.bw).toFixed(1)}" y2="${rowY(i)}" `
         +  `stroke="${c.mute}" stroke-width="1.6" opacity=".38"/>`;
  });

  let mk = '';
  [...P1_MARKS.map(r => [r, L.gutL]), ...P2_MARKS.map(r => [r, L.gutR])].forEach(([r, x], i) => {
    mk += `<rect class="mk mk${i}" x="${x}" y="${rowY(r) - 2}" width="14" height="4" fill="${c.fill}"/>`;
  });

  const sweep = cls => `<line class="sw ${cls}" x1="${L.gutL - 4}" y1="${L.by}" x2="${L.bx + L.bw + 14}" y2="${L.by}" `
    + `stroke="${c.ink}" stroke-width="1" opacity="0"/>`;

  const label = (x, y, kicker, lines, anchor = 'start') => {
    let s = `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${narrow ? 8 : 9}" fill="${c.ink}" `
          + `text-anchor="${anchor}" letter-spacing=".12em">${kicker}</text>`;
    lines.forEach((l, i) => {
      s += `<text x="${x}" y="${y + 20 + i * L.lead}" font-family="${SANS}" font-size="${L.sans}" `
        +  `fill="${c.mute}" text-anchor="${anchor}">${esc(l)}</text>`;
    });
    return s;
  };

  const bound = y => `<line x1="${L.bx - 10}" y1="${y}" x2="${L.bx + L.bw + 10}" y2="${y}" stroke="${c.rule}" stroke-width="1"/>`;

  // Without this a reader sees ticks appear and has to guess. Say what the mark
  // is, and let the side it lands on say which pass put it there.
  // Two short lines, not one long one: the left column runs out at the diff
  // block and a single line walks straight into the rows.
  const legend = y => {
    const fs = narrow ? 7.6 : 8.5;
    const line = (t, dy) => `<text x="48" y="${y + dy}" font-family="${MONO}" font-size="${fs}" `
      + `fill="${c.mute}" letter-spacing=".08em">${t}</text>`;
    return `<rect x="26" y="${y - 4}" width="14" height="4" fill="${c.fill}"/>`
      + line('MARKS ARE LINES A PASS FLAGGED', 0)
      + line('EACH PASS MARKS ITS OWN SIDE', 13);
  };

  const last = rowY(REV_ROWS - 1);

  if (narrow) {
    const H = last + 156;
    return svg(L.W, H, c, ariaRev(), `
<text x="26" y="26" font-family="${MONO}" font-size="8" fill="${c.mute}" letter-spacing=".12em">THE REVIEW STAGE / ONE DIFF / TWO PASSES</text>
<line x1="26" y1="38" x2="${L.W - 26}" y2="38" stroke="${c.rule}" stroke-width="1"/>
${label(26, 60, 'PASS 1  HANDOFF AUDIT', REV_COPY.p1)}
${bound(L.by - 14)}
${rows}${mk}${sweep('s1')}${sweep('s2')}
${bound(last + 14)}
${label(26, last + 40, 'PASS 2  CROSS-VENDOR', REV_COPY.p2)}
${legend(last + 128)}`, revStyle(bh, marks));
  }

  const H = last + 40;
  return svg(L.W, H, c, ariaRev(), `
<text x="26" y="26" font-family="${MONO}" font-size="${L.mono}" fill="${c.mute}" letter-spacing=".13em">THE REVIEW STAGE / ONE DIFF / TWO INDEPENDENT PASSES</text>
<line x1="26" y1="38" x2="${L.W - 26}" y2="38" stroke="${c.rule}" stroke-width="1"/>
${label(26, L.by - 8, 'PASS 1  HANDOFF AUDIT', REV_COPY.p1)}
${label(L.W - 26, last + 16 - 56, 'PASS 2  CROSS-VENDOR', REV_COPY.p2, 'end')}
${bound(L.by - 16)}
${rows}${mk}${sweep('s1')}${sweep('s2')}
${bound(last + 16)}
${legend(L.by + 122)}`, revStyle(bh, marks));
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
  fs.writeFileSync(path.join(OUT, `review-${t}.svg`),          review(t, false));
  fs.writeFileSync(path.join(OUT, `review-narrow-${t}.svg`),   review(t, true));
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
  // review-* asserts no numbers by design, so there is nothing here to recheck.
};
let bad = 0;
for (const t of ['light','dark']) for (const [p, keys] of Object.entries(NEED)) {
  const svgTxt = fs.readFileSync(path.join(OUT, `${p}-${t}.svg`), 'utf8');
  for (const k of keys) if (!svgTxt.includes(String(claims[k]))) { console.error(`FAIL ${p}-${t}: missing ${k}=${claims[k]}`); bad++; }
}
console.log(JSON.stringify(claims));
console.log(bad ? `VERIFY FAILED (${bad})` : 'verify ok: every asserted number recomputed from reports/data');
process.exit(bad ? 1 : 0);
