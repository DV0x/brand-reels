#!/usr/bin/env node
// cutout.mjs: cuts a product out of a photo shot on a plain background (white, grey or one flat colour), in plain JS.
//   cutout.mjs <photo> --out <project>/product/main.png [--tol 30] [--crop x0,y0,x1,y1] [--shadows remove] [--box]
// --box: for a flat, boxy pack shot straight on (a bar, a carton) whose label is close to the background's colour.
// --uncut: no cut-out; saves the --crop part of the photo as it is (opaque), for a photo whose background can't be
// removed cleanly (a white pack on light grey). The film then shows it as a framed print or card.
// Prints a report: the background it found, how tall the product is in pixels, and anything to worry about, and saves
// <out>-check.jpg (the cut-out on red and on near-black) to look at before using it.
// A shadow cast on the background is kept by default (removing it can eat light parts of a label that touch the edge).
// To lose a shadow beside the product, crop it away with --crop (pixels of the original photo); --shadows remove is a
// last resort, and its check image must be looked at.
// Photos with a busy background (a table, a hand, a room) need a plain-background photo instead: ask the brand.
// A PNG that is already transparent is just trimmed.
// Exit codes: 0 done, 1 failed (the message says how to fix it), 2 wrong call (usage).
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage } from './lib/canvas.mjs';

const argv = process.argv.slice(2), opts = {}, pos = [];
for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) opts[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; else pos.push(argv[i]); }
const USAGE = 'usage: cutout.mjs <photo> --out <project>/product/main.png [--tol n] [--crop x0,y0,x1,y1] [--shadows remove] [--box] [--uncut]';
if (opts.help) { console.log(USAGE); process.exit(0); }
if (!pos[0]) { console.error('[product-explainer] ERROR: no photo given.\n' + USAGE); process.exit(2); }
if (!fs.existsSync(pos[0])) { console.error(`[product-explainer] ERROR: no file at ${pos[0]}. Download the product's photos first: site.mjs <url> --product <handle> --out <project>/product/raw\n` + USAGE); process.exit(2); }
const src = path.resolve(pos[0]), outFile = path.resolve(opts.out || src.replace(/\.[^.]+$/, '') + '-cut.png');

const img = await loadImage(fs.readFileSync(src));
const crop = opts.crop ? String(opts.crop).split(',').map(Number) : [0, 0, img.width, img.height];
const W = Math.round(crop[2] - crop[0]), H = Math.round(crop[3] - crop[1]), c = createCanvas(W, H), g = c.getContext('2d'); g.drawImage(img, -crop[0], -crop[1]);
const id = g.getImageData(0, 0, W, H), d = id.data, N = W * H, warnings = [];
const report = { photo: path.basename(src), size: `${W}x${H}` };
const closeUps = hPx => hPx >= 1400 ? 'fine: sharp up to full frame height' : hPx >= 900 ? 'fine up to about half the frame height; soft in a tight close-up' : hPx >= 600 ? 'keep it to about a third of the frame height' : 'small photo: keep the product small, or ask the brand for a bigger photo';
if (opts.uncut) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, c.toBuffer('image/png'));
  Object.assign(report, { mode: 'uncut (the background is kept)', out: outFile, closeUps: closeUps(H) + ' (for the whole crop; the product inside it is smaller)' });
  console.log(JSON.stringify(report, null, 1)); process.exit(0);
}

// the border ring tells us the background
const ring = [];
for (let x = 0; x < W; x += 2) for (const y of [0, 1, H - 2, H - 1]) ring.push((y * W + x) * 4);
for (let y = 0; y < H; y += 2) for (const x of [0, 1, W - 2, W - 1]) ring.push((y * W + x) * 4);
const transparent = ring.filter(i => d[i + 3] < 200).length / ring.length > 0.5;
const alpha = new Float32Array(N);

