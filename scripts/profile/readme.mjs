import fs from 'node:fs';
import path from 'node:path';

const HERE = import.meta.dirname;
const items = JSON.parse(fs.readFileSync(path.join(HERE, 'items.json'), 'utf8'));
const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Four sources, first match wins, so the narrow pair must come first. GitHub's
// sanitizer keeps `media` on <source>, verified against its own markdown API,
// which is what makes a real phone variant possible rather than a shrunk one.
function pic(base, alt) {
  return `<picture>
<source media="(max-width: 500px) and (prefers-color-scheme: dark)" srcset="assets/${base}-narrow-dark.svg">
<source media="(max-width: 500px)" srcset="assets/${base}-narrow-light.svg">
<source media="(prefers-color-scheme: dark)" srcset="assets/${base}-dark.svg">
<img alt="${esc(alt)}" src="assets/${base}-light.svg">
</picture>`;
}

// Products lead with a real capture of the running thing. The drawn card carries
// the type underneath so every tier shares one typographic system, and the whole
// cell is one link target.
function cell(it, wide) {
  const base = 'card-' + slug(it.name) + (wide ? '-wide' : '');
  const attr = wide ? ' colspan="2"' : ' width="50%"';
  const shot = it.shot ? `<img src="assets/img/${it.shot}" alt="${esc(it.name)} screenshot">\n` : '';
  return `<td${attr}>
<a href="${it.url}">
${shot}${pic(base, `${it.name}. ${it.desc}.`)}
</a>
</td>`;
}

// An odd tier would otherwise end on a visibly empty cell, so its tail spans
// both columns with a full-width card rather than leaving a hole.
function grid(tier) {
  const list = items.filter(i => i.tier === tier);
  const odd = list.length % 2 === 1;
  const pairs = odd ? list.slice(0, -1) : list;
  const rows = [];
  for (let i = 0; i < pairs.length; i += 2) rows.push(pairs.slice(i, i + 2).map(it => cell(it, false)));
  if (odd) rows.push([cell(list[list.length - 1], true)]);
  return '<table>\n' + rows.map(r => `<tr>\n${r.join('\n')}\n</tr>`).join('\n') + '\n</table>';
}

const md = `<img src="assets/img/hero.jpg" alt="A plotter drafts a technical elevation on the left; the same sheet is marked up and checked on the right.">

${pic('masthead', 'Ryan Allen. AI agents do the work, a human gates every merge.')}

### Products

${grid('product')}

### Developer tools

${grid('tool')}

### Engineering

${grid('proof')}

### Desktop utilities

${grid('utility')}

### Prototypes

<a href="https://fullbuild.ai/prototype"><img src="assets/img/prototypes.jpg" alt="fullbuild.ai prototypes: immersive web, digital storytelling, WebGL, motion, systems."></a>

### How the work gets reviewed

<img src="assets/img/review.jpg" alt="Two differently built inspection arms check the same drawing from opposite sides, each leaving its own correction marks, with a stamp press waiting at the end.">

The agent that wrote the code never grades it. Every change gets checked twice, by two things that did not build it, before anything reaches a branch I would merge.

A **[handoff audit](https://github.com/ryanportfolio/AI-Firmware/blob/main/.claude/skills/handoff-audit/SKILL.md)** writes a self-contained brief for a zero-context session and charges it to falsify the work rather than approve it. A **[cross-vendor review](https://github.com/ryanportfolio/AI-Firmware/blob/main/.claude/skills/codex-review/SKILL.md)** then runs the same diff through a different vendor's model entirely, OpenAI's Codex CLI at high reasoning, and every finding it returns is verified before it counts. Two vendors disagree in different places than one vendor disagrees with itself.

Then CI, then a merge I authorise. None of that leaves a GitHub artifact, so my own deterministic auditor scores the review work at zero and publishes the zero rather than weighting around it.

Every repo I own carries a scored report from that auditor: same repo state, same score, no model in the scoring path. [How the scoring works](AUDIT.md) and the [live report viewer](https://audit.corewise.academy/).

### Elsewhere

[fullbuild.ai](https://fullbuild.ai) portfolio and prototypes · [corewise.academy](https://corewise.academy/about) guides · [savetokens.tips](https://savetokens.tips) measured token techniques
`;

fs.writeFileSync(path.resolve('README.md'), md);

// countable honesty: every inventory item linked exactly once, every product
// carrying a real capture, and every referenced asset actually on disk.
let bad = 0;
for (const it of items) {
  const hits = md.split(`href="${it.url}"`).length - 1;
  if (hits !== 1) { console.error(`FAIL ${it.name}: linked ${hits} times`); bad++; }
  if (it.tier === 'product' && !it.shot) { console.error(`FAIL ${it.name}: product without a capture`); bad++; }
}
for (const m of md.matchAll(/(?:src|srcset)="(assets\/[^"]+)"/g)) {
  if (!fs.existsSync(path.resolve(m[1]))) { console.error(`FAIL missing asset ${m[1]}`); bad++; }
}
const cards = new Set([...md.matchAll(/assets\/(card-[a-z0-9-]+?)(?:-wide)?-narrow-dark\.svg/g)].map(m => m[1]));
console.log(`inventory ${items.length}, distinct cards ${cards.size}, products with captures ${items.filter(i => i.shot).length}`);
if (bad || cards.size !== items.length) { console.error(`MISMATCH (${bad} problems)`); process.exit(1); }
console.log('verify ok: page links the whole inventory once each, every asset present');
