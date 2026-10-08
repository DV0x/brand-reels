// kit.mjs: the drawing kit a film is written with.
// A film is a pure function of time. film.mjs exports `default function film(K)` and returns
// { draw(g, t), shots, cues, look, motion, music, captions }. Everything it needs is on K (see references/film-api.md).
// Units are screen pixels of the 1080 x 1920 frame.
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage, Path2D, DOMMatrix, DOMPoint } from './canvas.mjs';

export const W = 1080, H = 1920;
// The picture always fills the whole 1080 x 1920 frame. Only words (and the product's label) keep to the safe box: the
// part of the frame the app's own overlay never covers. Two placements, set by script.json "placement":
//   organic (the default, a post): the app covers about the top 260 px (header) and the bottom 340 px (caption,
//     username, audio); the like, comment and share buttons stand on the right from about y 1100 down.
//   ad: Meta's ad safe zone, no text in the top 14% or the bottom 35% (the call-to-action button and the ad's text).
// One box covers Reels, Shorts and TikTok. Below clearBelow the right edge is clearX (the buttons).
export const PLACEMENTS = {
  organic: { safe: { x0: 120, x1: 888, y0: 260, y1: 1580, clearX: 780, clearBelow: 1100 }, lane: { x: 120, y1: 1560, maxW: 660 } },
  ad: { safe: { x0: 120, x1: 888, y0: 288, y1: 1248, clearX: 780, clearBelow: 840 }, lane: { x: 120, y1: 1236, maxW: 660 } },
};
export const SAFE = { ...PLACEMENTS.organic.safe };
export const LANE = { ...PLACEMENTS.organic.lane };   // the caption lane, bottom-aligned at y1

// ---------------------------------------------------------------- maths
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let lo = 0, hi = 1, s = x;
    for (let i = 0; i < 22; i++) { const v = X(s); if (Math.abs(v - x) < 1e-5) break; if (v < x) lo = s; else hi = s; s = (lo + hi) / 2; }
    return Y(s);
  };
}
export const ease = {
  linear: x => clamp(x),
  in: x => clamp(x) ** 3,
  out: x => 1 - (1 - clamp(x)) ** 3,
  inOut: x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2; },
  outExpo: x => (x >= 1 ? 1 : 1 - 2 ** (-10 * clamp(x))),
  outBack: x => { x = clamp(x); const s = 1.9; return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2; },
  warm: bezier(0.05, 0.7, 0.1, 1),     // enters fast, lands soft
  crisp: bezier(0.2, 0.9, 0.1, 1),
  soft: bezier(0.4, 0, 0.2, 1),
};
// Motion settings per brand voice: how fast things move, how far past the mark they settle, how far apart related things arrive.
export const MOTION = {
  warm: { name: 'warm', ease: ease.warm, dur: 0.45, over: 0.035, stagger: 0.09 },
  playful: { name: 'playful', ease: ease.outBack, dur: 0.38, over: 0.1, stagger: 0.065 },
  crisp: { name: 'crisp', ease: ease.crisp, dur: 0.32, over: 0, stagger: 0.05 },
};

// ---------------------------------------------------------------- randomness and noise
const rng = seed => {
  let a = (seed >>> 0) || 1;
  const f = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.range = (lo, hi) => lo + (hi - lo) * f();
  f.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * f());
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  return f;
};
const hash2 = (x, y, s = 0) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const noise = (x, y, s = 0) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
export { clamp, lerp, rng, hash2, noise };
export const fbm = (x, y, oct = 4, s = 0) => { let sum = 0, amp = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2.03; } return sum / n; };

// ---------------------------------------------------------------- colour
export const rgb = hex => { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]); };
const rgba = (c, a) => { const [r, g, b] = rgb(c); return `rgba(${r},${g},${b},${clamp(a).toFixed(3)})`; };
const shade = (c, k) => (k >= 0 ? mix(c, '#ffffff', k) : mix(c, '#000000', -k));   // k in -1..1
const jitter = (c, r, amt = 0.06) => { const [R, G, B] = rgb(c), k = 1 + (r() - 0.5) * 2 * amt, w = (r() - 0.5) * amt; return hex([R * k * (1 + w), G * k, B * k * (1 - w)]); };

// ---------------------------------------------------------------- paths
const spline = (pts, closed = false, tension = 0.5, target = new Path2D()) => {
  const n = pts.length; if (n < 2) return target;
  const P = i => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  target.moveTo(pts[0][0], pts[0][1]);
  const segs = closed ? n : n - 1, k = tension / 3;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    target.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  if (closed) target.closePath();
  return target;
};
const poly = (pts, closed = true, target = new Path2D()) => { target.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) target.lineTo(pts[i][0], pts[i][1]); if (closed) target.closePath(); return target; };
const circle = (x, y, r, target = new Path2D()) => { target.moveTo(x + r, y); target.arc(x, y, r, 0, TAU); target.closePath(); return target; };
const ellipse = (x, y, rx, ry, rot = 0, target = new Path2D()) => { target.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); target.ellipse(x, y, rx, ry, rot, 0, TAU); target.closePath(); return target; };
const roundRect = (x, y, w, h, r, target = new Path2D()) => {
  r = Math.min(r, w / 2, h / 2);
  target.moveTo(x + r, y); target.lineTo(x + w - r, y); target.arcTo(x + w, y, x + w, y + r, r); target.lineTo(x + w, y + h - r); target.arcTo(x + w, y + h, x + w - r, y + h, r);
  target.lineTo(x + r, y + h); target.arcTo(x, y + h, x, y + h - r, r); target.lineTo(x, y + r); target.arcTo(x, y, x + r, y, r); target.closePath();
  return target;
};
// a filled ribbon along a polyline; widths[i] is the half-width at pts[i]
const ribbon = (pts, widths) => {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    L.push([pts[i][0] + nx * widths[i], pts[i][1] + ny * widths[i]]); R.push([pts[i][0] - nx * widths[i], pts[i][1] - ny * widths[i]]);
  }
  return spline(L.concat(R.reverse()), true, 0.5);
};
// points along a Catmull-Rom curve through pts
const sampleSpline = (pts, per = 10) => {
  if (pts.length < 3) { const out = []; for (let i = 0; i <= per; i++) out.push([lerp(pts[0][0], pts[1][0], i / per), lerp(pts[0][1], pts[1][1], i / per)]); return out; }
  const out = [], n = pts.length, P = i => pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let s = 0; s < per; s++) {
      const u = s / per, u2 = u * u, u3 = u2 * u;
      out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]);
    }
  }
  out.push(pts[n - 1]);
  return out;
};

