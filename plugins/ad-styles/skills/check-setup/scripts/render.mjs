#!/usr/bin/env node
// Browser-free render smoke test.
// Draws a 3 s 1080×1920 comic-print clip with @napi-rs/canvas (Skia), synthesizes its sound in plain JS,
// and pipes raw frames + a WAV into ffmpeg. No browser, no network, no image generation.
// Usage: bash ../../../runtime/run.sh render.mjs [--out DIR] [--seconds 3] [--fps 30]
//   (Windows: powershell -NoProfile -ExecutionPolicy Bypass -File ..\..\..\runtime\run.ps1 render.mjs [...])
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(HERE, '..');
const require = createRequire(import.meta.url);

// ---------- args ----------
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const OUT = path.resolve(arg('out', process.cwd()));
const SECONDS = +arg('seconds', 3), FPS = +arg('fps', 30);
const W = 1080, H = 1920, N = Math.round(SECONDS * FPS);
fs.mkdirSync(OUT, { recursive: true });

const report = {
  ok: false, started: new Date().toISOString(),
  where: { platform: process.platform, arch: process.arch, node: process.version, cpus: os.cpus().length, glibc: process.report?.getReport?.().header?.glibcVersionRuntime ?? null },
  canvas: null, features: {}, ffmpeg: null, encoder: null, frames: N, size: `${W}x${H}`, fps: FPS,
  msPerFrame: null, totalSeconds: null, outputs: [], errors: [],
};
const done = code => {
  report.finished = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, 'smoke-report.json'), JSON.stringify(report, null, 2));
  report.outputs.push(path.join(OUT, 'smoke-report.json'));
  console.log('\n' + (report.ok ? 'PASS' : 'FAIL') + ` · rendered on ${report.where.platform}-${report.where.arch} · node ${report.where.node}`);
  if (report.msPerFrame) console.log(`${N} frames at ${report.msPerFrame} ms/frame · total ${report.totalSeconds} s · encoder ${report.encoder}`);
  for (const o of report.outputs) console.log('  ' + o);
  for (const e of report.errors) console.log('  error: ' + e);
  process.exit(code);
};

// ---------- canvas: JS from the plugin's runtime/, native Skia binary from the ~/.code-video cache (see runtime/run.sh) ----------
const CANVAS_JS = process.env.CODE_VIDEO_CANVAS_JS || path.resolve(HERE, '../../../runtime/canvas-js/index.js');
if (!process.env.NAPI_RS_NATIVE_LIBRARY_PATH) {
  const cache = path.join(process.env.CODE_VIDEO_HOME || path.join(os.homedir(), '.code-video'), 'canvas-1.0.9');
  const hit = fs.existsSync(cache) && fs.readdirSync(cache).find(f => f.endsWith('.node'));
  if (hit) process.env.NAPI_RS_NATIVE_LIBRARY_PATH = path.join(cache, hit);
}
report.runtime = { node: process.execPath, ffmpeg: process.env.CODE_VIDEO_FFMPEG || 'ffmpeg (PATH)', canvasBinary: process.env.NAPI_RS_NATIVE_LIBRARY_PATH || null };
let createCanvas, GlobalFonts;
try {
  ({ createCanvas, GlobalFonts } = require(CANVAS_JS));
  report.canvas = '@napi-rs/canvas ' + require(path.join(path.dirname(CANVAS_JS), 'package.json')).version;
} catch (e) {
  report.errors.push('canvas failed to load: ' + e.message.split('\n')[0]);
  report.errors.push('run it through runtime/run.sh (macOS/Linux) or runtime/run.ps1 (Windows) so the canvas engine gets set up');
  done(2);
}
const FONTS = path.join(SKILL, 'assets/fonts');
report.features.fontDisplay = GlobalFonts.registerFromPath(path.join(FONTS, 'Bangers.ttf'), 'Bangers') != null;
report.features.fontMono = GlobalFonts.registerFromPath(path.join(FONTS, 'JetBrainsMono.ttf'), 'JetBrains Mono') != null;

