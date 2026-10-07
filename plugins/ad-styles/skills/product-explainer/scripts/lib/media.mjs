// media.mjs: the physical media a film is made in. Each pass takes the film's world, drawn plainly into `ref`, and
// remakes the frame the way the medium is really made (references/craft.md, "Simulate the medium"). The product and
// the words go on afterwards, crisp, in the film's `over` layer, so a label is never painted or printed over.
//
//   painted(g, ref, t, o)     a background painter's pass: underpainting, then colour-sampled bristle strokes laid
//                             coarse to fine along the forms, broken colour, re-laid 10 times a second; canvas weave.
// Every pass also works on one layer (o.layer = true): only what was drawn into ref is remade, the rest stays clear.
// That is how one film mixes media in a frame (K.medium). A film can also switch media over time: look: t => ...
// A new medium is a new pass with the same shape, written by doing the medium's physical steps.
//
//   silkscreen(g, ref, t, o)  a screen print: each ink is its own plate, tones are halftone dots fixed to the paper,
//                             plates sit slightly off register, the ink lies unevenly, and the paper shows through.
import { createCanvas } from './canvas.mjs';
import { W, H, clamp, lerp, rng, hash2, noise, fbm, rgb } from './kit.mjs';

const TAU = Math.PI * 2;
const bell = (d, r) => { const x = clamp(1 - d / r); return x * x * (3 - 2 * x); };
const cached = new Map();
const once = (key, fn) => { if (!cached.has(key)) cached.set(key, fn()); return cached.get(key); };

// ---------------------------------------------------------------- shared material
// the canvas a painting is made on: a woven tooth, multiplied
const weaveTile = () => once('weave', () => {
  const s = 48, c = createCanvas(s, s), g = c.getContext('2d'), d = g.createImageData(s, s), r = rng(5);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const warp = 0.5 + 0.5 * Math.sin((x / s) * TAU * 8), weft = 0.5 + 0.5 * Math.sin((y / s) * TAU * 8), over = ((x >> 3) + (y >> 3)) % 2;
    const v = 255 * (1 - 0.13 * (over ? warp : weft) - 0.05 * r()), i = (y * s + x) * 4;
    d.data[i] = v; d.data[i + 1] = v * 0.99; d.data[i + 2] = v * 0.97; d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0); return c;
});
// paper: long fibres and a soft mottle, multiplied
const paperTex = (tone = 1) => once('paper' + tone, () => {
  const c = createCanvas(W, H), g = c.getContext('2d');
  const mw = W / 8, mh = H / 8, m = createCanvas(mw, mh), mg = m.getContext('2d'), md = mg.createImageData(mw, mh);
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const v = 255 * (1 - tone * 0.05 * fbm(x * 0.06, y * 0.06, 4, 3)), i = (y * mw + x) * 4; md.data[i] = v; md.data[i + 1] = v * 0.993; md.data[i + 2] = v * 0.98; md.data[i + 3] = 255; }
  mg.putImageData(md, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(m, 0, 0, W, H);
  const r = rng(77); g.lineCap = 'round';
  for (let i = 0; i < 2600; i++) {
    const x = r() * W, y = r() * H, a = r() * TAU, l = 6 + r() * 26;
    g.strokeStyle = `rgba(${r() < 0.5 ? '120,100,80' : '255,255,255'},${0.05 + r() * 0.07})`; g.lineWidth = 0.6 + r() * 0.9;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
});
// fine grain that moves on twos, so a held frame still breathes
const grain = (g, t, amount = 0.035) => {
  const tile = once('grain', () => { const s = 256, c = createCanvas(s, s), cg = c.getContext('2d'), d = cg.createImageData(s, s), r = rng(41); for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; d.data[i] = v; d.data[i + 1] = v; d.data[i + 2] = v; d.data[i + 3] = 255; } cg.putImageData(d, 0, 0); return c; });
  const k = Math.floor(t * 12);
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = amount * 4;
  g.translate(-((k * 97) % 256), -((k * 61) % 256)); g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, W + 256, H + 256); g.restore();
};