// ---------------------------------------------------------------- words: *markup*, alignment to the voice
export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9₹%]+/g, '');
// "*café coffee* tastes" -> [{w:'café', emph:true}, {w:'coffee', emph:true}, {w:'tastes', emph:false}]
export function parseMarkup(text) {
  const out = []; let on = false;
  for (let raw of String(text).trim().split(/\s+/)) {
    let e = on, close = false;
    if (raw.startsWith('*')) { raw = raw.slice(1); e = true; on = true; }
    const m = raw.match(/^(.*?)\*([^\p{L}\p{N}]*)$/u);
    if (m) { raw = m[1] + m[2]; close = true; }
    if (raw) out.push({ w: raw, emph: e });
    if (close) on = false;
  }
  return out;
}
export const plain = text => parseMarkup(text).map(t => t.w).join(' ');
// give every token a time from the voice's word timestamps; tokens the voice said differently are placed by position
export function align(tokens, words, a, b) {
  const n = tokens.length, out = new Array(n).fill(null); let j = 0;
  for (let i = 0; i < n; i++) {
    const k = norm(tokens[i].w); if (!k) continue;
    for (let q = j; q < Math.min(words.length, j + 4); q++) if (norm(words[q].w) === k) { out[i] = { a: words[q].start, b: words[q].end }; j = q + 1; break; }
  }
  const total = tokens.reduce((s, t) => s + t.w.length + 1, 0) || 1; let acc = 0;
  const pos = tokens.map(t => { const p = acc / total; acc += t.w.length + 1; return p; });
  for (let i = 0; i < n; i++) if (!out[i]) {
    let L = i - 1; while (L >= 0 && !out[L]) L--;
    let R = i + 1; while (R < n && !out[R]) R++;
    const ta = L >= 0 ? out[L].b : a, pa = L >= 0 ? pos[L + 1] : 0, tb = R < n ? out[R].a : b, pb = R < n ? pos[R] : 1;
    const f0 = pb > pa ? (pos[i] - pa) / (pb - pa) : 0, f1 = pb > pa ? (pos[i] + (tokens[i].w.length + 1) / total - pa) / (pb - pa) : 1;
    out[i] = { a: lerp(ta, tb, clamp(f0)), b: Math.max(lerp(ta, tb, clamp(f0)) + 0.05, lerp(ta, tb, clamp(f1))) };
  }
  return out;
}

// font string: { family, size, weight, italic }
const fontStr = (f, size) => `${f.italic ? 'italic ' : ''}${f.weight || 400} ${Math.round(size || f.size || 48)}px "${f.family}"`;

// lay tokens out in lines no wider than maxW; returns { lines: [{ items: [{tok, x, w, font}], w }], lineH }
function layoutTokens(g, tokens, base, emph, size, maxW) {
  const fb = fontStr(base, size), fe = emph ? fontStr(emph, size * (emph.scale || 1)) : fb;
  g.font = fb; const space = g.measureText(' ').width;
  const lines = []; let cur = { items: [], w: 0 };
  for (const tok of tokens) {
    const f = tok.emph ? fe : fb; g.font = f; const w = g.measureText(tok.w).width;
    const add = (cur.items.length ? space : 0) + w;
    if (cur.items.length && cur.w + add > maxW) { lines.push(cur); cur = { items: [], w: 0 }; }
    cur.items.push({ tok, x: cur.w + (cur.items.length ? space : 0), w, font: f });
    cur.w += (cur.items.length > 1 ? space : 0) + w;
  }
  if (cur.items.length) lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- the product card
// The real product photo, cut out and pasted in as a scissor-cut paper card with a printed drop shadow and tape.
// The photo is never redrawn and nothing is painted over its label.
function prepProduct(img, name) {
  const w = img.width, h = img.height, c = createCanvas(w, h), g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, w, h).data, L = new Int32Array(h).fill(-1), R = new Int32Array(h).fill(-1);
  let y0 = h, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 90) { if (L[y] < 0) L[y] = x; R[y] = x; }
    if (L[y] >= 0) { if (y < y0) y0 = y; y1 = y; }
  }
  if (y1 < 0) { y0 = 0; y1 = h - 1; L.fill(0); R.fill(w - 1); }
  const r = rng(w * 131 + h * 7), border = Math.max(6, 0.04 * Math.min(w, h)), j = () => r.range(-0.3, 0.3) * border, N = 34, win = Math.ceil((y1 - y0) / N);
  const ext = (yc, side) => { let v = side < 0 ? w : -1; for (let y = Math.max(y0, yc - win); y <= Math.min(y1, yc + win); y++) if (L[y] >= 0) v = side < 0 ? Math.min(v, L[y]) : Math.max(v, R[y]); return v; };
  const pts = [], top = y0 - border, bot = y1 + border;
  const tl = ext(y0, -1), tr = ext(y0, 1), bl = ext(y1, -1), br = ext(y1, 1);
  for (let i = 0; i <= 8; i++) pts.push([lerp(tl - border * 0.6, tr + border * 0.6, i / 8) + j() * 0.4, top + j()]);
  for (let i = 1; i < N; i++) { const yc = Math.round(lerp(y0, y1, i / N)); pts.push([ext(yc, 1) + border + j(), yc + j() * 0.3]); }
  for (let i = 0; i <= 8; i++) pts.push([lerp(br + border * 0.6, bl - border * 0.6, i / 8) + j() * 0.4, bot + j()]);
  for (let i = N - 1; i >= 1; i--) { const yc = Math.round(lerp(y0, y1, i / N)); pts.push([ext(yc, -1) - border + j(), yc + j() * 0.3]); }
  const snip = pts.map(([x, y]) => [x / w, y / h]);
  const tape = []; const n = 7;
  for (let i = 0; i <= n; i++) tape.push([-0.5 + r.range(-0.03, 0.03), -0.5 + i / n]);
  for (let i = n; i >= 0; i--) tape.push([0.5 + r.range(-0.03, 0.03), -0.5 + i / n]);
  return { name, img: c, w, h, aspect: h / w, srcH: y1 - y0 + 1, snip, tape };
}
// a stand-in bottle so a film can be built before the real photo is in
function placeholderProduct() {
  const w = 520, h = 1200, c = createCanvas(w, h), g = c.getContext('2d');
  g.fillStyle = '#2E2A26'; g.fill(roundRect(150, 20, 220, 150, 26));
  g.fillStyle = '#C9772E'; g.fill(spline([[160, 190], [360, 190], [440, 330], [450, 1100], [420, 1170], [100, 1170], [70, 1100], [80, 330]], true, 0.3));
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fill(roundRect(110, 360, 40, 700, 20));
  g.fillStyle = '#F4EDE0'; g.fill(roundRect(96, 520, 328, 420, 14));
  g.fillStyle = '#2E2A26'; g.textAlign = 'center'; g.font = '700 54px "Jost"'; g.fillText('YOUR', 260, 690); g.fillText('PRODUCT', 260, 760);
  g.font = '500 30px "Jost"'; g.fillText('placeholder photo', 260, 830);
  return prepProduct(c, 'placeholder');
}

