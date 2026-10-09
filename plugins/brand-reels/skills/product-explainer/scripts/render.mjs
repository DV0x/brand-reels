#!/usr/bin/env node
// render.mjs: renders a product explainer project (script.json + vo/timing.json + film.mjs + product/*.png).
//   render.mjs <project> frame <t> [<t> ...] [--crop x,y,w,h] [--debug]   one PNG per time, into <project>/out/frames/
//                                                         (--crop also saves that part at 100%, for close-up QA)
//   render.mjs <project> sheet [--debug]                 the contact sheet: one finished frame per beat (per voice line),
//                                                         with its voice and on-screen words
//   render.mjs <project> video [--fps 30] [--from a --to b] [--workers n]   the MP4 with sound, subtitles (.srt), a cover
//                                                         frame and out/report.json (loudness, frozen frames, decode)
//   render.mjs <project> contact [--every 1]             the whole film, one frame every N seconds (out/contact.jpg)
//   render.mjs <project> strip <from> <to> [--step 0.2]  one key action, a frame every step (out/strips/)
//   render.mjs <project> check                           the machine checks: text size, safe zone, reading time,
//                                                         contrast, still moments, an end like the start, hits on
//                                                         the beat; out/check.json
//   add --estimate to any mode to time the lines from the text when there is no voice yet
// Exit codes: 0 done (check: PASS), 1 failed (check: issues to fix), 2 wrong call (usage, no script.json, bad mode).
// Run it through the plugin's launcher: bash <plugin>/runtime/run.sh render.mjs <project> <mode> ...
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { spawnSync } from 'node:child_process';
import { createCanvas, registerFonts, FFMPEG, SKILL } from './lib/canvas.mjs';
import { makeKit, W, H, plain } from './lib/kit.mjs';
import { buildAudio } from './lib/audio.mjs';
import { MEDIA } from './lib/media.mjs';

const SELF = fileURLToPath(import.meta.url);
const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));
// a wrong call (exit 2), as opposed to a failure while rendering (exit 1)
class UsageError extends Error {}
const USAGE = 'usage: render.mjs <project> frame <t...> [--crop x,y,w,h] | sheet | contact [--every 1] | strip <from> <to> [--step 0.2] | check | video [--fps 30] [--from a --to b] [--workers n]   options: --debug (show the safe zone), --estimate (time the lines from the text)';
// a film's length (copy.md): 30 to 35 s
const LEN_MIN = 30, LEN_MAX = 35;

// ---------------------------------------------------------------- timing: the voice's, or an estimate from the text
function loadTiming(project, script, estimate) {
  const f = path.join(project, 'vo', 'timing.json');
  if (!estimate && fs.existsSync(f)) return readJSON(f);
  if (!estimate) throw new Error(`no ${f}. Make the voice first (voice.mjs), or add --estimate to time the lines from the text.`);
  // one take (the default): 2.7 words a second and the voice's own breath between lines (about 0.25 s), plus the
  // written pauses (measured on a one-take script, 2026-10-09). Lines mode: 2.6 words a second, then gap and pause.
  // A line with "at" waits for it (a pause can only grow).
  const lines = [], oneTake = script.voice?.take !== 'lines', wps = oneTake ? 2.7 : 2.6; let t = script.lead ?? 0.4;
  for (const [i, L] of script.lines.entries()) {
    if (i > 0) t += oneTake ? 0.15 + (L.pause ?? 0) : (script.gap ?? 0.35) + (L.pause ?? 0);   // 0.25 s word to word, less the 0.1 s a line's span adds
    if (Number.isFinite(L.at)) t = oneTake ? Math.max(t, L.at) : L.at;
    const words = plain(L.text).split(/\s+/).filter(Boolean), dur = words.length / (wps * (L.speed ?? 1)) + (oneTake ? 0.1 : 0.15), total = words.reduce((s, w) => s + w.length + 1, 0);
    let acc = 0; const ws = words.map(w => { const a = t + (acc / total) * dur; acc += w.length + 1; return { w, start: +a.toFixed(3), end: +(t + (acc / total) * dur - 0.04).toFixed(3) }; });
    lines.push({ id: L.id, text: plain(L.text), start: +t.toFixed(3), end: +(t + dur).toFixed(3), words: ws });
    t += dur;
  }
  const last = lines[lines.length - 1];
  return { duration: +(last.end + (script.tail ?? 2.6)).toFixed(3), lines, estimated: true };
}

const STYLES = path.join(SKILL, 'styles');
const styleList = () => (fs.existsSync(STYLES) ? fs.readdirSync(STYLES).filter(d => fs.existsSync(path.join(STYLES, d, 'STYLE.md'))) : []);