// ---------- ffmpeg ----------
const FFMPEG = process.env.CODE_VIDEO_FFMPEG || 'ffmpeg';
const ffv = spawnSync(FFMPEG, ['-version'], { encoding: 'utf8' });
if (ffv.status === 0) {
  report.ffmpeg = ffv.stdout.split('\n')[0].replace('ffmpeg version ', '').split(' ')[0];
  const enc = spawnSync(FFMPEG, ['-hide_banner', '-encoders'], { encoding: 'utf8' }).stdout || '';
  report.encoder = / libx264 /.test(enc) ? 'libx264' : 'mpeg4';
}

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const backOut = (x, s = 1.9) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const twos = t => Math.floor(t * 12) / 12;
const INK = { paper: '#F2EEE3', ink: '#16121F', pink: '#FF3D8B', pinkDk: '#D92A72', yellow: '#FFD23F', cyan: '#19C6E6', orange: '#FF570A' };

const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
const layer = () => createCanvas(W, H);

// feature probes (what the real style kits rely on)
for (const m of ['multiply', 'screen', 'lighter', 'destination-in', 'destination-out', 'source-atop', 'difference']) {
  ctx.globalCompositeOperation = m; report.features['composite:' + m] = ctx.globalCompositeOperation === m;
}
ctx.globalCompositeOperation = 'source-over';
try { ctx.filter = 'grayscale(1)'; report.features.filter = ctx.filter === 'grayscale(1)'; ctx.filter = 'none'; } catch { report.features.filter = false; }
report.features.gradient = typeof ctx.createRadialGradient === 'function';
report.features.imageData = typeof ctx.getImageData === 'function';

// ---------- prebuilt layers: halftone background, grain ----------
const BG = layer(); {
  const c = BG.getContext('2d');
  c.fillStyle = INK.pink; c.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.42, sp = 34;
  c.fillStyle = INK.pinkDk;
  for (let y = -sp; y < H + sp; y += sp * 0.866) for (let x = -sp, row = Math.round(y / sp); x < W + sp; x += sp) {
    const px = x + (row % 2) * sp / 2, k = clamp((Math.hypot(px - cx, y - cy) - 260) / 900);
    if (k > 0.02) { c.beginPath(); c.arc(px, y, k * sp * 0.48, 0, Math.PI * 2); c.fill(); }
  }
}
const GRAIN = layer(); {
  const c = GRAIN.getContext('2d'), id = c.createImageData(W, H), d = id.data, r = rng(7);
  for (let i = 0; i < d.length; i += 4) { const v = 255 - (r() < 0.45 ? r() * r() * 46 : 0); d[i] = v; d[i + 1] = v - 3; d[i + 2] = v - 7; d[i + 3] = 255; }
  c.putImageData(id, 0, 0);
}
const L0 = layer(), CH = [layer(), layer(), layer()];

// colour-plate misregistration of what's already drawn (the comic "hit" look)
function misreg(px) {
  if (px < 0.5) return;
  const l = L0.getContext('2d'); l.clearRect(0, 0, W, H); l.drawImage(canvas, 0, 0);
  ['#FF0000', '#00FF00', '#0000FF'].forEach((col, i) => {
    const c = CH[i].getContext('2d');
    c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H); c.drawImage(L0, 0, 0);
    c.globalCompositeOperation = 'multiply'; c.fillStyle = col; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'destination-in'; c.drawImage(L0, 0, 0);
    c.globalCompositeOperation = 'source-over';
  });
  ctx.save(); ctx.fillStyle = INK.ink; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(CH[0], -px, 0); ctx.drawImage(CH[1], 0, 0); ctx.drawImage(CH[2], px, 0); ctx.restore();
}

// boiling ink outline: point list wobbles on twos
function inkPath(pts, t, amp = 3, seed = 1) {
  const b = Math.floor(t * 12);
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const jx = (hash(b * 31 + i * 7 + seed) - 0.5) * amp * 2, jy = (hash(b * 17 + i * 13 + seed) - 0.5) * amp * 2;
    i ? ctx.lineTo(x + jx, y + jy) : ctx.moveTo(x + jx, y + jy);
  });
  ctx.closePath();
}

// hero word with stroke + hard extrude + scale punch
function word(s, x, y, size, color, age) {
  if (age < 0) return;
  const k = backOut(clamp(age / 0.18)), sc = 1.55 - 0.55 * k;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(-0.03);
  ctx.font = `${size}px Bangers`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.fillStyle = INK.ink; ctx.fillText(s, 14, 16);
  ctx.lineWidth = size * 0.075; ctx.strokeStyle = INK.ink; ctx.strokeText(s, 0, 0);
  ctx.fillStyle = color; ctx.fillText(s, 0, 0);
  ctx.restore();
}