// ---------------------------------------------------------------- the kit
export async function makeKit({ project, script, timing }) {
  const placement = PLACEMENTS[script.placement || 'organic'];
  if (!placement) throw new Error(`script.json "placement": "${script.placement}" is not one of: ${Object.keys(PLACEMENTS).join(', ')}`);
  Object.assign(SAFE, placement.safe); Object.assign(LANE, placement.lane);
  const products = {}, images = {};
  const pdir = path.join(project, 'product');
  if (fs.existsSync(pdir)) for (const f of fs.readdirSync(pdir)) if (/\.png$/i.test(f)) products[f.replace(/\.png$/i, '')] = prepProduct(await loadImage(path.join(pdir, f)), f);
  const idir = path.join(project, 'images');
  if (fs.existsSync(idir)) for (const f of fs.readdirSync(idir)) if (/\.(png|jpe?g|webp)$/i.test(f)) images[f.replace(/\.[^.]+$/, '')] = await loadImage(path.join(idir, f));

  const qa = { text: [], upscale: [], notes: [] };
  const events = new Set();   // every animation start the film asks for; the renderer checks the gaps between them
  const ev = at => { if (Number.isFinite(at) && at >= 0 && at <= timing.duration) events.add(Math.round(at * 100) / 100); return at; };
  const flag = (list, key, item) => { if (!list.some(x => x.key === key)) list.push({ key, ...item }); };
  let M = MOTION.warm;
  // Every text that reaches the screen, for the checks (render.mjs check): its role sets the minimum size, and the
  // first and last time it was seen give its reading time. Roles: headline, caption, label, note, stamp, texture.
  const texts = new Map();
  const noteText = (id, o) => {
    if (!id || !o || !Number.isFinite(o.t)) return;
    let it = texts.get(id);
    if (!it) { it = { id, text: String(o.text ?? id).slice(0, 80), role: o.role || 'label', size: o.size || 0, first: o.t, last: o.t, boxes: [], spoken: o.spoken ?? null }; texts.set(id, it); }
    it.first = Math.min(it.first, o.t); it.last = Math.max(it.last, o.t); it.size = Math.max(it.size || 0, o.size || 0);   // settled size: texts pop in from 0
    if (o.box && (!it.boxes.length || Math.abs(it.boxes[it.boxes.length - 1].t - o.t) > 0.24)) it.boxes.push({ t: +o.t.toFixed(2), box: o.box.map(Math.round) });
    // the safe box, for every text with a meaning that is fully on screen (a camera move may carry words off the frame)
    if (o.box && !o.checked && it.role !== 'texture' && it.role !== 'caption') {
      const [x0, y0, x1, y1] = o.box;
      if (x0 >= 0 && y0 >= 0 && x1 <= W && y1 <= H) checkBox(x0, y0, x1, y1, o.t, `${it.role} "${it.text.slice(0, 28)}"`);
    }
  };

  // ---------- time: line and word lookups from the voice
  const byId = new Map(timing.lines.map(l => [l.id, l]));
  const scriptById = new Map(script.lines.map(l => [l.id, l]));
  const last = timing.lines[timing.lines.length - 1];
  const T = {
    dur: timing.duration,
    lines: timing.lines,
    endCard: last ? last.end + 0.25 : 0,
    line(id) { const l = byId.get(id); if (!l) throw new Error(`no line "${id}" in vo/timing.json (lines: ${[...byId.keys()].join(', ')})`); return l; },
    at(id, off = 0) { return T.line(id).start + off; },
    end(id, off = 0) { return T.line(id).end + off; },
    word(id, w, n = 1, which = 'start') {
      const l = T.line(id), key = norm(w); let k = 0;
      for (const x of l.words || []) if (norm(x.w) === key && ++k === n) return which === 'end' ? x.end : x.start;
      const toks = parseMarkup(scriptById.get(id)?.text || l.text), times = align(toks, l.words || [], l.start, l.end); k = 0;
      for (let i = 0; i < toks.length; i++) if (norm(toks[i].w) === key && ++k === n) return which === 'end' ? times[i].b : times[i].a;
      throw new Error(`word "${w}" not found in line ${id}: "${l.text}"`);
    },
    wordEnd(id, w, n = 1) { return T.word(id, w, n, 'end'); },
  };

  // ---------- motion helpers (all pure functions of t)
  const p = (t, at, dur = M.dur, e = M.ease) => (ev(at), (typeof e === 'string' ? ease[e] : e)(clamp((t - at) / dur)));
  // 0 -> a little past 1 -> 1: things land and settle
  const settle = (t, at, dur = M.dur, over = M.over) => {
    ev(at); const x = (t - at) / dur; if (x <= 0) return 0; if (x >= 1) return 1;
    if (x < 0.72) return (1 + over) * M.ease(x / 0.72);
    return 1 + over * (1 - ss((x - 0.72) / 0.28));
  };
  const move = (t, at, from, to, dur = M.dur) => { const k = settle(t, at, dur); return Array.isArray(from) ? from.map((v, i) => lerp(v, to[i], k)) : lerp(from, to, k); };
  const wobble = (t, at, amp = 0.05, freq = 9, decay = 5) => (t < at ? 0 : amp * Math.sin((t - at) * freq) * Math.exp(-(t - at) * decay));
  const twos = (t, fps = 12) => Math.floor(t * fps) / fps;
  const wave = (t, period = 3, amp = 1, phase = 0) => amp * Math.sin((t / period) * TAU + phase);
  const fade = (t, a, b, fin = 0.25, fout = 0.25) => Math.min(ss(seg(t, a, a + fin)), 1 - ss(seg(t, b - fout, b)));

  // ---------- camera: keys [{ t, x, y, z, r, e }] (x, y = the world point at the frame centre; z = zoom; r = roll)
  const camera = (keys, { shakes = [] } = {}) => {
    const K2 = keys.map(k => ({ x: W / 2, y: H / 2, z: 1, r: 0, ...k })).sort((a, b) => a.t - b.t);
    return {
      keys: K2,
      at(t) {
        let c;
        if (t <= K2[0].t) c = { ...K2[0] };
        else if (t >= K2[K2.length - 1].t) c = { ...K2[K2.length - 1] };
        else {
          let i = 0; while (K2[i + 1].t < t) i++;
          const a = K2[i], b = K2[i + 1], e = typeof b.e === 'function' ? b.e : ease[b.e || 'inOut'], k = e((t - a.t) / (b.t - a.t));
          c = { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k), r: lerp(a.r, b.r, k) };
        }
        for (const s of shakes) if (t >= s.at && t < s.at + (s.dur || 0.3)) {
          const f = 1 - (t - s.at) / (s.dur || 0.3), a = (s.amp || 8) * f;
          c.x += (noise(t * 40, 1, 7) - 0.5) * 2 * a; c.y += (noise(t * 40, 5, 7) - 0.5) * 2 * a; c.r += (noise(t * 30, 9, 7) - 0.5) * 0.01 * f;
        }
        return c;
      },
    };
  };
  // draw fn() through the camera; depth < 1 is further away (moves less), > 1 is a foreground (moves more)
  const view = (g, cam, t, depth, fn) => {
    const c = cam.at(t), z = 1 + (c.z - 1) * depth;
    g.save(); g.translate(W / 2, H / 2); g.rotate(c.r); g.scale(z, z);
    g.translate(-(W / 2 + (c.x - W / 2) * depth), -(H / 2 + (c.y - H / 2) * depth));
    fn(); g.restore();
  };
  // where a world point lands on screen for a camera at time t (for placing labels in screen space)
  const toScreen = (cam, t, [x, y], depth = 1) => {
    const c = cam.at(t), z = 1 + (c.z - 1) * depth, X = (x - (W / 2 + (c.x - W / 2) * depth)) * z, Y = (y - (H / 2 + (c.y - H / 2) * depth)) * z;
    return [W / 2 + X * Math.cos(c.r) - Y * Math.sin(c.r), H / 2 + X * Math.sin(c.r) + Y * Math.cos(c.r)];
  };

  // ---------- caches: draw a static piece once
  const caches = new Map();
  const cache = (key, w, h, fn) => { let c = caches.get(key); if (!c) { c = createCanvas(Math.ceil(w), Math.ceil(h)); fn(c.getContext('2d'), c); caches.set(key, c); } return c; };

  // ---------- hand-made: boil a point list on twos
  const boil = (pts, t, amp = 1.6, seed = 1, fps = 12) => { const b = Math.floor(t * fps); return pts.map(([x, y], i) => [x + (hash2(b, i, seed) - 0.5) * 2 * amp, y + (hash2(b, i + 999, seed) - 0.5) * 2 * amp]); };
  const shape = (g, pts, color, { t = 0, boil: amp = 0, seed = 1, smooth = false, stroke = null, width = 3 } = {}) => {
    const P = amp ? boil(pts, t, amp, seed) : pts, path2 = smooth ? spline(P, true, 0.5) : poly(P);
    if (color) { g.fillStyle = color; g.fill(path2); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.lineJoin = 'round'; g.stroke(path2); }
    return path2;
  };
  // a soft contact shadow where something meets a surface
  const contact = (g, x, y, rx, ry, alpha = 0.32, color = '#2a1d12') => {
    g.save(); g.translate(x, y); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rgba(color, alpha)); gr.addColorStop(0.6, rgba(color, alpha * 0.45)); gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore();
  };

  // ---------- lines that draw themselves
  const lengthOf = pts => { const acc = [0]; for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return acc; };
  const partial = (pts, prog) => {
    const acc = lengthOf(pts), L = acc[acc.length - 1] * clamp(prog), out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (acc[i] <= L) out.push(pts[i]);
      else { const f = (L - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1); out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); break; }
    }
    return out;
  };
  const drawOn = (g, pts, prog, { width = 6, color = '#1d1a16', cap = 'round', smooth = true, alpha = 1, dash = null } = {}) => {
    if (prog <= 0) return;
    const P = partial(smooth && pts.length > 2 ? sampleSpline(pts, 12) : pts, prog);
    if (P.length < 2) return;
    g.save(); g.globalAlpha *= alpha; g.strokeStyle = color; g.lineWidth = width; g.lineCap = cap; g.lineJoin = 'round'; if (dash) g.setLineDash(dash);
    g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.stroke(); g.restore();
  };
  const arrow = (g, from, to, prog, { bend = 0.18, width = 7, color = '#1d1a16', head = 26, t = 0, bob = 5 } = {}) => {
    if (prog <= 0) return;
    const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const off = prog >= 1 ? Math.sin(t * 6) * bob : 0, F = [from[0] + ux * off, from[1] + uy * off], Tt = [to[0] + ux * off, to[1] + uy * off];
    const mid = [(F[0] + Tt[0]) / 2 - uy * len * bend, (F[1] + Tt[1]) / 2 + ux * len * bend], pts = [];
    for (let i = 0; i <= 28; i++) { const u = i / 28; pts.push([(1 - u) ** 2 * F[0] + 2 * (1 - u) * u * mid[0] + u * u * Tt[0], (1 - u) ** 2 * F[1] + 2 * (1 - u) * u * mid[1] + u * u * Tt[1]]); }
    drawOn(g, pts, prog, { width, color, smooth: false });
    const hk = seg(prog, 0.82, 1); if (hk <= 0) return;
    const P = partial(pts, prog), a = P[P.length - 1], b = P[Math.max(0, P.length - 3)], ang = Math.atan2(a[1] - b[1], a[0] - b[0]), hs = head * ease.outBack(hk);
    g.save(); g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
    g.moveTo(a[0] + Math.cos(ang + 2.55) * hs, a[1] + Math.sin(ang + 2.55) * hs); g.lineTo(a[0], a[1]); g.lineTo(a[0] + Math.cos(ang - 2.55) * hs, a[1] + Math.sin(ang - 2.55) * hs); g.stroke(); g.restore();
  };
  // a hand-drawn ring around something
  const mark = (g, cx, cy, rx, ry, prog, { color = '#C8322B', width = 8, seed = 3, turns = 1.12, tilt = -0.08, alpha = 0.92 } = {}) => {
    if (prog <= 0) return;
    const r = rng(seed), ph = r.range(0, TAU), pts = [], n = 64;
    for (let i = 0; i <= n; i++) {
      const u = i / n, a = ph + u * turns * TAU, k = lerp(0.95, 1.07, u) * (1 + 0.035 * Math.sin(a * 2 + seed));
      const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
      pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
    }
    g.save(); g.globalCompositeOperation = 'multiply'; drawOn(g, pts, prog, { width, color, smooth: false, alpha }); g.restore();
  };
  const strike = (g, x0, y0, x1, y1, prog, { color = '#C8322B', width = 9, seed = 5 } = {}) => {
    const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([lerp(x0, x1, u), lerp(y0, y1, u) + Math.sin(u * 7 + seed) * 2.5]); }
    g.save(); g.globalCompositeOperation = 'multiply'; drawOn(g, pts, prog, { width, color, smooth: false, alpha: 0.9 }); g.restore();
  };
  const tick = (g, x, y, size, prog, { color = '#2F7D4F', width = 10 } = {}) => drawOn(g, [[x - size * 0.5, y], [x - size * 0.12, y + size * 0.38], [x + size * 0.55, y - size * 0.45]], prog, { width, color, smooth: false });

  // ---------- type
  const F = { base: { family: 'Jost', weight: 600 }, emph: { family: 'Cormorant Garamond', weight: 600, italic: true, scale: 1.14 } };
  const checkBox = (x0, y0, x1, y1, t, what) => {
    const out = x0 < SAFE.x0 - 2 || x1 > SAFE.x1 + 2 || y0 < SAFE.y0 - 2 || y1 > SAFE.y1 + 2 || (y1 > SAFE.clearBelow && x1 > SAFE.clearX + 2);
    if (out) flag(qa.text, what, { t: +t.toFixed(2), box: [x0, y0, x1, y1].map(Math.round), what });
  };
  // static text with *emphasis*, wrapping at maxW. align: left | center | right. Returns its box.
  const text = (g, str, x, y, o = {}) => {
    const base = { family: o.font || F.base.family, weight: o.weight || F.base.weight, italic: o.italic }, size = o.size || 56;
    const emph = { ...F.emph, ...(o.emph || {}) }, lines = layoutTokens(g, parseMarkup(str), base, emph, size, o.maxW || 9999), lh = size * (o.lineH || 1.15);
    g.save(); g.globalAlpha *= o.alpha ?? 1; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    let bx0 = 1e9, bx1 = -1e9;
    lines.forEach((ln, i) => {
      const lx = o.align === 'center' ? x - ln.w / 2 : o.align === 'right' ? x - ln.w : x;
      bx0 = Math.min(bx0, lx); bx1 = Math.max(bx1, lx + ln.w);
      for (const it of ln.items) { g.font = it.font; g.fillStyle = it.tok.emph && emph.color ? emph.color : o.color || '#1d1a16'; g.fillText(it.tok.w, lx + it.x, y + i * lh); }
    });
    g.restore();
    const box = { x0: bx0, y0: y - size * 0.8, x1: bx1, y1: y + (lines.length - 1) * lh + size * 0.25 };
    if (o.check !== false && o.t != null) {
      checkBox(box.x0, box.y0, box.x1, box.y1, o.t, `text "${str.slice(0, 28)}"`);
      noteText(o.id || 'text:' + str.slice(0, 40), { checked: true, text: plain(str), role: o.role || (size >= 72 ? 'headline' : 'label'), size, box: [box.x0, box.y0, box.x1, box.y1], t: o.t });
    }
    return box;
  };
  // a statement: big type that appears word by word as the voice says it. The line's caption steps aside
  // (mark the line "show": "statement" in script.json).
  const statement = (g, t, id, o = {}) => {
    const tl = T.line(id), sl = scriptById.get(id) || {}, toks = parseMarkup(o.text || sl.caption || sl.text || tl.text);
    const times = o.text && norm(o.text) !== norm(plain(sl.text || '')) ? toks.map((_, i) => ({ a: tl.start + (i / toks.length) * (tl.end - tl.start) * 0.85, b: tl.end })) : align(toks, tl.words || [], tl.start, tl.end);
    const size = o.size || 104, base = { family: o.font || 'Fraunces', weight: o.weight || 700, italic: o.italic }, emph = { family: base.family, weight: base.weight, italic: true, ...(o.emph || {}) };
    const maxW = o.maxW || (SAFE.x1 - SAFE.x0), lines = layoutTokens(g, toks, base, emph, size, maxW), lh = size * (o.lineH || 1.06);
    const x = o.x ?? SAFE.x0, y = o.y ?? 520, all = o.all ? tl.start : null, until = o.until ?? 1e9, lead = o.lead ?? 0.06;
    const out = 1 - ss(seg(t, until - 0.2, until)); if (out <= 0) return;
    g.save(); g.textBaseline = 'alphabetic'; let i = 0, bx0 = 1e9, bx1 = -1e9;
    lines.forEach((ln, li) => {
      const lx = o.align === 'center' ? x - ln.w / 2 : o.align === 'right' ? x - ln.w : x;
      bx0 = Math.min(bx0, lx); bx1 = Math.max(bx1, lx + ln.w);
      for (const it of ln.items) {
        const a = ev(all != null ? all + i * M.stagger : times[i].a - lead); i++;
        if (t < a) continue;
        const k = settle(t, a, M.dur * 0.9), al = clamp((t - a) / 0.1) * out, dy = (1 - Math.min(1, k)) * size * 0.32;
        g.globalAlpha = al; g.font = it.font; g.fillStyle = it.tok.emph && emph.color ? emph.color : o.color || '#1d1a16';
        if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = size * 0.18; g.shadowOffsetY = size * 0.03; }
        g.fillText(it.tok.w, lx + it.x, y + li * lh + dy);
      }
    });
    g.restore();
    checkBox(bx0, y - size * 0.8, bx1, y + (lines.length - 1) * lh + size * 0.25, t, `statement ${id}`);
    if (i && t >= (all != null ? all : times[0].a - lead)) noteText('statement:' + id, { checked: true, text: toks.map(k => k.w).join(' '), role: 'headline', size, box: [bx0, y - size * 0.8, bx1, y + (lines.length - 1) * lh + size * 0.25], t, spoken: tl.end - tl.start });
  };
  // a stamp that lands at `at`
  const stamps = new Map();
  const stamp = (g, str, x, y, t, at, o = {}) => {
    ev(at); if (t < at || t > (o.until ?? 1e9)) return;
    const size = o.size || 64, color = o.color || '#C8322B', font = { family: o.font || 'Jost', weight: o.weight || 700 }, key = [str, size, color, font.family, o.border !== false].join('|');
    let c = stamps.get(key);
    if (!c) {
      const m = createCanvas(10, 10).getContext('2d'); m.font = fontStr(font, size); const tw = m.measureText(str).width, pad = size * 0.38, bw = tw + pad * 2, bh = size * 1.45;
      c = createCanvas(Math.ceil(bw + 20), Math.ceil(bh + 20)); const sg = c.getContext('2d'); sg.translate(10, 10);
      sg.fillStyle = color; sg.font = fontStr(font, size); sg.textBaseline = 'middle'; sg.fillText(str, pad, bh / 2 + size * 0.04);
      if (o.border !== false) { sg.strokeStyle = color; sg.lineWidth = size * 0.07; sg.stroke(roundRect(size * 0.05, size * 0.05, bw - size * 0.1, bh - size * 0.1, size * 0.14)); }
      const id = sg.getImageData(0, 0, c.width, c.height), r = rng(str.length * 97 + size);
      for (let i = 3; i < id.data.length; i += 4) { const px = (i >> 2) % c.width, py = ((i >> 2) / c.width) | 0; const n2 = noise(px * 0.18, py * 0.18, 11) * 0.7 + r() * 0.3; if (n2 > 0.74) id.data[i] *= 0.15; else if (n2 > 0.66) id.data[i] *= 0.6; }
      sg.putImageData(id, 0, 0); stamps.set(key, c);
    }
    const k = clamp((t - at) / 0.13), sc = lerp(o.from ?? 1.65, 1, ease.out(k)), al = clamp((t - at) / 0.05) * (o.alpha ?? 0.92) * (1 - ss(seg(t, (o.until ?? 1e9) - 0.2, o.until ?? 1e9)));
    g.save(); g.globalAlpha *= al; g.globalCompositeOperation = o.blend || 'multiply'; g.translate(x, y); g.rotate(o.rot ?? -0.07); g.scale(sc, sc);
    g.drawImage(c, -c.width / 2, -c.height / 2); g.restore();
    noteText('stamp:' + str, { text: str, role: 'stamp', size, box: [x - c.width / 2, y - c.height / 2, x + c.width / 2, y + c.height / 2], t });
  };
  // a label that pops in at (x, y) with a line drawn to the thing it names
  const label = (g, str, o) => {
    const t = o.t ?? 0, at = ev(o.at ?? 0), until = o.until ?? 1e9; if (t < at || t > until) return;
    const size = o.size || 40, font = { family: o.font || F.base.family, weight: o.weight || 600 }, pad = o.pad ?? size * 0.45;
    g.save(); g.font = fontStr(font, size); const tw = g.measureText(str).width, bw = tw + pad * 2, bh = size * 1.55;
    const k = settle(t, at, M.dur) * (1 - ss(seg(t, until - 0.18, until))), cx = o.x, cy = o.y;
    g.globalAlpha *= 1 - ss(seg(t, until - 0.18, until));
    if (o.to) {
      const ang = Math.atan2(o.to[1] - cy, o.to[0] - cx), ex = cx + Math.cos(ang) * Math.min(bw / 2, Math.abs((bh / 2) / (Math.sin(ang) || 1e-6))), ey = cy + Math.sin(ang) * Math.min(bh / 2, Math.abs((bw / 2) / (Math.cos(ang) || 1e-6)));
      const lp = p(t, at + 0.1, 0.32, 'out');
      drawOn(g, [[ex, ey], [lerp(ex, o.to[0], 0.5) + (o.bend ?? 0) * 40, lerp(ey, o.to[1], 0.5)], o.to], lp, { width: o.lineW || 4, color: o.lineColor || o.color || '#1d1a16' });
      if (lp >= 1) { g.fillStyle = o.lineColor || o.color || '#1d1a16'; g.fill(circle(o.to[0], o.to[1], (o.lineW || 4) * 1.6 * ease.outBack(p(t, at + 0.42, 0.18, 'linear')))); }
    }
    g.translate(cx, cy); g.scale(k, k); g.rotate(o.rot ?? 0);
    if (o.bg !== null) { g.fillStyle = o.bg || '#FFF8EC'; if (o.shadow !== false) { g.shadowColor = 'rgba(40,25,10,0.25)'; g.shadowBlur = 14; g.shadowOffsetY = 4; } g.fill(roundRect(-bw / 2, -bh / 2, bw, bh, o.radius ?? bh / 2)); g.shadowColor = 'transparent'; }
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = 3; g.stroke(roundRect(-bw / 2, -bh / 2, bw, bh, o.radius ?? bh / 2)); }
    g.fillStyle = o.color || '#1d1a16'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(str, 0, size * 0.05);
    g.restore();
    if (o.check !== false) { checkBox(cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2, t, `label "${str}"`); noteText('label:' + str, { checked: true, text: str, role: o.role || 'label', size, box: [cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2], t }); }
  };
  const counter = (t, at, dur, from, to, { decimals = 0, e = 'out' } = {}) => lerp(from, to, p(t, at, dur, e)).toFixed(decimals);

  // ---------- life: steam, smell, scent
  const wisps = (g, x, y, t, o = {}) => {
    const n = o.n ?? 3, hgt = o.h ?? 260, wid = o.w ?? 46, col = o.color ?? '#FFFFFF', al = o.alpha ?? 0.55, lw = o.width ?? 11, sp = o.speed ?? 1, s = o.strength ?? 1, seed = o.seed ?? 1;
    if (s <= 0) return;
    for (let i = 0; i < n; i++) {
      const ph = t * 1.4 * sp + i * 2.17 + seed, pts = [], widths = [];
      for (let k = 0; k <= 18; k++) {
        const f = k / 18, yy = y - f * hgt * (0.55 + 0.45 * s), drift = (noise(f * 2.2 - t * 0.55 * sp, i * 3.1, seed) - 0.5) * wid * 1.6;
        pts.push([x + (i - (n - 1) / 2) * wid * 0.55 + Math.sin(f * 5.2 - ph) * wid * (0.25 + f * 0.9) * 0.6 + drift * f, yy]);
        widths.push(lw * 0.5 * Math.sin(Math.PI * clamp(f * 1.08)) * (1 - f * 0.45) * (0.6 + 0.4 * s));
      }
      const gr = g.createLinearGradient(0, y, 0, y - hgt); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(0.18, rgba(col, al * s)); gr.addColorStop(0.75, rgba(col, al * s * 0.45)); gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr; g.fill(ribbon(pts, widths));
    }
  };
  const sparkle = (g, x, y, t, at, { size = 26, color = '#FFF6D8' } = {}) => {
    if (t < at || t > at + 0.7) return; const k = seg(t, at, at + 0.7), s = size * Math.sin(Math.PI * k);
    g.save(); g.translate(x, y); g.rotate(k * 0.8); g.fillStyle = color;
    g.fill(poly([[0, -s], [s * 0.18, -s * 0.18], [s, 0], [s * 0.18, s * 0.18], [0, s], [-s * 0.18, s * 0.18], [-s, 0], [-s * 0.18, -s * 0.18]])); g.restore();
  };

  // ---------- hands do the actions
  // pose: 'point' | 'open' | 'hold' | 'pinch'. x, y = the wrist; fingers point along rot (0 = up); flip mirrors it.
  // part: 'all' | 'back' | 'front'. To hold something, draw the hand's back, then the object, then its front (the thumb):
  // the object sits inside the grip and the fingers never cover its label.
  const POSES = {
    open: { f: [[-10, 0, 0, 0], [-3, 0, 0, 0], [5, 0, 0, 0], [13, 0, 0, 0]], th: [-62, 8, 6] },
    point: { f: [[-4, 0, 0, 0], [0, 100, 85, 40], [4, 100, 85, 40], [8, 95, 80, 40]], th: [-14, 30, 18] },
    hold: { f: [[-6, 58, 62, 30], [-1, 62, 66, 30], [4, 60, 64, 30], [9, 55, 60, 30]], th: [-48, 18, 10] },
    pinch: { f: [[-12, 34, 38, 20], [0, 90, 80, 40], [5, 95, 80, 40], [10, 95, 80, 40]], th: [-36, 26, 20] },
  };
  const hand = (g, o = {}) => {
    const part = o.part || 'all';
    const P = POSES[o.pose || 'point'], s = o.scale ?? 1, skin = o.skin || '#C68B62', ol = shade(skin, -0.42), nail = shade(skin, 0.38), t = o.t ?? 0;
    const bj = (i) => (o.boil === false ? 0 : (hash2(Math.floor(t * 12), i, 77) - 0.5) * 1.6);
    g.save(); g.translate(o.x ?? 0, o.y ?? 0); g.rotate(o.rot ?? 0); if (o.flip) g.scale(-1, 1); g.scale(s, s);
    // sleeve
    if (o.sleeve !== null && part !== 'front') {
      const sl = o.sleeve || '#3E5C76';
      g.fillStyle = sl; g.fill(poly([[-72, 8], [72, 8], [92, 420], [-92, 420]]));
      g.fillStyle = shade(sl, -0.18); g.fill(poly([[-76, -4], [76, -4], [78, 34], [-78, 34]]));
    }
    const palm = [[-64, -10], [-70, -70], [-62, -122], [-30, -138], [10, -140], [44, -128], [62, -100], [60, -40], [50, -6]];
    const bases = [[-44, -128], [-15, -136], [14, -132], [40, -118]], lens = [108, 118, 108, 84], widths = [29, 30, 28, 24];
    const fingers = P.f.map((f, i) => {
      let a = -Math.PI / 2 + (f[0] * Math.PI) / 180, x = bases[i][0], y = bases[i][1]; const pts = [[x, y]];
      [0.45, 0.3, 0.25].forEach((fr, j) => { a += (f[j + 1] * Math.PI) / 180 * (j === 0 ? 1 : 0.9); x += Math.cos(a) * lens[i] * fr; y += Math.sin(a) * lens[i] * fr; pts.push([x + bj(i * 5 + j), y + bj(i * 5 + j + 2)]); });
      return { pts, w: widths[i], straight: f[1] < 25 };
    });
    const th0 = [-58, -52], thA = (P.th[0] * Math.PI) / 180 - Math.PI / 2, thumb = [th0];
    { let a = thA, x = th0[0], y = th0[1]; [0.5, 0.5].forEach((fr, j) => { a += (P.th[j + 1] * Math.PI) / 180; x += Math.cos(a) * 82 * fr; y += Math.sin(a) * 82 * fr; thumb.push([x + bj(40 + j), y + bj(42 + j)]); }); }
    const limb = (pts, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) g.lineTo(q[0], q[1]); g.stroke(); };
    const palmPath = spline(palm, true, 0.5);
    if (part !== 'front') {
    // outline pass, then fill pass, so only the outer silhouette is outlined
    g.strokeStyle = ol; g.lineWidth = 7; g.stroke(palmPath); fingers.forEach(f => limb(f.pts, f.w + 7, ol));
    g.fillStyle = skin; g.fill(palmPath); fingers.forEach(f => limb(f.pts, f.w, skin));
    // knuckle creases and nails
    g.strokeStyle = rgba(ol, 0.5); g.lineWidth = 3; g.lineCap = 'round';
    fingers.forEach(f => { const [a, b] = [f.pts[1], f.pts[2]]; const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2; g.beginPath(); g.moveTo(a[0] - Math.cos(ang) * f.w * 0.22, a[1] - Math.sin(ang) * f.w * 0.22); g.lineTo(a[0] + Math.cos(ang) * f.w * 0.22, a[1] + Math.sin(ang) * f.w * 0.22); g.stroke(); });
    fingers.forEach(f => { if (!f.straight) return; const a = f.pts[2], b = f.pts[3], ang = Math.atan2(b[1] - a[1], b[0] - a[0]); g.save(); g.translate(b[0] - Math.cos(ang) * f.w * 0.18, b[1] - Math.sin(ang) * f.w * 0.18); g.rotate(ang); g.fillStyle = nail; g.fill(roundRect(-f.w * 0.42, -f.w * 0.3, f.w * 0.5, f.w * 0.6, f.w * 0.25)); g.restore(); });
    }
    if (part !== 'back') { limb(thumb, 32 + 7, ol); limb(thumb, 32, skin); const tp = thumb[thumb.length - 1], tq = thumb[thumb.length - 2], ta = Math.atan2(tp[1] - tq[1], tp[0] - tq[0]); g.save(); g.translate(tp[0] - Math.cos(ta) * 6, tp[1] - Math.sin(ta) * 6); g.rotate(ta); g.fillStyle = nail; g.fill(roundRect(-12, -9, 14, 18, 7)); g.restore(); }
    g.restore();
  };

  // ---------- transitions
  // reveal fn() through a growing shape. shape: 'circle' (cx, cy) | 'left' | 'right' | 'up' | 'down'
  const wipe = (g, prog, fn, { shape = 'circle', cx = W / 2, cy = H / 2, edge = null } = {}) => {
    if (prog <= 0) return; if (prog >= 1) { fn(); return; }
    const e = ease.inOut(prog), clip = new Path2D();
    if (shape === 'circle') circle(cx, cy, e * Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.02, clip);
    else if (shape === 'left') clip.rect(W * (1 - e), 0, W * e, H);
    else if (shape === 'right') clip.rect(0, 0, W * e, H);
    else if (shape === 'up') clip.rect(0, H * (1 - e), W, H * e);
    else clip.rect(0, 0, W, H * e);
    g.save(); g.clip(clip); fn(); g.restore();
    if (edge) { g.save(); g.strokeStyle = edge; g.lineWidth = 6; g.stroke(clip); g.restore(); }
  };

  // ---------- the product
  const placeholder = Object.keys(products).length ? null : placeholderProduct();
  const product = (name = 'main') => {
    const P = products[name] || (name === 'main' && Object.keys(products).length ? products[Object.keys(products)[0]] : null) || placeholder || placeholderProduct();
    return {
      ...P,
      // x, y = the middle of the card's base on screen; h = how tall the product is drawn
      draw(g, o = {}) {
        const t = o.t ?? 0, at = o.at ?? -10, dur = o.dur ?? M.dur * 1.5, h = o.h ?? 760, w = h / P.aspect;
        let x = o.x ?? W / 2, y = o.y ?? H * 0.62, rot = o.rot ?? -0.02, sc = o.scale ?? 1;
        const enter = o.enter || 'none'; if (enter !== 'none') ev(at); const e = clamp((t - at) / dur);
        if (enter !== 'none' && t < at) return null;
        if (enter === 'drop') { const fall = e < 0.6 ? (e / 0.6) ** 2 : 1 - Math.sin(Math.PI * (e - 0.6) / 0.4) * 0.035; y -= (1 - fall) * (o.from ?? 900); rot += (1 - ss(e)) * 0.22 + wobble(t, at + dur * 0.6, 0.035, 11, 6); }
        else if (enter === 'slide-left' || enter === 'slide-right') { const k = settle(t, at, dur); x += (1 - k) * (enter === 'slide-left' ? -1 : 1) * (o.from ?? 900); rot += wobble(t, at + dur * 0.7, 0.03, 10, 6); }
        else if (enter === 'rise') { const k = settle(t, at, dur); y += (1 - k) * (o.from ?? 900); }
        else if (enter === 'pop') sc *= settle(t, at, dur);
        if (sc <= 0) return null;
        g.save(); g.globalAlpha *= o.alpha ?? 1; g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
        const card = poly(P.snip.map(([u, v]) => [-w / 2 + u * w, -h + v * h]));
        if (o.shadow !== false) { g.save(); g.globalCompositeOperation = 'multiply'; g.filter = `blur(${Math.max(2, h * 0.008).toFixed(1)}px)`; g.translate(h * 0.016, h * 0.02); g.fillStyle = 'rgba(60,40,22,0.34)'; g.fill(card); g.restore(); }
        if (o.border !== false) { g.fillStyle = o.paper || '#F8F2E4'; g.fill(card); }
        g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(P.img, -w / 2, -h, w, h);
        if (o.tape !== false && o.border !== false) {
          g.save(); g.translate(w * 0.42, -h * 0.985); g.rotate(-0.55); g.scale(h * 0.2, h * 0.055);
          g.fillStyle = 'rgba(236,224,180,0.78)'; g.fill(poly(P.tape)); g.restore();
        }
        g.restore();
        const m = new DOMMatrix().translate(x, y).rotate((rot * 180) / Math.PI).scale(sc, sc);
        const px = (u, v) => { const q = m.transformPoint(new DOMPoint(-w / 2 + (u / P.w) * w, -h + (v / P.h) * h)); return [q.x, q.y]; };
        const drawnPx = h * sc, srcPx = P.h;
        if (drawnPx > srcPx * 1.1 && P !== placeholder) flag(qa.upscale, P.name, { t: +t.toFixed(2), product: P.name, drawnPx: Math.round(drawnPx), photoPx: srcPx, x: +(drawnPx / srcPx).toFixed(2) });
        return { x, y, w: w * sc, h: h * sc, rot, point: px };
      },
    };
  };

  // ---------- captions (drawn by the renderer after the look)
  // A style can draw its own captions: captions.render(g, cap, t, { prev, next, i }) gets each phrase with its words'
  // times (cap.toks[i], cap.times[i] = { a, b }), and captions.layer 'print' draws them into the world, under the
  // style's finish. Captions are at least 56 px (a phone at arm's length).
  const capStyle = { font: 'Jost', weight: 600, size: 56, color: '#FFF8EC', emph: { family: 'Cormorant Garamond', weight: 600, italic: true, scale: 1.16 }, style: 'shadow', bg: 'rgba(24,18,12,0.72)', render: null, layer: 'over' };
  const captions = [];
  for (const L of script.lines) {
    if ((L.show || 'caption') !== 'caption') continue;
    const tl = byId.get(L.id); if (!tl) continue;
    const toks = parseMarkup(L.caption || L.text), times = align(toks, tl.words || [], tl.start, tl.end);
    let cur = [];
    const flush = () => { if (cur.length) captions.push({ id: L.id, toks: cur.map(i => toks[i]), times: cur.map(i => times[i]), a: times[cur[0]].a, last: times[cur[cur.length - 1]].b }); cur = []; };
    // short phrases on one line; never end a phrase on a little word like "the" or "of"
    const SMALL = /^(the|a|an|of|to|in|on|at|by|for|from|with|and|or|but|so|as|is|was|are|were|be|it|its|it's|your|my|our|their|this|that|than|then|if|not|no|very|just|more|most|every)$/i;
    toks.forEach((tk, i) => {
      const len = cur.reduce((s, k) => s + toks[k].w.length + 1, 0) + tk.w.length, inEmph = cur.length && toks[cur[cur.length - 1]].emph && tk.emph;
      if (cur.length && (len > (inEmph ? 32 : 24) || cur.length >= 5 || times[i].a - times[cur[cur.length - 1]].b > 0.3)) {
        const carry = []; while (cur.length > 1 && SMALL.test(toks[cur[cur.length - 1]].w)) carry.unshift(cur.pop());
        flush(); cur = carry;
      }
      cur.push(i);
      if (/[,.;:?!]["')]?$/.test(tk.w)) flush();
    });
    flush();
  }
  // a phrase holds until the next one when it starts within 1.5 s (the caption stays up across short gaps), else
  // 0.6 s after its last word: the reading time a spoken line needs (directing.md, rhythm)
  captions.forEach((c, i) => { const nx = captions[i + 1]; c.b = nx && nx.a < c.last + 1.5 ? nx.a - 0.02 : c.last + 0.6; });
  const drawCaptions = (g, t) => {
    for (let ci = 0; ci < captions.length; ci++) {
      const c = captions[ci];
      if (t < c.a - 0.12 || t > c.b) continue;
      noteText(`caption:${c.id}:${ci}`, { text: c.toks.map(k => k.w).join(' '), role: 'caption', size: capStyle.size, box: [LANE.x, LANE.y1 - capStyle.size * 2.3, LANE.x + LANE.maxW, LANE.y1 + capStyle.size * 0.3], t });
      if (capStyle.render) { g.save(); capStyle.render(g, c, t, { prev: captions[ci - 1], next: captions[ci + 1], i: ci, style: capStyle, lane: LANE }); g.restore(); continue; }
      if (t < c.a - 0.08) continue;
      const al = Math.min(ss(seg(t, c.a - 0.08, c.a + 0.06)), 1 - ss(seg(t, c.b - 0.08, c.b))); if (al <= 0) continue;
      const rise = (1 - ease.out(seg(t, c.a - 0.08, c.a + 0.18))) * 12;
      const base = { family: capStyle.font, weight: capStyle.weight }; let lines = layoutTokens(g, c.toks, base, capStyle.emph, capStyle.size, LANE.maxW);
      if (lines.length === 2 && lines[1].items.length === 1 && lines[0].items.length >= 3) lines = layoutTokens(g, c.toks, base, capStyle.emph, capStyle.size, (lines[0].w + lines[1].w) / 2 + 60);
      lines = lines.slice(0, 2); const lh = capStyle.size * 1.18;
      const y0 = LANE.y1 - (lines.length - 1) * lh + rise;
      g.save(); g.globalAlpha = al; g.textBaseline = 'alphabetic';
      lines.forEach((ln, i) => {
        const y = y0 + i * lh;
        if (capStyle.style === 'chip') { g.fillStyle = capStyle.bg; g.fill(roundRect(LANE.x - 18, y - capStyle.size * 0.9, ln.w + 36, capStyle.size * 1.22, 12)); }
        else { g.shadowColor = 'rgba(10,6,2,0.62)'; g.shadowBlur = 16; g.shadowOffsetY = 2; }
        for (const it of ln.items) { g.font = it.font; g.fillStyle = it.tok.emph && capStyle.emph.color ? capStyle.emph.color : capStyle.color; g.fillText(it.tok.w, LANE.x + it.x, y); }
        g.shadowColor = 'transparent';
      });
      g.restore();
    }
  };

  // ---------- the look (drawn by the renderer after draw(), before captions)
  // a layer made in its own medium, composited over g (for mixing media inside one frame). fn draws in screen space.
  let MEDIA_IMPL = {}; const layerCanvases = [];
  const medium = (g, name, t, o, fn) => {
    const impl = MEDIA_IMPL[name]; if (!impl) throw new Error(`K.medium: no medium "${name}" (have: ${Object.keys(MEDIA_IMPL).join(', ')})`);
    if (!layerCanvases.length) layerCanvases.push(createCanvas(W, H), createCanvas(W, H));
    const [A, B] = layerCanvases, ag = A.getContext('2d'), bg = B.getContext('2d');
    for (const c of [ag, bg]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); }
    ag.save(); fn(ag); ag.restore();
    impl(bg, A, t, { ...(o || {}), layer: true });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(B, 0, 0); g.restore();
  };
  const debugOverlay = g => {
    g.save(); g.strokeStyle = 'rgba(255,0,140,0.85)'; g.lineWidth = 3; g.setLineDash([14, 10]);
    g.stroke(poly([[SAFE.x0, SAFE.y0], [SAFE.x1, SAFE.y0], [SAFE.x1, SAFE.clearBelow], [SAFE.clearX, SAFE.clearBelow], [SAFE.clearX, SAFE.y1], [SAFE.x0, SAFE.y1]]));
    g.strokeStyle = 'rgba(0,160,255,0.85)'; g.strokeRect(LANE.x, LANE.y1 - capStyle.size * 2.2, LANE.maxW, capStyle.size * 2.45); g.restore();
  };

  // ---------- the music grid: cuts and big hits land on the beat nearest their word (references/directing.md)
  const grid = (bpm = 120, offset = 0) => {
    const beat = 60 / bpm, bar = beat * 4;
    return {
      bpm, offset, beat, bar,
      snap(t, mode = 'nearest', unit = beat) { const k = (t - offset) / unit, n = mode === 'next' ? Math.ceil(k - 1e-9) : mode === 'prev' ? Math.floor(k + 1e-9) : Math.round(k); return offset + n * unit; },
      barIndex(t) { return Math.floor((t - offset + 1e-9) / bar); },
      barStart(n) { return offset + n * bar; },
    };
  };

  const K = {
    W, H, SAFE, LANE, T, script, products, images, qa, grid, noteText, event: ev, parseMarkup, plain, align, norm,
    // maths and colour
    TAU, clamp, lerp, seg, ss, ease, rng, hash2, noise, fbm, rgb, hex, mix, rgba, shade, jitter,
    // paths
    spline, poly, circle, ellipse, roundRect, ribbon, sampleSpline, Path2D, DOMMatrix,
    // motion
    get M() { return M; }, p, settle, move, wobble, twos, wave, fade,
    // camera
    camera, view, toScreen,
    // drawing
    cache, boil, shape, contact, drawOn, arrow, mark, strike, tick, text, statement, stamp, label, counter, wisps, sparkle, hand, wipe, product,
    canvas: (w, h) => createCanvas(Math.ceil(w), Math.ceil(h)),
    font: fontStr,
    // used by render.mjs
    _setMotion(name) { M = MOTION[name] || MOTION.warm; },
    _setCaptions(o = {}) { Object.assign(capStyle, o); if (o.emph) capStyle.emph = { ...capStyle.emph, ...o.emph }; F.base.family = o.font || F.base.family; if (o.emph) F.emph = { ...F.emph, ...o.emph }; },
    get _captionLayer() { return capStyle.layer; }, _texts: texts,
    medium, _setMedia(m) { MEDIA_IMPL = m; },
    _captions: drawCaptions, _captionList: captions, _debug: debugOverlay, _events: events,
  };
  return K;
}
