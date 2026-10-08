#!/usr/bin/env node
// fonts.mjs: downloads Google Fonts as static TrueType files the renderer can use, with their licence files.
//   fonts.mjs "Gochi Hand:400" "Archivo:400,800,400i" --out <project>/fonts
// Weights are comma-separated; an "i" after a weight is its italic. Files are named <Family_Name>-<weight>[-italic].ttf,
// the name the renderer reads the family from. Fonts in <project>/fonts are loaded for that project only.
// Exit codes: 0 done, 1 failed (the message says how to fix it), 2 wrong call (usage).
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2), specs = [], opts = {};
for (let i = 0; i < argv.length; i++) { if (argv[i] === '--out') opts.out = argv[++i]; else if (argv[i] === '--help') opts.help = true; else specs.push(argv[i]); }
const USAGE = 'usage: fonts.mjs "<Family>:<weights>" ... --out <dir>   e.g. "Gochi Hand:400" "Archivo:400,800,400i"';
if (opts.help) { console.log(USAGE); process.exit(0); }
if (!specs.length || !opts.out) { console.error(`[product-explainer] ERROR: ${specs.length ? 'no --out folder' : 'no font given'}.\n` + USAGE); process.exit(2); }
fs.mkdirSync(opts.out, { recursive: true });
// an old-style user agent: the CSS API then serves one static TrueType file per style and weight
const UA = 'curl/8.0';
let failed = 0;
for (const spec of specs) {
  const [fam, w = '400'] = spec.split(':'), family = fam.trim();
  const items = w.split(',').map(s => s.trim()).filter(Boolean).map(s => ({ ital: /i$/i.test(s) ? 1 : 0, wght: parseInt(s, 10) || 400 }));
  items.sort((a, b) => a.ital - b.ital || a.wght - b.wght);
  const axis = items.some(x => x.ital) ? `ital,wght@${items.map(x => `${x.ital},${x.wght}`).join(';')}` : `wght@${items.map(x => x.wght).join(';')}`;
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:${axis}`;
  let css;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    css = await r.text();
  } catch (e) { console.error(`x ${family}: ${e.message} (check the name and weights on fonts.google.com)`); failed++; continue; }
  for (const b of css.split('@font-face').slice(1)) {
    const style = /font-style:\s*(\w+)/.exec(b)?.[1] || 'normal', weight = /font-weight:\s*(\d+)/.exec(b)?.[1] || '400';
    const src = /url\((https:[^)]+\.ttf)\)/.exec(b)?.[1]; if (!src) continue;
    const file = path.join(opts.out, `${family.replace(/\s+/g, '_')}-${weight}${style === 'italic' ? '-italic' : ''}.ttf`);
    const r = await fetch(src);
    if (!r.ok) { console.error(`x ${family} ${weight}: HTTP ${r.status}`); failed++; continue; }
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    console.log(`ok ${path.basename(file)}`);
  }
  // the licence, from the google/fonts repository (most are SIL OFL; a few are Apache or UFL)
  const slug = family.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!fs.readdirSync(opts.out).some(f => f.endsWith(`-${slug}.txt`))) {
    let got = false;
    for (const [dir, name] of [['ofl', 'OFL.txt'], ['apache', 'LICENSE.txt'], ['ufl', 'UFL.txt']]) {
      const r = await fetch(`https://raw.githubusercontent.com/google/fonts/main/${dir}/${slug}/${name}`);
      if (r.ok) { const lic = path.join(opts.out, `${dir === 'ofl' ? 'OFL' : 'LICENSE'}-${slug}.txt`); fs.writeFileSync(lic, await r.text()); console.log(`ok ${path.basename(lic)}`); got = true; break; }
    }
    if (!got) console.warn(`! ${family}: no licence file found in google/fonts; note its licence in the film's CREDITS by hand`);
  }
}
process.exit(failed ? 1 : 0);