const HITS = [0.10, 0.45, 0.80, 1.20], KAPOW = 1.70, CARD = 2.05;
const WORDS = [['THIS', 430, 250, INK.paper], ['AD', 670, 330, INK.paper], ['IS', 900, 250, INK.paper], ['CODE.', 1160, 350, INK.yellow]];
const where = `${process.platform}-${process.arch}`;

function drawFrame(t, fi) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(BG, 0, 0);

  // sunburst rays, turning on twos
  ctx.save(); ctx.translate(W / 2, H * 0.42); ctx.rotate(twos(t) * 0.25); ctx.fillStyle = 'rgba(255,210,63,0.22)';
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1500, a, a + Math.PI / 28); ctx.closePath(); ctx.fill(); }
  ctx.restore();

  // KAPOW burst behind the type
  const ka = t - KAPOW;
  if (ka >= 0) {
    const k = backOut(clamp(ka / 0.22), 2.4), cx = 800, cy = 1410, R = 220 * k, n = 18, pts = [];
    for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - 0.3, r = i % 2 ? R * 0.62 : R * (0.95 + 0.12 * hash(i)); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    inkPath(pts, t, 4, 3); ctx.fillStyle = INK.yellow; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = INK.orange;
    for (let y = cy - R; y < cy + R; y += 26) for (let x = cx - R; x < cx + R; x += 26) { const d = Math.hypot(x - cx, y - cy) / R; if (d > 0.35) { ctx.beginPath(); ctx.arc(x, y, 11 * d, 0, Math.PI * 2); ctx.fill(); } }
    ctx.restore();
    inkPath(pts, t, 4, 3); ctx.lineWidth = 12; ctx.strokeStyle = INK.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.12); ctx.scale(k, k);
    ctx.font = '108px Bangers'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 12; ctx.strokeStyle = INK.ink;
    ctx.strokeText('KAPOW!', 0, 0); ctx.fillStyle = INK.paper; ctx.fillText('KAPOW!', 0, 0); ctx.restore();
  }

  // hero stack
  WORDS.forEach(([s, y, size, col], i) => word(s, W / 2, y, size, col, t - HITS[i]));

  // proof card: where this frame was rendered
  const ca = seg(t, CARD, CARD + 0.3);
  if (ca > 0) {
    const y = 1700 + (1 - backOut(ca)) * 400;
    ctx.save(); ctx.translate(W / 2, y); ctx.rotate(-0.025);
    ctx.fillStyle = INK.ink; ctx.fillRect(-440 + 12, -120 + 14, 880, 240);
    ctx.fillStyle = INK.paper; ctx.fillRect(-440, -120, 880, 240); ctx.lineWidth = 6; ctx.strokeStyle = INK.ink; ctx.strokeRect(-440, -120, 880, 240);
    ctx.font = '36px "JetBrains Mono"'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK.ink;
    ctx.fillText(`rendered on: ${where}`, -400, -70);
    ctx.fillText(`node ${process.version} · ffmpeg ${report.ffmpeg ?? 'n/a'}`, -400, -18);
    ctx.fillText('no browser · no image gen · no network', -400, 34);
    ctx.fillStyle = INK.orange; ctx.fillText(`frame ${String(fi + 1).padStart(3, '0')} / ${N}`, -400, 86);
    ctx.restore();
  }

  // print treatment: static grain, then misregistration on hits
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(GRAIN, 0, 0); ctx.restore();
  const last = [...HITS, KAPOW].filter(h => t >= h).pop();
  if (last != null) misreg(14 * clamp(1 - (t - last) / 0.13));
}