// ---------------------------------------------------------------- painted
// One stroke: three bristle lines with a slight belly.
const brush = (g, x, y, len, w, ang, col, a) => {
  const c = Math.cos(ang), s = Math.sin(ang), nx = -s, ny = c, h = len / 2;
  g.strokeStyle = col; g.lineCap = 'round';
  for (let b = -1; b <= 1; b++) {
    const o = b * w * 0.3, bend = w * 0.28, e = b ? 0.86 : 1;
    g.globalAlpha = a * (b ? 0.6 : 1); g.lineWidth = w * (b ? 0.32 : 0.5);
    g.beginPath(); g.moveTo(x - c * h * e + nx * o, y - s * h * e + ny * o);
    g.quadraticCurveTo(x + nx * (o + bend), y + ny * (o + bend), x + c * h * e + nx * o, y + s * h * e + ny * o); g.stroke();
  }
};
// o: { density (1), size (1), fps (10), focus: [{ x, y, r }] screen places that get finer strokes,
//      flow(x, y) the stroke angle where there is no edge (default: lying down, wandering), weave (0.4), grain (0.03) }
export function painted(g, ref, t, o = {}) {
  const d = ref.getContext('2d').getImageData(0, 0, W, H).data, boil = Math.floor(t * (o.fps ?? 10) + 1e-6);
  const at = (x, y) => (Math.min(H - 1, Math.max(0, Math.round(y))) * W + Math.min(W - 1, Math.max(0, Math.round(x)))) * 4;
  const lum = (x, y) => { const j = at(x, y); return 0.3 * d[j] + 0.59 * d[j + 1] + 0.11 * d[j + 2]; };
  const F = o.focus || [], focus = (x, y) => { let m = 0; for (const f of F) m = Math.max(m, bell(Math.hypot(x - f.x, y - f.y), f.r)); return m; };
  const flow = o.flow || ((x, y) => 0.08 * Math.sin(x * 0.004 + y * 0.011) + (noise(x * 0.003, y * 0.005, 21) - 0.5) * 0.5);
  const dens = o.density ?? 1, size = o.size ?? 1;
  // the underpainting: the reference, softened, so no canvas shows between strokes
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.filter = 'blur(2.5px)'; g.drawImage(ref, 0, 0); g.filter = 'none';
  const passes = [
    { n: 7000, len: [30, 52], w: [10, 15], g: 0, keep: 1 },
    { n: 13000, len: [15, 28], w: [5.5, 8.5], g: 5, keep: 0.25 },
    { n: 15000, len: [7, 14], w: [2.4, 4.2], g: 11, keep: 0.08 },
  ];
  passes.forEach((ps, pi) => {
    const R = rng(1009 * (pi + 1) + boil * 7919), n = Math.round(ps.n * dens);
    for (let i = 0; i < n; i++) {
      const x = R.range(-12, W + 12), y = R.range(-12, H + 12), r1 = R(), r2 = R(), r3 = R(), r4 = R(), r5 = R(), r6 = R();
      const gx = lum(x + 2.5, y) - lum(x - 2.5, y), gy = lum(x, y + 2.5) - lum(x, y - 2.5), gm = Math.hypot(gx, gy), f = focus(x, y);
      if (gm < ps.g && r1 > ps.keep + f * 0.5) continue;
      if (o.layer && d[at(x, y) + 3] < 200) continue;
      const sc = (1 - 0.5 * f) * size, edge = clamp(gm / 40), j = at(x, y);
      // strokes follow the forms: along an edge where there is one, with the flow where there isn't
      const ang = gm > 11 ? Math.atan2(gy, gx) + Math.PI / 2 + (r2 - 0.5) * 0.3 : flow(x, y) + (r2 - 0.5) * 0.35;
      const len = lerp(ps.len[0], ps.len[1], r3) * sc * (1 - 0.35 * edge), wd = lerp(ps.w[0], ps.w[1], r4) * sc;
      // broken colour: value and temperature wander a little; darks lean violet, lights lean warm
      const m = 1 + (r5 - 0.5) * 0.13, L0 = (d[j] + d[j + 1] + d[j + 2]) / 765, warm = (r6 - 0.5) * 0.12 + (L0 > 0.62 ? 0.03 : L0 < 0.18 ? -0.04 : 0);
      brush(g, x, y, len, wd, ang, `rgb(${Math.min(255, d[j] * m * (1 + warm)) | 0},${Math.min(255, d[j + 1] * m) | 0},${Math.min(255, d[j + 2] * m * (1 - warm)) | 0})`, 0.9);
    }
  });
  g.globalAlpha = 1;
  // the canvas it's painted on
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = o.weave ?? 0.4; g.fillStyle = g.createPattern(weaveTile(), 'repeat'); g.fillRect(0, 0, W, H);
  g.globalAlpha = 1;
  if (!o.layer) { g.restore(); grain(g, t, o.grain ?? 0.03); return; }
  // a layer keeps only the painted shapes: strokes that wandered past the edge are trimmed to a slightly ragged edge
  g.globalCompositeOperation = 'destination-in'; g.filter = 'blur(1.5px)'; g.drawImage(ref, 0, 0); g.restore();
}