async function setup(project, { estimate = false } = {}) {
  if (!fs.existsSync(path.join(project, 'script.json'))) throw new UsageError(`no script.json in ${project}. Give the film's project folder (it holds script.json); start from templates/script.json.`);
  const script = readJSON(path.join(project, 'script.json'));
  const timing = loadTiming(project, script, estimate);
  // the style: its fonts, and its engine if it has one (styles/<style>/engine.mjs), handed to the film as K.style
  const style = script.style || null;
  if (style && !styleList().includes(style)) throw new Error(`script.json "style": "${style}" is not a style. Styles: ${styleList().join(', ')}`);
  if (style) registerFonts(path.join(STYLES, style, 'fonts'));
  registerFonts(path.join(project, 'fonts'));
  const K = await makeKit({ project, script, timing }), S0 = {};
  K.styleName = style;
  const engineFile = style && path.join(STYLES, style, 'engine.mjs');
  if (engineFile && fs.existsSync(engineFile)) K.style = (await import(pathToFileURL(engineFile).href)).default(K);
  const filmFile = path.join(project, 'film.mjs');
  if (!fs.existsSync(filmFile)) throw new Error(`no ${filmFile}. Copy templates/film.mjs into the project as film.mjs and write the film from your treatment.`);
  const mod = await import(pathToFileURL(filmFile).href + '?v=' + Date.now());
  const F = mod.default(K);
  if (!F || typeof F.draw !== 'function') throw new Error('film.mjs must `export default function film(K)` that returns { draw(g, t), ... }');
  K._setMotion(F.motion || 'warm'); K._setCaptions(F.captions || {});
  K._setMedia({ ...MEDIA, ...(F.media?.custom || {}) });
  S0.media = { ...MEDIA, ...(F.media?.custom || {}) };
  // A film is made in a medium: a style draws in it directly ('direct'), or a pass remakes the world (painted, ...).
  const direct = !!(style || F.finish);
  const lookAt = t => { const l = typeof F.look === 'function' ? F.look(t) : F.look; return l ?? (direct ? 'direct' : undefined); };
  for (const t of [0, timing.duration / 2, timing.duration - 0.1]) { const l = lookAt(t); if (!S0.media[l] && l !== 'none' && l !== 'direct') throw new Error(`look "${l}" at ${t.toFixed(1)} s: choose a style in script.json ("style": one of ${styleList().join(', ')}), or a pass: ${Object.keys(S0.media).join(', ')} or one in media.custom (references/craft.md). "none" is for debugging only.`); }
  const canvas = createCanvas(W, H), g = canvas.getContext('2d'), ref = createCanvas(W, H);
  return { project, script, timing, K, F, canvas, g, ref, rg: ref.getContext('2d'), media: S0.media, lookAt, style };
}

// A frame is made in layers:
//   1. draw: the world, drawn in the style (or drawn plainly for a pass to remake);
//   2. printed captions (captions.layer 'print'): part of the world, under the finish;
//   3. the medium: a pass that remakes the world (look: painted, silkscreen, custom), and/or the style's finish (paper);
//   4. over: the crisp layer, the product photo and anything in front of it, which the medium never touches;
//   5. captions (the default layer), then top: transitions and flashes over everything.
const reset = g => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; };
const guard = (name, t, fn) => { try { fn(); } catch (e) { e.message = `film.${name} failed at t=${t.toFixed(3)} s: ${e.message}`; throw e; } };
function drawFrame(S, t, debug = false) {
  const { g, F, K } = S, look = S.lookAt(t), medium = S.media[look], wg = medium ? S.rg : g, printed = K._captionLayer === 'print';
  wg.save(); reset(wg); wg.fillStyle = F.background || '#F3EBDD'; wg.fillRect(0, 0, W, H); wg.restore();
  wg.save(); guard('draw', t, () => F.draw(wg, t)); wg.restore();
  if (printed) { wg.save(); reset(wg); K._captions(wg, t); wg.restore(); }
  if (medium) { g.save(); reset(g); medium(g, S.ref, t, F.media || {}); g.restore(); }
  if (F.finish) { g.save(); reset(g); guard('finish', t, () => F.finish(g, t)); g.restore(); }
  if (F.over) { g.save(); guard('over', t, () => F.over(g, t)); g.restore(); }
  if (!printed) { g.save(); K._captions(g, t); g.restore(); }
  if (F.top) { g.save(); guard('top', t, () => F.top(g, t)); g.restore(); }
  if (debug) K._debug(g);
}

// ---------------------------------------------------------------- QA from the film's own declarations
function qaOf(S) {
  const { F, K, timing } = S, T = K.T, cues = (F.cues || []).filter(c => c && Number.isFinite(c.t)).sort((a, b) => a.t - b.t);
  // a hard cut is a shot that starts with cut: true; transitions made by the medium (cut: 'wipe') are not hard cuts
  const shots = F.shots || [], cuts = shots.filter((s, i) => i > 0 && (s.cut === true || s.cut === undefined)).length, wipes = shots.filter(s => typeof s.cut === 'string').length;
  const events = [...cues.map(c => c.t), ...shots.map(s => s.from), ...K._events].sort((a, b) => a - b), gaps = [];
  const a0 = timing.lines[0]?.start ?? 0, a1 = T.endCard;
  let prev = a0; for (const e of [...events.filter(e => e > a0 && e < a1), a1]) { if (e - prev > 4) gaps.push([+prev.toFixed(2), +e.toFixed(2)]); prev = Math.max(prev, e); }
  const statements = S.script.lines.filter(l => l.show === 'statement').length;
  const warnings = [];
  if (cuts > 5) warnings.push(`${cuts} hard cuts: keep it to 5 or fewer; travel the camera, or use the style's own transition`);
  if (gaps.length) warnings.push(`nothing new happens for more than 4 s in: ${gaps.map(g => `${g[0]}-${g[1]} s`).join(', ')} (a breath is fine; a dead stretch is not)`);
  if (statements > 4) warnings.push(`${statements} statements: use 3 or 4 (copy.md)`);
  if (timing.duration < LEN_MIN || timing.duration > LEN_MAX) warnings.push(`the film is ${timing.duration.toFixed(1)} s: keep it ${LEN_MIN} to ${LEN_MAX} s. Cut or add words in the script; never pad with pauses or speed up the voice (copy.md)`);
  if (timing.estimated) warnings.push('timing is estimated from the text: make the voice before the final render');
  if ([0, timing.duration / 2].some(t => S.lookAt(t) === 'none' || (!S.media[S.lookAt(t)] && S.lookAt(t) !== 'direct'))) warnings.push('look "none": a flat debug render, never for delivery (references/craft.md)');
  return { duration: timing.duration, style: S.style || null, shots: shots.length, hardCuts: cuts, styleTransitions: wipes, cues: cues.length, statements, eventGaps: gaps, warnings };
}

