import fs from 'node:fs';
import path from 'node:path';

const HERE = import.meta.dirname;
const items = JSON.parse(fs.readFileSync(path.join(HERE, 'items.json'), 'utf8'));
const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Four sources, first match wins, so the narrow pair must come first. GitHub's
// sanitizer keeps `media` on <source>, verified against its own markdown API,
// which is what makes a real phone variant possible rather than a shrunk one.
// `width` is one of the few attributes GitHub's sanitizer keeps, and without it a
// panel sits at its authored pixel width in a container that is wider, so the page
// reads as a column of stranded images.
function pic(base, alt, full) {
  const w = full ? ' width="100%"' : '';
  return `<picture>
<source media="(max-width: 500px) and (prefers-color-scheme: dark)" srcset="assets/${base}-narrow-dark.svg">
<source media="(max-width: 500px)" srcset="assets/${base}-narrow-light.svg">
<source media="(prefers-color-scheme: dark)" srcset="assets/${base}-dark.svg">
<img alt="${esc(alt)}" src="assets/${base}-light.svg"${w}>
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

const MASTHEAD_ALT = 'Ryan Allen. I build AI systems, developer tools, and one Steam game. '
  + 'All of it ships through a review pipeline I built.';

const md = `<a href="https://fullbuild.ai"><img src="assets/img/hero.jpg" alt="A plotter drafts a technical elevation on the left; the same sheet is marked up and checked on the right." width="100%"></a>

${pic('masthead', MASTHEAD_ALT, true)}

### Products

${grid('product')}

### Developer tools

${grid('tool')}

### Engineering

${grid('proof')}

### Desktop utilities

${grid('utility')}

### Prototypes

<a href="https://fullbuild.ai/prototype"><img src="assets/img/prototypes.jpg" alt="fullbuild.ai prototypes: immersive web, digital storytelling, WebGL, motion, systems." width="100%"></a>

### How the work gets reviewed

The model that wrote the code never grades it.

<a href="https://fullbuild.ai"><img src="assets/img/review.jpg" alt="Two differently built inspection arms check the same drawing from opposite sides, each leaving its own correction marks, with a stamp press waiting at the end." width="100%"></a>

${pic('review', 'The review stage, one diff, two independent passes. Pass one is a handoff audit: a fresh session with no memory of the build, told to break the work. Pass two is a cross-vendor review: the same diff through a different vendor’s model. Each marks the lines it flagged, on its own side of the diff, and the two disagree.', true)}

Both passes are skills I wrote: **[handoff audit](https://github.com/ryanportfolio/AI-Firmware/blob/main/.claude/skills/handoff-audit/SKILL.md)** and **[/codex-review](https://github.com/ryanportfolio/AI-Firmware/blob/main/.claude/skills/codex-review/SKILL.md)**, the newer one, which runs the diff through OpenAI's Codex CLI and verifies every finding before it counts. Then CI, then a merge I authorise. [How I score all of it](AUDIT.md).

Those skills ship with **[Harness Firmware](https://fullbuild.ai/harness-firmware)**, the self-syncing template I start every repo from. The part that does the work is a reference library the agent writes back into: every gotcha that bites once gets recorded as a pitfall, and the next session reads it before touching that area. Knowledge accumulates in the repo instead of evaporating when a session ends.

### Where to go next

[**fullbuild.ai**](https://fullbuild.ai) carries this work with case notes and live prototypes. Background is on my [about page](https://corewise.academy/about).
`;

fs.writeFileSync(path.resolve('README.md'), md);

// countable honesty: every inventory item gets exactly one card, every product
// carries a real capture, every referenced asset is actually on disk. This counts
// the card link form specifically, so prose may also mention an item by name.
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