if (transparent) {
  for (let i = 0; i < N; i++) alpha[i] = d[i * 4 + 3] / 255;
  report.background = 'transparent already';
} else {
  const med = k => { const v = ring.map(i => d[i + k]).sort((a, b) => a - b); return v[v.length >> 1]; };
  const bg = [med(0), med(1), med(2)], dist = i => Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]);
  const ds = ring.map(dist).sort((a, b) => a - b), spread = ds[Math.floor(ds.length * 0.75)];   // robust to a shadow or prop touching the edge
  const T = +(opts.tol || Math.max(16, Math.min(60, spread * 3 + 14)));
  report.background = '#' + bg.map(v => v.toString(16).padStart(2, '0')).join('');
  report.backgroundSpread = +spread.toFixed(1); report.tolerance = +T.toFixed(1);
  if (spread > 18) warnings.push('the background is not plain (a texture, a scene or a gradient), so the cut-out will be rough: ask the brand for a photo on a plain background');
  // --box: a flat, boxy pack shot straight on (a bar, a carton). Its label can be the background's colour and touch its
  // edge, which a flood fill would eat. Find the pack's rectangle from pixels clearly unlike the background (shadows,
  // a darker shade of it, don't count) and keep everything inside it.
  const bl = bg.map(v => Math.max(8, v)), isShadow = i => { const k = (d[i] + d[i + 1] + d[i + 2]) / (bl[0] + bl[1] + bl[2]); if (k < 0.42 || k > 1.03) return false; return Math.abs(d[i] / bl[0] - k) < 0.07 && Math.abs(d[i + 1] / bl[1] - k) < 0.07 && Math.abs(d[i + 2] / bl[2] - k) < 0.07; };
  if (opts.box) {
    const rows = new Int32Array(H), cols = new Int32Array(W);
    for (let p = 0; p < N; p++) if (dist(p * 4) > T && !isShadow(p * 4)) { rows[(p / W) | 0]++; cols[p % W]++; }
    const rmax = Math.max(...rows), cmax = Math.max(...cols), rIn = y => rows[y] > rmax * 0.08, cIn = x => cols[x] > cmax * 0.08;
    let bx0 = 0, bx1 = W - 1, by0 = 0, by1 = H - 1;
    while (bx0 < W - 1 && !cIn(bx0)) bx0++; while (bx1 > bx0 && !cIn(bx1)) bx1--; while (by0 < H - 1 && !rIn(by0)) by0++; while (by1 > by0 && !rIn(by1)) by1--;
    for (let p = 0; p < N; p++) { const x = p % W, y = (p / W) | 0; alpha[p] = x >= bx0 && x <= bx1 && y >= by0 && y <= by1 ? 1 : 0; }
    report.box = [bx0 + crop[0], by0 + crop[1], bx1 + crop[0], by1 + crop[1]];
  } else {
  // flood fill the background from the edges
  const isBg = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
  const push = p => { if (!isBg[p] && dist(p * 4) < T) { isBg[p] = 1; q[qt++] = p; } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (qh < qt) { const p = q[qh++], x = p % W; if (x > 0) push(p - 1); if (x < W - 1) push(p + 1); if (p >= W) push(p - W); if (p < N - W) push(p + W); }
  // shadows cast on the background are a darker shade of it (same colour, less light): remove them too (--shadows keep to skip)
  if (opts.shadows === 'remove') {
    let shadowPx = 0; const push2 = p => { if (!isBg[p] && isShadow(p * 4)) { isBg[p] = 2; q[qt++] = p; shadowPx++; } };
    for (let p = 0; p < N; p++) if (isBg[p] === 1) { const x = p % W; if (x > 0) push2(p - 1); if (x < W - 1) push2(p + 1); if (p >= W) push2(p - W); if (p < N - W) push2(p + W); }
    while (qh < qt) { const p = q[qh++], x = p % W; if (x > 0) push2(p - 1); if (x < W - 1) push2(p + 1); if (p >= W) push2(p - W); if (p < N - W) push2(p + W); }
    if (shadowPx > N * 0.002) report.shadowRemoved = +(100 * shadowPx / N).toFixed(1) + '% of the photo';
  }
  // soft edge: pixels next to the background get partial alpha by how far their colour is from it, and lose its tint
  for (let p = 0; p < N; p++) {
    if (isBg[p]) { alpha[p] = 0; continue; }
    const x = p % W, edge = (x > 0 && isBg[p - 1]) || (x < W - 1 && isBg[p + 1]) || (p >= W && isBg[p - W]) || (p < N - W && isBg[p + W]);
    if (!edge) { alpha[p] = 1; continue; }
    const a = Math.max(0.2, Math.min(1, (dist(p * 4) - T * 0.5) / (T * 1.4))); alpha[p] = a;
    for (let k = 0; k < 3; k++) d[p * 4 + k] = Math.max(0, Math.min(255, (d[p * 4 + k] - (1 - a) * bg[k]) / a));
  }
  }
}