// ---------------------------------------------------------------- silkscreen
// The halftone screen, fixed to the paper: a clustered dot at 45 degrees, one value per pixel, computed once.
const screenMap = cell => once('screen' + cell, () => {
  const m = new Float32Array(W * H), k = TAU / (cell * Math.SQRT2);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) m[y * W + x] = 0.5 + 0.25 * (Math.cos((x + y) * k) + Math.cos((x - y) * k));
  return m;
});
// o: { inks: ['#hex', ...] (required, 4 to 8, in printing order, lightest first), paper ('#F3ECDF'), screen (cell px, 7),
//      register (px, 1.6), grain (0.025) }
export function silkscreen(g, ref, t, o = {}) {
  if (!Array.isArray(o.inks) || o.inks.length < 2) throw new Error('silkscreen needs media.inks: 4 to 8 ink colours in printing order, lightest first (references/craft.md)');
  const inks = o.inks.map(rgb), paper = rgb(o.paper || '#F3ECDF'), N = inks.length, src = ref.getContext('2d').getImageData(0, 0, W, H).data;
  const scr = screenMap(o.screen ?? 7), reg = o.register ?? 1.6;
  // which ink each pixel takes: the nearest ink, with the next nearest laid in as halftone dots for the tone between them.
  // Paper counts as a colour too, so light areas print as bare paper (a knockout), not as ink.
  const pal = [paper, ...inks], P = pal.length, idx = new Int8Array(W * H);
  const dist = (r, gg, b, c) => { const dr = r - c[0], dg = gg - c[1], db = b - c[2]; return 2 * dr * dr + 4 * dg * dg + 3 * db * db; };
  for (let p = 0, j = 0; p < W * H; p++, j += 4) {
    if (o.layer && src[j + 3] < 128) { idx[p] = -1; continue; }
    const r = src[j], gg = src[j + 1], b = src[j + 2];
    let a = 0, da = 1e12, bI = 0, db = 1e12;
    for (let k = 0; k < P; k++) { const dk = dist(r, gg, b, pal[k]); if (dk < da) { db = da; bI = a; da = dk; a = k; } else if (dk < db) { db = dk; bI = k; } }
    const A = pal[a], B = pal[bI], ex = B[0] - A[0], ey = B[1] - A[1], ez = B[2] - A[2], L2 = 2 * ex * ex + 4 * ey * ey + 3 * ez * ez || 1;
    let mixK = clamp((2 * (r - A[0]) * ex + 4 * (gg - A[1]) * ey + 3 * (b - A[2]) * ez) / L2, 0, 0.5);
    const x = p % W, y = (p / W) | 0;
    mixK += (hash2(x >> 1, y >> 1, 9) - 0.5) * 0.06;                     // the squeegee's ragged edge
    idx[p] = scr[p] > 1 - mixK ? bI : a;
  }
  // print: paper first, then each ink as its own plate, shifted off register, its density uneven
  const out = g.createImageData(W, H), od = out.data;
  for (let p = 0, j = 0; p < W * H; p++, j += 4) { od[j] = paper[0]; od[j + 1] = paper[1]; od[j + 2] = paper[2]; od[j + 3] = idx[p] < 0 ? 0 : 255; }
  for (let k = 1; k < P; k++) {
    const ink = pal[k], ang = hash2(k, 3, 1) * TAU, dx = Math.round(Math.cos(ang) * reg), dy = Math.round(Math.sin(ang) * reg);
    for (let y = 0; y < H; y++) {
      const ty = y + dy; if (ty < 0 || ty >= H) continue;
      for (let x = 0; x < W; x++) {
        if (idx[y * W + x] !== k) continue;
        const tx = x + dx; if (tx < 0 || tx >= W) continue;
        const dens = 0.84 + 0.16 * noise(tx * 0.012, ty * 0.012, k * 7), q = (ty * W + tx) * 4;
        // ink multiplies onto what is already printed
        od[q] = od[q] * lerp(255, ink[0], dens) / 255; od[q + 1] = od[q + 1] * lerp(255, ink[1], dens) / 255; od[q + 2] = od[q + 2] * lerp(255, ink[2], dens) / 255;
      }
    }
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.putImageData(out, 0, 0);
  g.globalCompositeOperation = o.layer ? 'source-atop' : 'multiply';
  if (o.layer) { g.globalAlpha = 0.35; g.drawImage(paperTex(1.2), 0, 0); } else g.drawImage(paperTex(1.2), 0, 0);
  g.restore();
  if (!o.layer) grain(g, t, o.grain ?? 0.025);
}

export const MEDIA = { painted, silkscreen };
