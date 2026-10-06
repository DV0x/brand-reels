#!/usr/bin/env node
// render.mjs: renders a product explainer project (script.json + vo/timing.json + film.mjs + product/*.png).
//   render.mjs <project> frame <t> [<t> ...] [--debug]   one PNG per time, into <project>/out/frames/
//   render.mjs <project> sheet [--debug]                 the contact sheet: one frame per shot, with its voice and on-screen words
//   render.mjs <project> video [--fps 30] [--from a --to b] [--workers n]   the MP4 with sound, plus out/report.json
//   add --estimate to any mode to time the lines from the text when there is no voice yet
// Run it through the plugin's launcher: bash <plugin>/runtime/run.sh render.mjs <project> <mode> ...
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { createCanvas, registerFonts, FFMPEG } from './lib/canvas.mjs';
import { makeKit, W, H, plain } from './lib/kit.mjs';
import { buildAudio } from './lib/audio.mjs';

const SELF = fileURLToPath(import.meta.url);
const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));

// ---------------------------------------------------------------- timing: the voice's, or an estimate from the text
function loadTiming(project, script, estimate) {
  const f = path.join(project, 'vo', 'timing.json');
  if (!estimate && fs.existsSync(f)) return readJSON(f);
  if (!estimate) throw new Error(`no ${f}. Make the voice first (voice.mjs), or add --estimate to time the lines from the text.`);
  const wps = 2.6, lines = []; let t = script.lead ?? 0.4;
  for (const L of script.lines) {
    const words = plain(L.text).split(/\s+/).filter(Boolean), dur = words.length / wps + 0.15, total = words.reduce((s, w) => s + w.length + 1, 0);
    let acc = 0; const ws = words.map(w => { const a = t + (acc / total) * dur; acc += w.length + 1; return { w, start: +a.toFixed(3), end: +(t + (acc / total) * dur - 0.04).toFixed(3) }; });
    lines.push({ id: L.id, text: plain(L.text), start: +t.toFixed(3), end: +(t + dur).toFixed(3), words: ws });
    t += dur + (script.gap ?? 0.35) + (L.pause ?? 0);
  }
  const last = lines[lines.length - 1];
  return { duration: +(last.end + (script.tail ?? 2.6)).toFixed(3), lines, estimated: true };
}

async function setup(project, { estimate = false } = {}) {
  const script = readJSON(path.join(project, 'script.json'));
  const timing = loadTiming(project, script, estimate);
  registerFonts(path.join(project, 'fonts'));
  const K = await makeKit({ project, script, timing });
  const filmFile = path.join(project, 'film.mjs');
  if (!fs.existsSync(filmFile)) throw new Error(`no ${filmFile}. Copy templates/film.mjs from the skill and write the film.`);
  const mod = await import(pathToFileURL(filmFile).href + '?v=' + Date.now());
  const F = mod.default(K);
  if (!F || typeof F.draw !== 'function') throw new Error('film.mjs must `export default function film(K)` that returns { draw(g, t), ... }');
  K._setMotion(F.motion || 'warm'); K._setCaptions(F.captions || {});
  const canvas = createCanvas(W, H), g = canvas.getContext('2d');
  return { project, script, timing, K, F, canvas, g };
}

function drawFrame(S, t, debug = false) {
  const { g, F, K } = S;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none';
  g.fillStyle = F.background || '#F3EBDD'; g.fillRect(0, 0, W, H); g.restore();
  g.save();
  try { F.draw(g, t); } catch (e) { e.message = `film.draw failed at t=${t.toFixed(3)} s: ${e.message}`; throw e; }
  g.restore();
  g.save(); K._look(g, F.look ?? 'paper'); g.restore();
  g.save(); K._captions(g, t); g.restore();
  if (debug) K._debug(g);
}

// ---------------------------------------------------------------- QA from the film's own declarations
function qaOf(S) {
  const { F, K, timing } = S, T = K.T, cues = (F.cues || []).filter(c => c && Number.isFinite(c.t)).sort((a, b) => a.t - b.t);
  const shots = F.shots || [], cuts = shots.filter((s, i) => i > 0 && s.cut !== false).length;
  const events = [...cues.map(c => c.t), ...shots.map(s => s.from), ...K._events].sort((a, b) => a - b), gaps = [];
  const a0 = timing.lines[0]?.start ?? 0, a1 = T.endCard;
  let prev = a0; for (const e of [...events.filter(e => e > a0 && e < a1), a1]) { if (e - prev > 2.2) gaps.push([+prev.toFixed(2), +e.toFixed(2)]); prev = Math.max(prev, e); }
  const statements = S.script.lines.filter(l => l.show === 'statement').length;
  const warnings = [];
  if (cuts > 5) warnings.push(`${cuts} hard cuts: keep it to 5 or fewer and travel the camera between ideas instead`);
  if (gaps.length) warnings.push(`nothing new happens for more than 2.2 s in: ${gaps.map(g => `${g[0]}-${g[1]} s`).join(', ')} (add an action there)`);
  if (statements > 5) warnings.push(`${statements} statements: use 3 to 5`);
  if (timing.estimated) warnings.push('timing is estimated from the text: make the voice before the final render');
  return { duration: timing.duration, shots: shots.length, hardCuts: cuts, cues: cues.length, statements, eventGaps: gaps, warnings };
}