// ---------- sound: pure-JS synth → WAV (thud per word, burst on KAPOW, ding on card) ----------
function writeWav(file) {
  const SR = 48000, len = Math.ceil(SECONDS * SR), buf = new Float32Array(len), r = rng(11);
  const thud = (t0, g = 0.9) => { for (let i = 0; i < SR * 0.35; i++) { const t = i / SR, j = Math.floor(t0 * SR) + i; if (j >= len) break; const f = 45 + 110 * Math.exp(-t * 28); buf[j] += g * Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 11) + g * 0.35 * (r() * 2 - 1) * Math.exp(-t * 90); } };
  const burst = t0 => { let lp = 0; for (let i = 0; i < SR * 0.6; i++) { const t = i / SR, j = Math.floor(t0 * SR) + i; if (j >= len) break; lp += (r() * 2 - 1 - lp) * 0.25; buf[j] += 0.8 * lp * Math.exp(-t * 6); } thud(t0, 1); };
  const ding = t0 => { for (let i = 0; i < SR * 0.9; i++) { const t = i / SR, j = Math.floor(t0 * SR) + i; if (j >= len) break; buf[j] += 0.25 * (Math.sin(2 * Math.PI * 1318.5 * t) + 0.5 * Math.sin(2 * Math.PI * 2637 * t)) * Math.exp(-t * 5); } };
  HITS.forEach(h => thud(h)); burst(KAPOW); ding(CARD);
  const pcm = Buffer.alloc(44 + len * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + len * 2, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12);
  pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34);
  pcm.write('data', 36); pcm.writeUInt32LE(len * 2, 40);
  for (let i = 0; i < len; i++) pcm.writeInt16LE(Math.round(clamp(Math.tanh(buf[i]), -1, 1) * 32000), 44 + i * 2);
  fs.writeFileSync(file, pcm);
}

// ---------- render ----------
const t0 = performance.now();
try {
  // contact sheet first (4 frames, quarter size) so there is something to look at even if encoding fails
  const sheet = createCanvas(W, 480), sc = sheet.getContext('2d');
  [0.3, 1.0, 1.9, 2.8].forEach((t, i) => { drawFrame(t, Math.round(t * FPS)); sc.drawImage(canvas, i * 270, 0, 270, 480); });
  fs.writeFileSync(path.join(OUT, 'smoke-contact-sheet.png'), sheet.toBuffer('image/png'));
  report.outputs.push(path.join(OUT, 'smoke-contact-sheet.png'));

  if (!report.ffmpeg) {
    report.errors.push('ffmpeg not found: saved PNG frames instead of an MP4');
    const dir = path.join(OUT, 'smoke-frames'); fs.mkdirSync(dir, { recursive: true });
    const tr = performance.now();
    for (let f = 0; f < N; f += 3) { drawFrame(f / FPS, f); fs.writeFileSync(path.join(dir, `f${String(f).padStart(3, '0')}.png`), canvas.toBuffer('image/png')); }
    report.msPerFrame = Math.round((performance.now() - tr) / Math.ceil(N / 3));
    report.outputs.push(dir);
    report.totalSeconds = +((performance.now() - t0) / 1000).toFixed(1);
    done(1);
  }

  const wav = path.join(OUT, '.smoke-audio.wav'); writeWav(wav);
  const mp4 = path.join(OUT, 'smoke-test.mp4');
  const venc = report.encoder === 'libx264' ? ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20'] : ['-c:v', 'mpeg4', '-q:v', '2'];
  const ff = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-i', wav, '-map', '0:v', '-map', '1:a', ...venc, '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = ''; ff.stderr.on('data', d => { ffErr += d; });
  const ffDone = once(ff, 'close');

  const tr = performance.now();
  for (let f = 0; f < N; f++) {
    drawFrame(f / FPS, f);
    const d = ctx.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(d.buffer, d.byteOffset, d.byteLength))) await once(ff.stdin, 'drain');
    if (f % 15 === 0) process.stdout.write(`\rframe ${f + 1}/${N}`);
  }
  ff.stdin.end();
  const [code] = await ffDone;
  report.msPerFrame = Math.round((performance.now() - tr) / N);
  fs.rmSync(wav, { force: true });
  if (code !== 0) { report.errors.push('ffmpeg failed: ' + ffErr.trim().split('\n').slice(-3).join(' | ')); report.totalSeconds = +((performance.now() - t0) / 1000).toFixed(1); done(1); }
  report.outputs.push(mp4);
  report.ok = true;
} catch (e) {
  report.errors.push(e.stack?.split('\n').slice(0, 3).join(' | ') ?? String(e));
}
report.totalSeconds = +((performance.now() - t0) / 1000).toFixed(1);
done(report.ok ? 0 : 1);