// a pass over the whole film (every layer but the medium and the finish): it finds every animation start and records every text on screen
// with its size, box and the times it shows (for the safe zone, size and reading-time checks)
function probe(S, fps = 8) {
  const g = S.canvas.getContext('2d'), at = t => {
    g.save(); reset(g); g.clearRect(0, 0, W, H);
    guard('draw', t, () => S.F.draw(g, t)); g.restore();
    g.save(); reset(g); S.K._captions(g, t); g.restore();
    if (S.F.over) { g.save(); reset(g); guard('over', t, () => S.F.over(g, t)); g.restore(); }
    if (S.F.top) { g.save(); reset(g); guard('top', t, () => S.F.top(g, t)); g.restore(); }   // texts drawn on top are checked too
  };
  const seen = new Set();
  for (let t = 0; t < S.timing.duration; t += 1 / fps) { at(t); seen.add(Math.round(t * 30)); }
  return { at, seen };
}
// fast moves (a whip, a slam, a cut) happen around hits, cues, shot changes and animation starts: sample those windows
// at every frame (30 fps), so a text that crosses out of the safe box for a few frames is caught before the video
function probeDense(S, P, { before = 0.1, after = 0.5, cap = 900 } = {}) {
  const { F, K, timing } = S, ev = [...(F.hits || []).map(h => (typeof h === 'number' ? h : h?.t)), ...(F.cues || []).map(c => c?.t),
    ...(F.shots || []).map(s => s?.from), ...K._events].filter(Number.isFinite);
  const frames = new Set();
  for (const e of ev) for (let f = Math.ceil((e - before) * 30); f <= Math.floor((e + after) * 30); f++) if (f >= 0 && f / 30 < timing.duration && !P.seen.has(f)) frames.add(f);
  const list = [...frames].sort((a, b) => a - b).slice(0, cap);
  for (const f of list) P.at(f / 30);
  return list.length;
}

// ---------------------------------------------------------------- the contact sheet
function wrapText(g, txt, maxW) { const out = []; let cur = ''; for (const w of txt.split(/\s+/)) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; }
async function sheet(S, debug) {
  const { F, K, script, timing, project } = S, outDir = path.join(project, 'out'), fdir = path.join(outDir, 'frames');
  fs.mkdirSync(fdir, { recursive: true });
  // one finished frame per beat: each voice line at its key moment (film.beats[id], or just as the line ends), then the end card
  const shotAt = t => (F.shots || []).find(s => t >= s.from && t < (s.to ?? 1e9));
  const shots = timing.lines.map(l => {
    const key = F.beats?.[l.id] ?? Math.max(l.start + 0.3, l.end - 0.05), sh = shotAt(key);
    return { name: sh?.name || l.id, from: l.start, to: l.end, key, lines: [l], cut: sh && sh.from > l.start - 0.01 && sh.from < l.end ? sh.cut : false };
  });
  if (shots[shots.length - 1].key < S.K.T.endCard) shots.push({ name: 'End card', from: S.K.T.endCard, to: timing.duration, key: F.beats?.end ?? timing.duration - 0.3, lines: [] });
  const n = shots.length, cols = Math.min(6, n), rows = Math.ceil(n / cols), tw = 320, th = 569, M = 44, G = 26, capH = 250, head = 170;
  const SW = M * 2 + cols * tw + (cols - 1) * G, SH = head + rows * (th + capH + G) + M;
  const sc = createCanvas(SW, SH), g = sc.getContext('2d');
  g.fillStyle = '#17161a'; g.fillRect(0, 0, SW, SH);
  probe(S);
  const q = qaOf(S);
  g.fillStyle = '#F3EAD6'; g.font = '700 44px "Jost"'; g.fillText(`${script.brand || ''} ${script.product ? '· ' + script.product : ''}: contact sheet`, M, 70);
  g.fillStyle = '#A79F8E'; g.font = '500 25px "Jost"';
  g.fillText(`${q.duration.toFixed(1)} s · ${n} beats · ${q.shots} shots · ${q.hardCuts} hard cuts · ${q.statements} statements · ${S.style ? 'style ' + S.style : 'medium ' + (typeof F.look === 'function' ? 'mixed' : F.look)} · motion ${F.motion || 'warm'} · music ${typeof F.music === 'object' ? (typeof F.music.score === 'function' ? 'own score' : F.music.preset) : F.music || 'warm'}${timing.estimated ? ' · TIMING ESTIMATED (no voice yet)' : ''}`, M, 112);
  if (q.warnings.length) { g.fillStyle = '#E8A33D'; g.font = '500 23px "Jost"'; g.fillText('Check: ' + q.warnings.join(' | ').slice(0, 190), M, 148); }
  for (let i = 0; i < n; i++) {
    const s = shots[i], c = i % cols, r = Math.floor(i / cols), x = M + c * (tw + G), y = head + r * (th + capH + G);
    drawFrame(S, s.key, debug);
    fs.writeFileSync(path.join(fdir, `beat-${String(i + 1).padStart(2, '0')}.jpg`), S.canvas.toBuffer('image/jpeg', 90));
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(S.canvas, x, y, tw, th);
    g.fillStyle = '#F3EAD6'; g.font = '700 24px "Jost"'; g.fillText(`${i + 1}  ${s.name || ''}`.slice(0, 30), x, y + th + 34);
    g.fillStyle = '#8F8878'; g.font = '500 19px "Jost"'; g.fillText(`${s.key.toFixed(1)} s${s.cut === false || !i ? '' : ' · after a cut'}`, x, y + th + 60);
    let yy = y + th + 92;
    for (const l of s.lines) {
      const sl = script.lines.find(z => z.id === l.id) || {}, isSt = sl.show === 'statement';
      g.font = isSt ? '700 20px "Jost"' : 'italic 400 20px "Jost"'; g.fillStyle = isSt ? '#E8C36A' : '#CFC6B2';
      for (const ln of wrapText(g, (isSt ? 'ON SCREEN + VO: ' : 'VO: ') + plain(sl.text || l.text), tw - 4)) { if (yy > y + th + capH - 6) break; g.fillText(ln, x, yy); yy += 25; }
      yy += 6;
    }
  }
  const file = path.join(outDir, 'sheet.jpg');
  fs.writeFileSync(file, sc.toBuffer('image/jpeg', 88));
  return { file, frames: fdir, qa: q, qaText: S.K.qa };
}