// keep the product, drop specks: the largest piece and anything at least 3% of its size
const lab = new Int32Array(N).fill(-1), sizes = [], stack = new Int32Array(N);
for (let p0 = 0; p0 < N; p0++) {
  if (alpha[p0] < 0.5 || lab[p0] >= 0) continue;
  const L = sizes.length; let sp = 0, n = 0; stack[sp++] = p0; lab[p0] = L;
  while (sp) { const p = stack[--sp], x = p % W; n++; for (const q2 of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) if (q2 >= 0 && q2 < N && lab[q2] < 0 && alpha[q2] >= 0.5) { lab[q2] = L; stack[sp++] = q2; } }
  sizes.push(n);
}
const big = sizes.reduce((m, v) => Math.max(m, v), 0), keep = L => L >= 0 && sizes[L] >= big * 0.03;
for (let p = 0; p < N; p++) {
  if (alpha[p] <= 0) continue;
  if (lab[p] >= 0) { if (!keep(lab[p])) alpha[p] = 0; continue; }
  const x = p % W;   // a soft edge pixel stays only if it touches a kept piece
  if (!((x > 0 && keep(lab[p - 1])) || (x < W - 1 && keep(lab[p + 1])) || (p >= W && keep(lab[p - W])) || (p < N - W && keep(lab[p + W])))) alpha[p] = 0;
}
// a light 3x3 blur of the alpha edge
const a2 = Float32Array.from(alpha);
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const p = y * W + x; if (alpha[p] > 0 && alpha[p] < 1 || alpha[p] === 1 && (alpha[p - 1] === 0 || alpha[p + 1] === 0 || alpha[p - W] === 0 || alpha[p + W] === 0)) { let s = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s += alpha[p + j * W + i]; a2[p] = s / 9; } }
let x0 = W, y0 = H, x1 = -1, y1 = -1, cover = 0;
for (let p = 0; p < N; p++) { d[p * 4 + 3] = Math.round(a2[p] * 255); if (a2[p] > 0.1) { const x = p % W, y = (p / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; cover++; } }
if (x1 < 0) { console.error('[product-explainer] ERROR: nothing left after cutting out the background. Try --tol 12, or a photo on a plain background.'); process.exit(1); }
g.putImageData(id, 0, 0);
const pad = 8, cx0 = Math.max(0, x0 - pad), cy0 = Math.max(0, y0 - pad), cw = Math.min(W, x1 + pad + 1) - cx0, ch = Math.min(H, y1 + pad + 1) - cy0;
const o = createCanvas(cw, ch); o.getContext('2d').drawImage(c, cx0, cy0, cw, ch, 0, 0, cw, ch);
fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, o.toBuffer('image/png'));

// a cast shadow usually shows up as a much wider bottom than middle
{ const rowW = y => { let l = -1, r = -1; for (let x = 0; x < W; x++) if (a2[y * W + x] > 0.5) { if (l < 0) l = x; r = x; } return l < 0 ? 0 : r - l; };
  const mid = rowW(Math.round(y0 + (y1 - y0) * 0.55)), bot = Math.max(rowW(Math.round(y1 - (y1 - y0) * 0.03)), rowW(Math.round(y1 - (y1 - y0) * 0.06)));
  if (!transparent && opts.shadows !== 'remove' && bot > mid * 1.45) warnings.push(`the bottom is ${(bot / mid).toFixed(1)}x wider than the middle: a shadow on the floor is probably attached. Look at the check image; crop it away with --crop x0,y0,x1,y1 (original photo pixels), or ask for a photo without a cast shadow`); }
const touches = []; if (x0 <= 1) touches.push('left'); if (x1 >= W - 2) touches.push('right'); if (y0 <= 1) touches.push('top'); if (y1 >= H - 2) touches.push('bottom');
if (touches.length) warnings.push(`the product touches the photo's ${touches.join(' and ')} edge, so it may be cropped in the photo itself`);
const coverage = cover / N;
if (coverage < 0.04) warnings.push('the product is tiny in this photo: look for a closer shot');
if (!transparent && coverage > 0.9) warnings.push('almost nothing was removed: the background may be too close in colour to the product, try --tol 12 or another photo');
const hPx = y1 - y0 + 1;
report.out = outFile; report.productPx = `${x1 - x0 + 1}x${hPx}`; report.coverage = +(coverage * 100).toFixed(1) + '%';
report.closeUps = closeUps(hPx);
report.warnings = warnings;
// the check image: the cut-out on red and on near-black, side by side
{ const s = Math.min(1, 900 / ch), cw2 = Math.round(cw * s) + 60, ch2 = Math.round(ch * s) + 60, k = createCanvas(cw2 * 2, ch2), kg = k.getContext('2d');
  kg.fillStyle = '#C0392B'; kg.fillRect(0, 0, cw2, ch2); kg.fillStyle = '#16141A'; kg.fillRect(cw2, 0, cw2, ch2);
  for (const ox of [0, cw2]) kg.drawImage(o, ox + 30, 30, cw * s, ch * s);
  report.check = outFile.replace(/\.png$/i, '') + '-check.jpg'; fs.writeFileSync(report.check, k.toBuffer('image/jpeg', 88)); }
console.log(JSON.stringify(report, null, 1));