// a quick pass over the whole film at quarter size: it finds every animation start and any text outside the safe zone
function probe(S, fps = 8) {
  const c = createCanvas(W / 4, H / 4), g = c.getContext('2d');
  for (let t = 0; t < S.timing.duration; t += 1 / fps) {
    g.save(); g.scale(0.25, 0.25);
    try { S.F.draw(g, t); } catch (e) { e.message = `film.draw failed at t=${t.toFixed(3)} s: ${e.message}`; throw e; }
    g.restore();
  }
}

// ---------------------------------------------------------------- the contact sheet
function wrapText(g, txt, maxW) { const out = []; let cur = ''; for (const w of txt.split(/\s+/)) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; }
async function sheet(S, debug) {
  const { F, K, script, timing, project } = S, outDir = path.join(project, 'out'), fdir = path.join(outDir, 'frames');
  fs.mkdirSync(fdir, { recursive: true });
  let shots = (F.shots || []).map(s => ({ ...s }));
  if (!shots.length) shots = timing.lines.map(l => ({ name: l.id, from: l.start, to: l.end }));
  shots.forEach((s, i) => { s.to = s.to ?? (shots[i + 1]?.from ?? timing.duration); s.key = s.key ?? Math.max(s.from + 0.2, s.to - 0.35); });
  const n = shots.length, cols = Math.min(5, n), rows = Math.ceil(n / cols), tw = 360, th = 640, M = 44, G = 26, capH = 250, head = 170;
  const SW = M * 2 + cols * tw + (cols - 1) * G, SH = head + rows * (th + capH + G) + M;
  const sc = createCanvas(SW, SH), g = sc.getContext('2d');
  g.fillStyle = '#17161a'; g.fillRect(0, 0, SW, SH);
  probe(S);
  const q = qaOf(S);
  g.fillStyle = '#F3EAD6'; g.font = '700 44px "Jost"'; g.fillText(`${script.brand || ''} ${script.product ? '· ' + script.product : ''}: contact sheet`, M, 70);
  g.fillStyle = '#A79F8E'; g.font = '500 25px "Jost"';
  g.fillText(`${q.duration.toFixed(1)} s · ${n} shots · ${q.hardCuts} hard cuts · ${q.statements} statements · look ${F.look ?? 'paper'} · motion ${F.motion || 'warm'} · music ${F.music || 'warm'}${timing.estimated ? ' · TIMING ESTIMATED (no voice yet)' : ''}`, M, 112);
  if (q.warnings.length) { g.fillStyle = '#E8A33D'; g.font = '500 23px "Jost"'; g.fillText('Check: ' + q.warnings.join(' | ').slice(0, 190), M, 148); }
  const voiceIn = s => timing.lines.filter(l => l.start < s.to && l.end > s.from);
  for (let i = 0; i < n; i++) {
    const s = shots[i], c = i % cols, r = Math.floor(i / cols), x = M + c * (tw + G), y = head + r * (th + capH + G);
    drawFrame(S, s.key, debug);
    fs.writeFileSync(path.join(fdir, `shot-${String(i + 1).padStart(2, '0')}.jpg`), S.canvas.toBuffer('image/jpeg', 90));
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(S.canvas, x, y, tw, th);
    g.fillStyle = '#F3EAD6'; g.font = '700 24px "Jost"'; g.fillText(`${i + 1}  ${s.name || ''}`.slice(0, 30), x, y + th + 34);
    g.fillStyle = '#8F8878'; g.font = '500 19px "Jost"'; g.fillText(`${s.from.toFixed(1)}–${s.to.toFixed(1)} s${s.cut === false ? ' · camera move' : i ? ' · cut' : ''}`, x, y + th + 60);
    let yy = y + th + 92;
    for (const l of voiceIn(s)) {
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

// ---------------------------------------------------------------- video: frames on worker threads, in order into ffmpeg
async function video(S, { fps = 30, from = 0, to = null, workers = 0, debug = false, project, estimate }) {
  const outDir = path.join(project, 'out'); fs.mkdirSync(outDir, { recursive: true });
  const { F, K, timing, script } = S, dur = timing.duration, t1 = Math.min(dur, to ?? dur), N = Math.max(1, Math.round((t1 - from) * fps));
  // sound first: it is fast, and a bad cue should fail before the long part
  const voice = path.join(project, 'vo', 'voice.wav');
  const audio = buildAudio({ dir: path.join(outDir, 'audio'), duration: dur, voiceWav: timing.estimated ? null : voice, cues: F.cues || [], music: F.music || 'warm', endAt: F.musicEnd ?? K.T.endCard });
  const name = (script.slug || [script.brand, script.product].filter(Boolean).join('-') || 'explainer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const file = path.join(outDir, `${name}${from > 0 || to != null ? `-${from}-${t1}` : ''}.mp4`);
  const ff = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(fps), '-i', '-',
    '-ss', String(from), '-t', String(t1 - from), '-i', audio.mix, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', file], { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = ''; ff.stderr.on('data', d => { ffErr += d; }); const ffDone = once(ff, 'close');
  const nW = Math.max(1, workers || Math.min(6, os.cpus().length - 1)), t0 = performance.now();
  const qaAll = { text: [...K.qa.text], upscale: [...K.qa.upscale] };
  const merge = (qa2, evs = []) => { for (const k of ['text', 'upscale']) for (const it of qa2[k] || []) if (!qaAll[k].some(x => x.key === it.key)) qaAll[k].push(it); for (const e of evs) K._events.add(e); };
  const write = async buf => { if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain'); };
  if (nW === 1) {
    for (let f = 0; f < N; f++) {
      drawFrame(S, from + f / fps, debug); const d = S.g.getImageData(0, 0, W, H).data;
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
        while (done.has(written)) { const b = done.get(written); done.delete(written); await write(b); written++; if (written % 15 === 0) process.stdout.write(`\rframe ${written}/${N}`); }
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
  const report = {
    file, duration: +(t1 - from).toFixed(2), fps, frames: N, workers: nW, msPerFrame: ms, renderSeconds: +((performance.now() - t0) / 1000).toFixed(1),
    ...q, textOutsideSafeZone: qaAll.text, productUpscaled: qaAll.upscale, audioWarnings: audio.warnings,
  };
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
  const argv = process.argv.slice(2), VAL = new Set(['fps', 'from', 'to', 'workers']), pos = [], opts = {};
  for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); opts[k] = VAL.has(k) ? argv[++i] : true; } else pos.push(a); }
  const flag = k => opts[k] === true, opt = (k, d) => (opts[k] != null ? opts[k] : d);
  const [proj, mode = 'sheet', ...rest] = pos;
  if (!proj) { console.log('usage: render.mjs <project> frame <t...> | sheet | video [--fps 30] [--from a --to b] [--workers n] [--debug] [--estimate]'); process.exit(1); }
  const project = path.resolve(proj), estimate = flag('estimate'), debug = flag('debug');
  try {
    const S = await setup(project, { estimate });
    if (mode === 'frame') {
      const dir = path.join(project, 'out', 'frames'); fs.mkdirSync(dir, { recursive: true });
      const times = rest.map(Number).filter(Number.isFinite);
      if (!times.length) throw new Error('give one or more times in seconds, e.g. frame 1.5 4');
      for (const t of times) { drawFrame(S, t, debug); const f = path.join(dir, `t-${t.toFixed(2)}.png`); fs.writeFileSync(f, S.canvas.toBuffer('image/png')); console.log(f); }
      if (S.K.qa.text.length) console.log('text outside the safe zone:', JSON.stringify(S.K.qa.text));
      if (S.K.qa.upscale.length) console.log('product drawn bigger than its photo:', JSON.stringify(S.K.qa.upscale));
    } else if (mode === 'sheet') {
      const r = await sheet(S, debug);
      console.log('sheet  ' + r.file + '\nframes ' + r.frames);
      console.log(JSON.stringify({ ...r.qa, textOutsideSafeZone: r.qaText.text, productUpscaled: r.qaText.upscale }, null, 1));
    } else if (mode === 'video') {
      const r = await video(S, { fps: +opt('fps', 30), from: +opt('from', 0), to: opt('to') != null ? +opt('to') : null, workers: +opt('workers', 0), debug, project, estimate });
      console.log('\n' + JSON.stringify(r, null, 1));
    } else throw new Error(`unknown mode "${mode}" (frame | sheet | video)`);
    process.exit(0);
  } catch (e) {
    console.error('[product-explainer] ERROR: ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n'));
    process.exit(1);
  }
}