// ---------------------------------------------------------------- the review sheets: the whole film, and key actions
// contact: one frame every `every` seconds, six to a row, each with its time (DIRECTOR's review loop, twice per film)
async function contact(S, { every = 1, debug = false } = {}) {
  const { timing, project, script } = S, outDir = path.join(project, 'out');
  const times = []; for (let t = Math.min(0.5, every / 2); t < timing.duration - 0.01; t += every) times.push(+t.toFixed(2));
  return tile(S, times, path.join(outDir, 'contact.jpg'), `${script.brand || ''} ${script.product ? '· ' + script.product : ''}: every ${every} s`, debug);
}
// strip: one key action at a fine step (anticipation, action, follow-through), to check it frame by frame
async function strip(S, from, to, { step = 0.2, debug = false } = {}) {
  const times = []; for (let t = from; t <= to + 1e-6; t += step) times.push(+t.toFixed(3));
  const dir = path.join(S.project, 'out', 'strips'); fs.mkdirSync(dir, { recursive: true });
  return tile(S, times, path.join(dir, `strip-${from.toFixed(2)}-${to.toFixed(2)}.jpg`), `${from.toFixed(2)} to ${to.toFixed(2)} s, every ${step} s`, debug, Math.min(8, times.length));
}
function tile(S, times, file, title, debug, cols = 6) {
  const n = times.length, rows = Math.ceil(n / cols), tw = 270, th = 480, M = 30, G = 14, lab = 34, head = 70;
  const sc = createCanvas(M * 2 + cols * tw + (cols - 1) * G, head + rows * (th + lab + G) + M), g = sc.getContext('2d');
  g.fillStyle = '#17161a'; g.fillRect(0, 0, sc.width, sc.height);
  g.fillStyle = '#F3EAD6'; g.font = '700 30px "Jost"'; g.fillText(title, M, 46);
  times.forEach((t, i) => {
    const x = M + (i % cols) * (tw + G), y = head + Math.floor(i / cols) * (th + lab + G);
    drawFrame(S, t, debug); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(S.canvas, x, y, tw, th);
    g.fillStyle = '#A79F8E'; g.font = '500 20px "Jost"'; g.fillText(`${t.toFixed(2)} s`, x, y + th + 24);
  });
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, sc.toBuffer('image/jpeg', 86));
  return { file, frames: n };
}

