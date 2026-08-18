#!/usr/bin/env node
/**
 * Rebuild the profile front door and the audit page from source data.
 *
 * Everything drawn here is generated, never hand-placed: the SVG panels and the
 * scoreboard both read reports/data, and the product grid reads items.json. So
 * when a fleet run changes a score, `npm run profile` is the only step needed to
 * make the page tell the truth again.
 *
 * Raster art (assets/img) is produced separately by images.ps1 from captures and
 * generated illustrations; it does not change when scores change.
 *
 * Run from the repo root:  node scripts/profile/build.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const HERE = import.meta.dirname;
const root = path.resolve(HERE, '..', '..');

if (!existsSync(path.join(root, 'reports', 'data'))) {
  console.error('reports/data missing: run the fleet audit before rebuilding the profile.');
  process.exit(1);
}

const steps = [
  ['panels.mjs', 'deterministic SVG panels from reports/data'],
  ['cards.mjs',  'one card per inventory item, four responsive variants each'],
  ['audit.mjs',  'AUDIT.md, scoreboard included'],
  ['readme.mjs', 'README.md, the profile front door'],
];

for (const [file, what] of steps) {
  process.stderr.write(`\n→ ${file}  (${what})\n`);
  execFileSync(process.execPath, [path.join(HERE, file)], { cwd: root, stdio: 'inherit' });
}

process.stderr.write('\nProfile rebuilt. Each step verified its own counts above.\n');
