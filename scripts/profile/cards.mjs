import fs from 'node:fs';
import path from 'node:path';

const HERE = import.meta.dirname;
const OUT = path.resolve('assets');
fs.mkdirSync(OUT, { recursive: true });

const items = JSON.parse(fs.readFileSync(path.join(HERE, 'items.json'), 'utf8'));

// Same contract as the panels. Accent stays reserved for the honest gap and is
// deliberately absent here: nothing on a product card is a measurement.
// No border on the card itself: GitHub's own table cell already draws one, and
// two nested rectangles read as a bug rather than a frame.
const THEMES = {
  light: { bg:'#ffffff', ink:'#1f2328', mute:'#59636e', hair:'#eaeef2', fill:'#1f2328' },
  dark:  { bg:'#0d1117', ink:'#f0f6fc', mute:'#9198a1', hair:'#21262d', fill:'#f0f6fc' },
};
const MONO = "ui-monospace,'SF Mono','Cascadia Mono',Menlo,Consolas,'Liberation Mono',monospace";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// mark semantics: filled = a live destination you can use right now,
// hollow = source you read. Nothing else encodes anything.
const LIVE = new Set(['product', 'tool']);
const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function wrap(text, size, maxPx) {
  const per = size * 0.505;
  const max = Math.floor(maxPx / per);
  const out = [], words = text.split(' ');
  let line = '';
  for (const w of words) {
    if (!line) { line = w; continue; }
    if ((line + ' ' + w).length <= max) line += ' ' + w;
    else { out.push(line); line = w; }
  }
  if (line) out.push(line);
  return out;
}

function card(it, t, W) {
  const c = THEMES[t];
  const H = 86, live = LIVE.has(it.tier);
  const lines = wrap(it.desc, 11.5, W - 56).slice(0, 2);
  const mark = live
    ? `<rect x="16" y="25" width="9" height="9" fill="${c.fill}"/>`
    : `<rect x="16.5" y="25.5" width="8" height="8" fill="none" stroke="${c.mute}" stroke-width="1.3"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(it.name)}. ${esc(it.desc)}.">
<rect width="${W}" height="${H}" fill="${c.bg}"/>
${mark}
<text x="36" y="34" font-family="${SANS}" font-size="15.5" font-weight="600" fill="${c.ink}" letter-spacing="-.008em">${esc(it.name)}</text>
<text x="${W - 14}" y="34" font-family="${MONO}" font-size="8.4" fill="${c.mute}" text-anchor="end" letter-spacing=".06em">${esc(it.host.toUpperCase())}</text>
<line x1="16" y1="45" x2="${W - 14}" y2="45" stroke="${c.hair}" stroke-width="1"/>
${lines.map((l, i) => `<text x="16" y="${62 + i * 15}" font-family="${SANS}" font-size="11.5" fill="${c.mute}">${esc(l)}</text>`).join('\n')}
</svg>`;
}

// A GitHub table keeps its two columns at every width, so on a phone each card
// lands in a ~175px slot. Shrinking the wide card there renders the description
// at roughly 5px. The narrow card drops the description instead of shrinking it:
// name and destination stay readable, which is what the tap needs.
function cardThin(it, t) {
  const c = THEMES[t];
  const W = 200, H = 62, live = LIVE.has(it.tier);
  const name = it.name.length > 17 ? it.name.slice(0, 16) + '…' : it.name;
  const mark = live
    ? `<rect x="12" y="20" width="8" height="8" fill="${c.fill}"/>`
    : `<rect x="12.5" y="20.5" width="7" height="7" fill="none" stroke="${c.mute}" stroke-width="1.2"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(it.name)}. ${esc(it.desc)}.">
<rect width="${W}" height="${H}" fill="${c.bg}"/>
${mark}
<text x="28" y="28" font-family="${SANS}" font-size="13" font-weight="600" fill="${c.ink}" letter-spacing="-.008em">${esc(name)}</text>
<line x1="12" y1="38" x2="${W - 12}" y2="38" stroke="${c.hair}" stroke-width="1"/>
<text x="12" y="52" font-family="${MONO}" font-size="7.6" fill="${c.mute}" letter-spacing=".06em">${esc(it.host.toUpperCase())}</text>
</svg>`;
}

// A tier with an odd count would leave a visibly empty table cell, so its last
// item gets a full-width variant in a colspan cell instead.
const counts = items.reduce((a, i) => (a[i.tier] = (a[i.tier] || 0) + 1, a), {});
const oddLast = new Set();
for (const [tier, n] of Object.entries(counts)) {
  if (n % 2 === 1) oddLast.add(items.filter(i => i.tier === tier).slice(-1)[0].name);
}

let n = 0;
for (const it of items) {
  for (const t of ['light', 'dark']) {
    fs.writeFileSync(path.join(OUT, `card-${slug(it.name)}-${t}.svg`), card(it, t, 424)); n++;
    fs.writeFileSync(path.join(OUT, `card-${slug(it.name)}-narrow-${t}.svg`), cardThin(it, t)); n++;
    if (oddLast.has(it.name)) {
      fs.writeFileSync(path.join(OUT, `card-${slug(it.name)}-wide-${t}.svg`), card(it, t, 862)); n++;
      fs.writeFileSync(path.join(OUT, `card-${slug(it.name)}-wide-narrow-${t}.svg`), card(it, t, 400)); n++;
    }
  }
}

console.log(`wrote ${n} card svgs for ${items.length} items`);
console.log('by tier: ' + JSON.stringify(counts));
console.log('full-width (odd tail): ' + [...oddLast].join(', '));