// ---------------------------------------------------------------- the machine checks (references/directing.md, "Checks")
// Minimum text sizes on a 1080 x 1920 frame, by role. Texture (case numbers, rulers) has no minimum.
const MIN_SIZE = { caption: 56, headline: 72, label: 40, stamp: 40, note: 36 };
const lum = (r, g, b) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
// contrast inside a text box: the ratio between its light and dark extremes (4th and 96th percentile of luminance)
function boxContrast(g, [x0, y0, x1, y1]) {
  const x = Math.max(0, Math.floor(x0)), y = Math.max(0, Math.floor(y0)), w = Math.min(W, Math.ceil(x1)) - x, h = Math.min(H, Math.ceil(y1)) - y;
  if (w < 4 || h < 4) return null;
  const d = g.getImageData(x, y, w, h).data, L = [];
  for (let i = 0; i < d.length; i += 4 * 3) L.push(lum(d[i], d[i + 1], d[i + 2]));
  L.sort((a, b) => a - b);
  const lo = L[Math.floor(L.length * 0.04)], hi = L[Math.floor(L.length * 0.96)];
  return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
}
// how different two frames are, on 8 x 8 block means (so dust and grain don't count as motion)
function blockMeans(g) {
  const d = g.getImageData(0, 0, W, H).data, bw = W / 8, bh = H / 8, out = new Float32Array(bw * bh);
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) { let s = 0; for (let y = 0; y < 8; y += 2) for (let x = 0; x < 8; x += 2) { const i = ((by * 8 + y) * W + bx * 8 + x) * 4; s += d[i] + d[i + 1] + d[i + 2]; } out[by * bw + bx] = s / (16 * 3 * 255); }
  return out;
}
async function check(S) {
  const { K, F, timing, project } = S, out = path.join(project, 'out'); fs.mkdirSync(out, { recursive: true });
  const dense = probeDense(S, probe(S, 6));
  const q = qaOf(S), texts = [...K._texts.values()], issues = [];
  // 1. size, 2. safe zone (from the kit's checks), 3. reading time
  for (const it of texts) {
    const min = MIN_SIZE[it.role]; if (min && it.size && it.size < min - 0.5) issues.push({ check: 'size', t: it.first, text: it.text, msg: `${it.role} at ${Math.round(it.size)} px: at least ${min} px` });
    const shown = it.last - it.first + 0.1, letters = it.text.replace(/\s/g, '').length;
    if (it.role === 'headline' || it.role === 'label' || it.role === 'note') {
      // words that appear as they are spoken are read with the voice: they hold their line + 0.6 s (at least 1.8 s)
      const need = it.spoken != null ? Math.max(1.8, it.spoken + 0.6) : Math.min(4.5, letters / 15 + 1.5);
      if (shown < need - 0.05 && it.last < timing.duration - 0.2) issues.push({ check: 'reading time', t: it.first, text: it.text, msg: `on screen ${shown.toFixed(1)} s, needs about ${need.toFixed(1)} s (${it.spoken != null ? 'its spoken line + 0.6' : 'letters / 15 + 1.5'})` });
    }
  }
  for (const x of K.qa.text) issues.push({ check: 'safe zone', t: x.t, text: x.what, msg: `outside the safe box: ${x.box.join(', ')}` });
  // touching: two different headlines, labels or notes whose boxes overlap or come within 6 px, on 3 or more sampled
  // frames (a label's pill touching a line of type reads as a collision on a phone)
  const pairs = new Map();
  for (const [f, list] of K._frameTexts) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j]; if (a.id === b.id) continue;
    const ix = Math.min(a.box[2], b.box[2]) - Math.max(a.box[0], b.box[0]), iy = Math.min(a.box[3], b.box[3]) - Math.max(a.box[1], b.box[1]);
    if (ix > -6 && iy > -6) { const k = [a.id, b.id].sort().join('|'), r = pairs.get(k) || { n: 0, t: f / 30, a, b }; r.n++; r.t = Math.min(r.t, f / 30); pairs.set(k, r); }
  }
  for (const r of pairs.values()) if (r.n >= 3) issues.push({ check: 'touching', t: r.t, text: r.a.text, msg: `touches or overlaps "${r.b.text}" (${r.n} sampled frames): keep at least 6 px between them, or show them at different times` });
  // a label's pointer line that crosses or comes within 6 px of another text, on 3 or more sampled frames (its own label
  // and a text it points into are left out)
  const crossing = new Map();
  for (const [f, list] of K._framePointers || []) {
    const here = K._frameTexts.get(f) || [];
    for (const pl of list) for (const tx of here) {
      if (tx.id === pl.owner) continue;
      const [x0, y0, x1, y1] = tx.box, mg = 6 + pl.w / 2;
      if (pl.to[0] > x0 - 6 && pl.to[0] < x1 + 6 && pl.to[1] > y0 - 6 && pl.to[1] < y1 + 6) continue;
      if (!pl.pts.some(([x, y]) => x > x0 - mg && x < x1 + mg && y > y0 - mg && y < y1 + mg)) continue;
      const k = pl.id + '|' + tx.id, r = crossing.get(k) || { n: 0, t: f / 30, pl, tx }; r.n++; r.t = Math.min(r.t, f / 30); crossing.set(k, r);
    }
  }
  for (const r of crossing.values()) if (r.n >= 3) issues.push({ check: 'touching', t: r.t, text: r.pl.text, msg: `its pointer line crosses or touches "${r.tx.text}" (${r.n} sampled frames): move the label, bend the line (bend), or show them at different times` });
  for (const x of K.qa.upscale) issues.push({ check: 'product size', t: x.t, text: x.product, msg: `drawn at ${x.drawnPx} px from a ${x.photoPx} px photo (${x.x}x): it goes soft` });
  // 4. contrast: one finished frame per text, in the middle of its time on screen
  const byTime = new Map();
  // grouped into half-second bins, each measured at two moments 0.3 s apart (the better one counts, so a flash or a
  // wipe passing over the text doesn't fail it)
  for (const it of texts) { if (it.role === 'texture' || !it.boxes.length) continue; const tm = (it.first + it.last) / 2, b = it.boxes.reduce((a, c) => (Math.abs(c.t - tm) < Math.abs(a.t - tm) ? c : a)); const key = Math.round(b.t * 2) / 2; if (!byTime.has(key)) byTime.set(key, []); byTime.get(key).push({ it, box: b.box }); }
  const times = [...byTime.keys()].sort((a, b) => a - b).slice(0, 40), contrast = [];
  for (const tm of times) {
    const best = new Map();
    for (const dt of [-0.15, 0.15]) {
      const tt = Math.min(timing.duration - 0.05, Math.max(0, tm + dt)); drawFrame(S, tt);
      for (const { it, box } of byTime.get(tm)) { const c = boxContrast(S.g, box); if (c != null && c > (best.get(it) ?? 0)) best.set(it, c); }
    }
    for (const [it, c] of best) {
      const need = it.size >= 72 ? 3 : 4.5;
      contrast.push({ text: it.text.slice(0, 40), t: tm, ratio: c });
      if (c < need) issues.push({ check: 'contrast', t: tm, text: it.text, msg: `contrast ${c}:1, needs ${need}:1` });
    }
  }
  // 5. still moments: two frames 0.3 s apart in the middle of every line and of the end card must differ
  const probes = [...timing.lines.map(l => (l.start + l.end) / 2 - 0.15), K.T.endCard + Math.max(0.2, (timing.duration - K.T.endCard) / 2 - 0.15)].filter(t => t + 0.3 < timing.duration), still = [];
  for (const t of probes) {
    drawFrame(S, t); const a = blockMeans(S.g); drawFrame(S, t + 0.3); const b = blockMeans(S.g);
    let d = 0; for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - b[i]); d /= a.length;
    still.push({ t: +t.toFixed(2), diff: +d.toFixed(4) });
    if (d < 0.0015) issues.push({ check: 'still', t: +t.toFixed(2), text: '', msg: `nothing moves between ${t.toFixed(2)} and ${(t + 0.3).toFixed(2)} s (mean change ${d.toFixed(4)})` });
  }
  // 6. the loop: Reels replay at once, so an end that looks like the start reads as the film restarting. Each of 3
  // frames in the last 3 s against each of 3 in the first 3 s, on block means; the closest pair counts. Measured on
  // finished films: an end that repeated shot 1 scored 0.047; ends that showed a change scored 0.088 to 0.19.
  let loop = null;
  if (timing.duration > 8) {
    const starts = [0.5, 1.5, 2.5].map(t => { drawFrame(S, t); return { t, m: blockMeans(S.g) }; });
    for (const t of [2.5, 1.5, 0.5].map(x => timing.duration - x)) {
      drawFrame(S, t); const e = blockMeans(S.g);
      for (const st of starts) { let d = 0; for (let i = 0; i < e.length; i++) d += Math.abs(e[i] - st.m[i]); d /= e.length; if (!loop || d < loop.diff) loop = { end: +t.toFixed(2), start: st.t, diff: +d.toFixed(4) }; }
    }
    if (loop.diff < 0.06) q.warnings.push(`the end looks like the start (${loop.end} s and ${loop.start} s differ by only ${loop.diff}): Reels loop, so a repeat of the opening reads as a restart. Echo the opening with the change shown, never the first shot again (directing.md, section 3)`);
  }
  // 7. hits on the beat: every hit the film declares lands on the music grid (a 16th note), within half a frame
  const hits = [], bpm = F.music?.bpm, off = F.music?.offset ?? 0;
  if (Array.isArray(F.hits) && bpm) {
    const sixteenth = 60 / bpm / 4;
    const seen = new Set();
    for (const h of F.hits) {
      const t = typeof h === 'number' ? h : h.t, name = typeof h === 'number' ? '' : h.name || '';
      const key = `${(+t).toFixed(3)}|${name}`; if (!Number.isFinite(+t) || seen.has(key)) continue; seen.add(key);
      const grid = h.grid ?? off, d = Math.abs(t - (grid + Math.round((t - grid) / sixteenth) * sixteenth));
      hits.push({ t: +t.toFixed(3), name, offBy: +(d * 1000).toFixed(0) });
      if (d > 0.017) issues.push({ check: 'beat', t, text: name, msg: `${(d * 1000).toFixed(0)} ms off the music grid (${bpm} BPM from ${grid} s)` });
    }
  }
  const report = { ok: !issues.length, ...q, texts: texts.length, denseFrames: dense, issues, contrast, still, loop, hits };
  fs.writeFileSync(path.join(out, 'check.json'), JSON.stringify(report, null, 1));
  return report;
}

// subtitles: the captions' phrases and the statements, timed to the voice
function srt(S) {
  const { K, script } = S, items = [];
  for (const c of K._captionList) items.push({ a: c.a, b: c.b, text: c.toks.map(k => k.w).join(' ') });
  for (const L of script.lines) if (L.show === 'statement') { const tl = K.T.line(L.id); items.push({ a: tl.start, b: tl.end + 0.4, text: K.plain(L.text) }); }
  items.sort((x, y) => x.a - y.a);
  const ts = s => { const ms = Math.max(0, Math.round(s * 1000)), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
  return items.map((x, i) => `${i + 1}\n${ts(x.a)} --> ${ts(x.b)}\n${x.text}\n`).join('\n');
}
// after the encode: decode the whole file, count frozen stretches, measure loudness
function afterEncode(file) {
  const r = { decodeErrors: null, frozen: null, lufs: null, truePeak: null };
  const dec = spawnSync(FFMPEG, ['-v', 'error', '-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  r.decodeErrors = (dec.stderr || '').trim() ? (dec.stderr || '').trim().split('\n').length : 0;
  const fz = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-vf', 'freezedetect=n=-60dB:d=0.4', '-map', '0:v', '-f', 'null', '-'], { encoding: 'utf8' });
  r.frozen = ((fz.stderr || '').match(/freeze_start/g) || []).length;
  const ld = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const js = (ld.stderr || '').match(/\{[\s\S]*?\}/g)?.pop(); if (js) { const v = JSON.parse(js); r.lufs = +(+v.input_i).toFixed(1); r.truePeak = +(+v.input_tp).toFixed(1); }
  return r;
}

// ---------------------------------------------------------------- video: frames on worker threads, in order into ffmpeg
// free disk in GB where the film is written. On macOS the system's swap files share the disk, so a render that runs the
// machine out of memory also eats disk; the render stops before the disk fills.
const freeGB = dir => { try { const st = fs.statfsSync(dir); return (st.bavail * st.bsize) / 2 ** 30; } catch { return Infinity; } };
const MIN_FREE_GB = 1.5, STOP_FREE_GB = 1.0;
async function video(S, { fps = 30, from = 0, to = null, workers = 0, debug = false, project, estimate }) {
  const outDir = path.join(project, 'out'); fs.mkdirSync(outDir, { recursive: true });
  if (freeGB(outDir) < MIN_FREE_GB) throw new Error(`only ${freeGB(outDir).toFixed(1)} GB free on the disk: free at least ${MIN_FREE_GB} GB before rendering (on macOS, closing apps also gives back the memory the system borrowed from the disk)`);
  const { F, K, timing, script } = S, dur = timing.duration, t1 = Math.min(dur, to ?? dur), N = Math.max(1, Math.round((t1 - from) * fps));
  // sound first: it is fast, and a bad cue should fail before the long part
  const voice = path.join(project, 'vo', 'voice.wav');
  const audio = buildAudio({ dir: path.join(outDir, 'audio'), duration: dur, voiceWav: timing.estimated ? null : voice, cues: F.cues || [], music: F.music || 'warm', endAt: F.musicEnd ?? (typeof F.music === 'object' ? F.music.end : null) ?? K.T.endCard });
  const name = (script.slug || [script.brand, script.product].filter(Boolean).join('-') || 'explainer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const file = path.join(outDir, `${name}${from > 0 || to != null ? `-${from}-${t1}` : ''}.mp4`);
  const ff = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(fps), '-i', '-',
    '-ss', String(from), '-t', String(t1 - from), '-i', audio.mix, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', file], { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = ''; ff.stderr.on('data', d => { ffErr += d; }); const ffDone = once(ff, 'close');
  // one worker per ~8 GB of memory (each holds a full-size canvas and the film), at most 6
  const memGB = os.totalmem() / 2 ** 30, nW = Math.max(1, workers || Math.min(6, os.cpus().length - 1, memGB <= 8.5 ? 1 : memGB <= 16.5 ? 2 : 6)), t0 = performance.now();
  const diskOk = f => { if (f % 60 === 0 && freeGB(outDir) < STOP_FREE_GB) throw new Error(`stopped at frame ${f}: free disk fell under ${STOP_FREE_GB} GB (the system is swapping). Close apps, then render again with --workers 1.`); };
  const qaAll = { text: [...K.qa.text], upscale: [...K.qa.upscale] };
  const merge = (qa2, evs = []) => { for (const k of ['text', 'upscale']) for (const it of qa2[k] || []) if (!qaAll[k].some(x => x.key === it.key)) qaAll[k].push(it); for (const e of evs) K._events.add(e); };
  const write = async buf => { if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain'); };
  if (nW === 1) {
    for (let f = 0; f < N; f++) {
      diskOk(f); drawFrame(S, from + f / fps, debug); const d = S.g.getImageData(0, 0, W, H).data;
      await write(Buffer.from(d.buffer, d.byteOffset, d.byteLength));
      if (f % 15 === 0) process.stdout.write(`\rframe ${f + 1}/${N}`);
    }
    merge(K.qa);
  } else {
    await new Promise((resolve, reject) => {
      const pool = [], done = new Map(); let next = 0, written = 0, writing = false, finished = 0;
      const fail = e => { pool.forEach(w => w.terminate()); reject(e); };
      const pump = async () => {
        if (writing) return; writing = true;
        while (done.has(written)) { const b = done.get(written); done.delete(written); await write(b); written++; if (written % 15 === 0) process.stdout.write(`\rframe ${written}/${N}`); diskOk(written); }
        writing = false;
        if (written === N) pool.forEach(w => w.postMessage({ type: 'exit' }));   // each worker answers with its QA, then we're done
        else pool.forEach(w => give(w));
      };
      const give = w => { if (w.busy || next >= N || done.size > nW * 3) return; w.busy = true; w.postMessage({ type: 'frame', f: next, t: from + next / fps }); next++; };
      for (let i = 0; i < nW; i++) {
        const w = new Worker(SELF, { workerData: { project, estimate, debug } });
        w.busy = true;
        w.on('message', m => {
          if (m.type === 'ready') { w.busy = false; give(w); }
          else if (m.type === 'frame') { w.busy = false; done.set(m.f, Buffer.from(m.buf.buffer, m.buf.byteOffset, m.buf.byteLength)); give(w); pump().catch(fail); }
          else if (m.type === 'qa') { merge(m.qa, m.events); if (++finished === nW) resolve(); }
          else if (m.type === 'error') fail(new Error(m.error));
        });
        w.on('error', fail);
        pool.push(w);
      }
    });
  }
  ff.stdin.end(); const [code] = await ffDone;
  if (code !== 0) throw new Error('ffmpeg failed: ' + ffErr.trim().split('\n').slice(-3).join(' | '));
  const ms = Math.round((performance.now() - t0) / N), q = qaOf(S);
  // the deliverables next to the MP4: subtitles and a cover (frame 0 is the cover in the feed)
  const base = file.replace(/\.mp4$/, '');
  fs.writeFileSync(base + '.srt', srt(S));
  if (from === 0) { drawFrame(S, 0); fs.writeFileSync(path.join(outDir, 'cover.jpg'), S.canvas.toBuffer('image/jpeg', 92)); }
  const after = afterEncode(file);
  const report = {
    file, srt: base + '.srt', duration: +(t1 - from).toFixed(2), fps, frames: N, workers: nW, msPerFrame: ms, renderSeconds: +((performance.now() - t0) / 1000).toFixed(1),
    ...q, ...after, textOutsideSafeZone: qaAll.text, productUpscaled: qaAll.upscale, audioWarnings: audio.warnings, audioLevels: audio.levels,
  };
  if (after.decodeErrors) report.warnings.push(`${after.decodeErrors} decode errors in the file`);
  if (after.frozen) report.warnings.push(`${after.frozen} frozen stretches of 0.4 s or more`);
  if (after.lufs != null && Math.abs(after.lufs + 14) > 1) report.warnings.push(`loudness ${after.lufs} LUFS, target -14`);
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  return report;
}

// ---------------------------------------------------------------- worker thread
if (!isMainThread) {
  const { project, estimate, debug } = workerData;
  try {
    const S = await setup(project, { estimate });
    parentPort.on('message', m => {
      try {
        if (m.type === 'frame') { drawFrame(S, m.t, debug); const d = S.g.getImageData(0, 0, W, H).data; const buf = new Uint8Array(d.buffer, d.byteOffset, d.byteLength).slice(); parentPort.postMessage({ type: 'frame', f: m.f, buf }, [buf.buffer]); }
        else if (m.type === 'exit') { parentPort.postMessage({ type: 'qa', qa: S.K.qa, events: [...S.K._events] }); setTimeout(() => process.exit(0), 50); }
      } catch (e) { parentPort.postMessage({ type: 'error', error: e.stack || String(e) }); }
    });
    parentPort.postMessage({ type: 'ready' });
  } catch (e) { parentPort.postMessage({ type: 'error', error: e.stack || String(e) }); }
}

// ---------------------------------------------------------------- CLI
else {
  const argv = process.argv.slice(2), VAL = new Set(['fps', 'from', 'to', 'workers', 'crop', 'every', 'step']), pos = [], opts = {};
  for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); opts[k] = VAL.has(k) ? argv[++i] : true; } else pos.push(a); }
  const flag = k => opts[k] === true, opt = (k, d) => (opts[k] != null ? opts[k] : d);
  const [proj, mode = 'sheet', ...rest] = pos;
  if (flag('help')) { console.log(USAGE); process.exit(0); }
  if (!proj) { console.error('[product-explainer] ERROR: no project folder.\n' + USAGE); process.exit(2); }
  const project = path.resolve(proj), estimate = flag('estimate'), debug = flag('debug');
  try {
    if (!['frame', 'sheet', 'contact', 'strip', 'check', 'video'].includes(mode)) throw new UsageError(`unknown mode "${mode}" (frame | sheet | contact | strip | check | video)`);
    const S = await setup(project, { estimate });
    if (mode === 'frame') {
      const dir = path.join(project, 'out', 'frames'); fs.mkdirSync(dir, { recursive: true });
      const times = rest.map(Number).filter(Number.isFinite);
      if (!times.length) throw new UsageError('give one or more times in seconds, e.g. frame 1.5 4');
      const crop = opts.crop ? String(opts.crop).split(',').map(Number) : null;
      for (const t of times) {
        drawFrame(S, t, debug); const f = path.join(dir, `t-${t.toFixed(2)}.png`); fs.writeFileSync(f, S.canvas.toBuffer('image/png')); console.log(f);
        if (crop) { const [x, y, w, h] = crop, c = createCanvas(w, h); c.getContext('2d').drawImage(S.canvas, x, y, w, h, 0, 0, w, h); const fc = f.replace(/\.png$/, `-crop-${x}-${y}.png`); fs.writeFileSync(fc, c.toBuffer('image/png')); console.log(fc); }
      }
      if (S.K.qa.text.length) console.log('text outside the safe zone:', JSON.stringify(S.K.qa.text));
      if (S.K.qa.upscale.length) console.log('product drawn bigger than its photo:', JSON.stringify(S.K.qa.upscale));
    } else if (mode === 'sheet') {
      const r = await sheet(S, debug);
      console.log('sheet  ' + r.file + '\nframes ' + r.frames);
      console.log(JSON.stringify({ ...r.qa, textOutsideSafeZone: r.qaText.text, productUpscaled: r.qaText.upscale }, null, 1));
    } else if (mode === 'contact') {
      const r = await contact(S, { every: +opt('every', 1), debug }); console.log(`contact  ${r.file}  (${r.frames} frames)`);
    } else if (mode === 'strip') {
      const [a, b] = rest.map(Number); if (!Number.isFinite(a) || !Number.isFinite(b)) throw new UsageError('give the action\'s start and end in seconds, e.g. strip 11.0 12.2');
      const r = await strip(S, a, b, { step: +opt('step', 0.2), debug }); console.log(`strip  ${r.file}  (${r.frames} frames)`);
    } else if (mode === 'video') {
      const r = await video(S, { fps: +opt('fps', 30), from: +opt('from', 0), to: opt('to') != null ? +opt('to') : null, workers: +opt('workers', 0), debug, project, estimate });
      console.log('\n' + JSON.stringify(r, null, 1));
    } else if (mode === 'check') {
      const r = await check(S);
      console.log(`${r.ok ? 'PASS' : 'FIX'}  ${r.texts} texts checked (${r.denseFrames} extra frames around fast moves), ${r.contrast.length} contrast samples, ${r.still.length} still-moment pairs, ${r.hits.length} hits on the beat`);
      for (const i of r.issues) console.log(`- [${i.check}] ${i.t != null ? i.t.toFixed(2) + ' s ' : ''}${i.text ? '"' + String(i.text).slice(0, 40) + '" ' : ''}${i.msg}`);
      for (const w of r.warnings) console.log(`- [film] ${w}`);
      console.log(path.join(project, 'out', 'check.json'));
      process.exit(r.ok ? 0 : 1);
    }
    process.exit(0);
  } catch (e) {
    if (e instanceof UsageError) { console.error('[product-explainer] ERROR: ' + e.message + '\n' + USAGE); process.exit(2); }
    console.error('[product-explainer] ERROR: ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n'));
    process.exit(1);
  }
}
