// audio.mjs: the film's sound, synthesized in plain JS, then mixed with the voice by ffmpeg and mastered to -14 LUFS.
// Music: a plucked-string bed (Karplus-Strong) in one of three moods that ducks under the voice.
// SFX: one sound per action, from the film's cues: [{ t, sfx, gain, pan, dur, f }].
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { FFMPEG } from './canvas.mjs';

export const SFX_NAMES = ['pop', 'click', 'tick', 'whoosh', 'swish', 'thud', 'stamp', 'paper', 'tape', 'marker', 'flip', 'crinkle', 'chime', 'ding', 'steam', 'door', 'pour', 'sparkle', 'rise', 'snap'];
export const MUSIC_NAMES = ['warm', 'bright', 'calm', 'none'];

export function buildAudio({ dir, duration, voiceWav = null, cues = [], music = 'warm', endAt = null, seed = 11 }) {
  const SR = 48000, len = Math.round(SR * duration), TAU = Math.PI * 2, warnings = [];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), sm = x => x * x * (3 - 2 * x);
  let sd = seed; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const stereo = () => ({ L: new Float32Array(len), R: new Float32Array(len) });
  const MUS = stereo(), SFX = stereo();
  const add = (B, t0, dur, f, pan = 0) => {
    const s0 = Math.floor(t0 * SR), gl = Math.cos(((pan + 1) * Math.PI) / 4), gr = Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < dur * SR; i++) { const j = s0 + i; if (j < 0) continue; if (j >= len) break; const v = f(i / SR, j / SR); B.L[j] += v * gl; B.R[j] += v * gr; }
  };
  const band = (B, t0, dur, lo, hi, gain, pan = 0) => { let a = 0, b = 0; add(B, t0, dur, (t, T) => { const x = rnd() * 2 - 1; a += lo * (x - a); b += hi * (x - b); return (b - a) * gain(t, T); }, pan); };
  const sine = (B, t0, dur, f, g, env, pan = 0) => { let ph = 0; add(B, t0, dur, t => { ph += (typeof f === 'function' ? f(t) : f) / SR; return g * Math.sin(TAU * ph) * env(t); }, pan); };
  // a plucked string: a burst of noise circulating in a delay line that loses its highs on every pass
  const pluck = (B, t0, f, g, { decay = 0.996, bright = 0.5, dur = 2.4, pan = 0 } = {}) => {
    const N = Math.max(2, Math.round(SR / f)), buf = new Float32Array(N); for (let i = 0; i < N; i++) buf[i] = rnd() * 2 - 1;
    let k = 0;
    add(B, t0, dur, t => { const y = buf[k], nx = buf[(k + 1) % N]; buf[k] = decay * (bright * y + (1 - bright) * 0.5 * (y + nx)); k = (k + 1) % N; return g * y * sm(seg(t, 0, 0.003)) * (1 - seg(t, dur - 0.1, dur)); }, pan);
  };

  // ------------------------------------------------ music
  const P = {
    warm: { bpm: 92, root: 146.83, prog: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], pat: [0, 2, 1, 3, 2, 1, 3, 2], bright: 0.5, decay: 0.9965, gain: 0.05, kick: true, shaker: true },
    bright: { bpm: 108, root: 196.0, prog: [[0, 4, 7], [5, 9, 12], [9, 12, 16], [7, 11, 14]], pat: [0, 1, 2, 3, 2, 1, 2, 3], bright: 0.72, decay: 0.993, gain: 0.044, kick: true, shaker: true, clap: true },
    calm: { bpm: 76, root: 130.81, prog: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], pat: [0, 2, 3, 2], bright: 0.42, decay: 0.998, gain: 0.05, pad: true },
  }[music];
  if (music !== 'none' && !P) warnings.push(`unknown music "${music}", using none`);
  if (P) {
    const beat = 60 / P.bpm, bar = beat * 4, stop = endAt ?? duration - 1.5, semis = n => 2 ** (n / 12);
    for (let b = 0; b * bar < stop - 0.1; b++) {
      const chord = P.prog[b % P.prog.length], tones = [...chord, chord[0] + 12], t0 = 0.05 + b * bar, step = bar / P.pat.length;
      P.pat.forEach((ix, i) => { const tt = t0 + i * step; if (tt > stop - 0.05) return; pluck(MUS, tt, P.root * semis(tones[ix]), P.gain * (i % 2 ? 0.78 : 1), { decay: P.decay, bright: P.bright, dur: 2.2, pan: [-0.25, 0.2, -0.1, 0.3][i % 4] }); });
      pluck(MUS, t0, (P.root / 2) * semis(chord[0]), P.gain * 1.25, { decay: 0.9975, bright: 0.22, dur: bar + 0.4, pan: 0 });
      if (P.kick && b >= 1) for (const k of [0, 2]) { const tk = t0 + k * beat; if (tk < stop) sine(MUS, tk, 0.32, t => 48 + 50 * Math.exp(-t * 30), 0.07, t => Math.exp(-t * 12), 0); }
      if (P.shaker && b >= 1) for (let s = 0; s < 8; s++) { const ts = t0 + (s + 0.5) * beat / 2; if (ts < stop) band(MUS, ts, 0.05, 0.25, 0.85, t => 0.016 * Math.exp(-t * 70) * (s % 2 ? 1 : 0.6), 0.25); }
      if (P.clap && b >= 1) for (const k of [1, 3]) { const tc = t0 + k * beat; if (tc < stop) band(MUS, tc, 0.12, 0.08, 0.6, t => 0.05 * Math.exp(-t * 32) * (1 + 0.6 * Math.sin(t * 900)), 0.05); }
      if (P.pad) for (const n of [chord[0], chord[2]]) sine(MUS, t0, bar + 0.6, P.root * semis(n), 0.012, t => sm(seg(t, 0, 0.8)) * (1 - sm(seg(t, bar - 0.2, bar + 0.6))), n % 2 ? 0.3 : -0.3);
    }
    // the ending: the home chord, strummed and left to ring
    const tf = stop + 0.05, home = P.prog[0];
    [...home, home[0] + 12, home[1] + 12].forEach((n, i) => pluck(MUS, tf + i * 0.035, P.root * 2 ** (n / 12), P.gain * 1.05, { decay: 0.999, bright: 0.55, dur: Math.max(0.5, duration - tf), pan: -0.25 + i * 0.12 }));
    pluck(MUS, tf, (P.root / 2) * 2 ** (home[0] / 12), P.gain * 1.3, { decay: 0.9985, bright: 0.2, dur: Math.max(0.5, duration - tf), pan: 0 });
    for (let i = 0; i < len; i++) { const t = i / SR, f = sm(seg(t, 0, 0.4)) * (1 - sm(seg(t, duration - 0.9, duration))); MUS.L[i] *= f; MUS.R[i] *= f; }
  }

  // ------------------------------------------------ sound effects
  const FX = {
    pop: (t0, g, pan) => { sine(SFX, t0, 0.12, t => 820 - 2400 * t, 0.11 * g, t => Math.exp(-t * 38), pan); band(SFX, t0, 0.02, 0.2, 0.9, () => 0.05 * g, pan); },
    click: (t0, g, pan) => band(SFX, t0, 0.025, 0.3, 0.95, t => 0.12 * g * Math.exp(-t * 200), pan),
    snap: (t0, g, pan) => { band(SFX, t0, 0.04, 0.4, 0.97, t => 0.2 * g * Math.exp(-t * 150), pan); sine(SFX, t0, 0.05, 1900, 0.04 * g, t => Math.exp(-t * 90), pan); },
    tick: (t0, g, pan) => { band(SFX, t0, 0.02, 0.5, 0.98, t => 0.09 * g * Math.exp(-t * 260), pan); sine(SFX, t0, 0.03, 3100, 0.025 * g, t => Math.exp(-t * 120), pan); },
    whoosh: (t0, g, pan, dur = 0.5) => { for (let k = 0; k < 6; k++) band(SFX, t0 + (k * dur) / 6, dur / 6 + 0.03, 0.03 + k * 0.01, 0.2 + k * 0.04, t => 0.05 * g * Math.sin(Math.PI * seg(t, 0, dur / 6 + 0.03)) * Math.sin(Math.PI * (k + 0.5) / 6), pan - 0.5 + k * 0.2); },
    swish: (t0, g, pan, dur = 0.35) => FX.whoosh(t0, g * 0.7, pan, dur),
    thud: (t0, g, pan) => { sine(SFX, t0, 0.24, t => 82 - 30 * t, 0.14 * g, t => Math.exp(-t * 20), pan); band(SFX, t0, 0.08, 0.02, 0.15, t => 0.08 * g * Math.exp(-t * 45), pan); },
    stamp: (t0, g, pan) => { sine(SFX, t0, 0.16, 150, 0.12 * g, t => Math.exp(-t * 34) * (1 + 2 * Math.exp(-t * 300)), pan); band(SFX, t0, 0.06, 0.04, 0.3, t => 0.1 * g * Math.exp(-t * 85), pan); band(SFX, t0 + 0.07, 0.07, 0.2, 0.6, t => 0.014 * g * Math.sin(Math.PI * seg(t, 0, 0.07)), pan); },
    paper: (t0, g, pan) => { band(SFX, t0, 0.06, 0.05, 0.6, t => 0.13 * g * Math.exp(-t * 60), pan); sine(SFX, t0, 0.12, 110, 0.06 * g, t => Math.exp(-t * 40), pan); },
    tape: (t0, g, pan) => { band(SFX, t0, 0.18, 0.3, 0.9, t => 0.04 * g * Math.sin(Math.PI * seg(t, 0, 0.18)), pan); add(SFX, t0, 0.18, () => (rnd() < 0.05 ? (rnd() * 2 - 1) * 0.06 * g : 0), pan); },
    marker: (t0, g, pan, dur = 0.4) => { let ph = 0; add(SFX, t0, dur, t => { ph += (1700 + 500 * Math.sin(TAU * 7 * t) + 300 * (rnd() - 0.5)) / SR; return g * 0.009 * Math.sin(TAU * ph) * Math.sin(Math.PI * seg(t, 0, dur)); }, pan); band(SFX, t0, dur, 0.15, 0.6, t => 0.014 * g * Math.sin(Math.PI * seg(t, 0, dur)), pan); },
    flip: (t0, g, pan) => { band(SFX, t0, 0.22, 0.08, 0.5, t => 0.034 * g * Math.sin(Math.PI * seg(t, 0, 0.22)) * (0.6 + 0.4 * Math.sin(TAU * 38 * t)), pan); band(SFX, t0 + 0.2, 0.05, 0.05, 0.3, t => 0.05 * g * Math.exp(-t * 60), pan); },
    crinkle: (t0, g, pan, dur = 0.4) => { add(SFX, t0, dur, t => { const d = Math.sin(Math.PI * seg(t, 0, dur)); return rnd() < 0.014 * d ? (rnd() * 2 - 1) * 0.5 * g * d : 0; }, pan); band(SFX, t0, dur, 0.25, 0.85, t => 0.11 * g * Math.sin(Math.PI * seg(t, 0, dur)), pan); },
    chime: (t0, g, pan, dur, f = 1318.5) => add(SFX, t0, 1.8, t => 0.03 * g * Math.exp(-t * 2.6) * (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 3)), pan),
    ding: (t0, g, pan, dur, f = 1760) => add(SFX, t0, 1.4, t => 0.035 * g * Math.exp(-t * 4) * (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2 * t) * Math.exp(-t * 6) + 0.25 * Math.sin(TAU * f * 3.01 * t) * Math.exp(-t * 9)), pan),
    steam: (t0, g, pan, dur = 2) => band(SFX, t0, dur, 0.35, 0.9, t => 0.008 * g * sm(seg(t, 0, 0.5)) * (1 - sm(seg(t, dur - 0.5, dur))) * (0.8 + 0.2 * Math.sin(TAU * 0.7 * t)), pan),
    door: (t0, g, pan) => { band(SFX, t0, 0.18, 0.01, 0.08, t => 0.22 * g * Math.exp(-t * 18), pan); sine(SFX, t0 + 0.02, 0.2, 64, 0.1 * g, t => Math.exp(-t * 16), pan); band(SFX, t0 + 0.12, 0.6, 0.002, 0.02, t => 0.05 * g * sm(seg(t, 0, 0.1)) * Math.exp(-t * 3), pan); },
    pour: (t0, g, pan, dur = 0.9) => { let a = 0; add(SFX, t0, dur, t => { a += 0.06 * ((rnd() * 2 - 1) - a); return a * 0.5 * g * Math.sin(Math.PI * seg(t, 0, dur)) * (0.7 + 0.3 * Math.sin(TAU * (9 + 5 * Math.sin(t * 5)) * t)); }, pan); },
    sparkle: (t0, g, pan) => [0, 0.07, 0.15].forEach((d, i) => FX.ding(t0 + d, g * (0.6 - i * 0.12), pan + (i - 1) * 0.2, 0, 2093 * (1 + i * 0.26))),
    rise: (t0, g, pan, dur = 0.8) => { sine(SFX, t0, dur, t => 220 + 660 * (t / dur) ** 2, 0.03 * g, t => sm(seg(t, 0, dur * 0.8)) * (1 - seg(t, dur * 0.92, dur)), pan); band(SFX, t0, dur, 0.05, 0.4, t => 0.02 * g * (t / dur) ** 2, pan); },
  };
  for (const c of cues) {
    const fn = FX[c.sfx]; if (!fn) { warnings.push(`unknown sfx "${c.sfx}" at ${(+c.t).toFixed(2)} s (use: ${SFX_NAMES.join(', ')})`); continue; }
    if (!(c.t >= 0 && c.t < duration)) { warnings.push(`sfx "${c.sfx}" at ${c.t} s is outside the film`); continue; }
    fn(c.t, c.gain ?? 1, c.pan ?? 0, c.dur, c.f);
  }
  // a short room on the effects, so they sit in a space
  for (const ch of [SFX.L, SFX.R]) { const wet = new Float32Array(len); for (const D of [1499, 1733, 1913, 2203]) { const b = new Float32Array(D); let j = 0; for (let i = 0; i < len; i++) { const y = b[j]; b[j] = ch[i] + y * 0.68; j = (j + 1) % D; wet[i] += y * 0.25; } } for (let i = 0; i < len; i++) ch[i] += 0.2 * wet[i]; }

  // ------------------------------------------------ stems, mix, master
  const writeWav = (file, chans) => {
    const n = chans[0].length, c = chans.length, pcm = Buffer.alloc(44 + n * 2 * c);
    let peak = 0; for (const ch of chans) for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(ch[i]));
    const g = peak > 0.98 ? 0.98 / peak : 1;
    pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2 * c, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20);
    pcm.writeUInt16LE(c, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2 * c, 28); pcm.writeUInt16LE(2 * c, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(n * 2 * c, 40);
    for (let i = 0; i < n; i++) for (let k = 0; k < c; k++) pcm.writeInt16LE(Math.round(clamp(chans[k][i] * g, -1, 1) * 32767), 44 + (i * c + k) * 2);
    fs.writeFileSync(file, pcm); return file;
  };
  fs.mkdirSync(dir, { recursive: true });
  const fm = writeWav(path.join(dir, 'music.wav'), [MUS.L, MUS.R]), fx = writeWav(path.join(dir, 'sfx.wav'), [SFX.L, SFX.R]), mixed = path.join(dir, 'mix.wav');
  const hasVoice = voiceWav && fs.existsSync(voiceWav);
  const args = hasVoice
    ? ['-i', voiceWav, '-i', fm, '-i', fx, '-filter_complex', [
      `[0]apad=whole_dur=${duration.toFixed(3)},highpass=f=75,acompressor=threshold=0.12:ratio=2.5:attack=5:release=120:makeup=1.3,pan=stereo|c0=c0|c1=c0,asplit=2[vo][key]`,
      '[1]volume=-4dB[m0]', '[m0][key]sidechaincompress=threshold=0.03:ratio=5:attack=25:release=380[m]', '[2]volume=1dB[s]',
      '[vo][m][s]amix=inputs=3:normalize=0:duration=longest,alimiter=limit=0.89:level=false,loudnorm=I=-14:TP=-1.5:LRA=9[a]'].join(';')]
    : ['-i', fm, '-i', fx, '-filter_complex', '[0]volume=-2dB[m];[1]volume=1dB[s];[m][s]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.89:level=false,loudnorm=I=-14:TP=-1.5:LRA=9[a]'];
  // pass 1: mix; pass 2: measure and normalise to -14 LUFS (two-pass loudnorm lands within a fraction of a dB)
  const pre = path.join(dir, 'premix.wav');
  const r = spawnSync(FFMPEG, ['-v', 'error', '-y', ...args.map(a => (typeof a === 'string' ? a.replace(',loudnorm=I=-14:TP=-1.5:LRA=9[a]', '[a]') : a)), '-map', '[a]', '-ar', '48000', '-ac', '2', '-t', duration.toFixed(3), pre], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('audio mix failed: ' + (r.stderr || '').trim().split('\n').slice(-3).join(' | '));
  const m = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', pre, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const js = (m.stderr || '').match(/\{[\s\S]*?\}/g)?.pop();
  let filter = 'loudnorm=I=-14:TP=-1.5:LRA=9';
  if (js) { const v = JSON.parse(js); filter = `loudnorm=I=-14:TP=-1.5:LRA=9:measured_I=${v.input_i}:measured_TP=${v.input_tp}:measured_LRA=${v.input_lra}:measured_thresh=${v.input_thresh}:offset=${v.target_offset}:linear=true`; }
  const r2 = spawnSync(FFMPEG, ['-v', 'error', '-y', '-i', pre, '-af', filter, '-ar', '48000', '-ac', '2', mixed], { encoding: 'utf8' });
  if (r2.status !== 0) throw new Error('loudness pass failed: ' + (r2.stderr || '').trim().split('\n').slice(-3).join(' | '));
  return { mix: mixed, warnings };
}

// 16-bit PCM WAV -> Float32 mono (first channel)
export function readWav(file) {
  const b = fs.readFileSync(file); let o = 12, ch = 1, sr = 48000;
  while (o < b.length - 8) {
    const id = b.toString('ascii', o, o + 4), sz = b.readUInt32LE(o + 4);
    if (id === 'fmt ') { ch = b.readUInt16LE(o + 10); sr = b.readUInt32LE(o + 12); }
    if (id === 'data') { const n = Math.floor(sz / 2 / ch), out = new Float32Array(n); for (let i = 0; i < n; i++) out[i] = b.readInt16LE(o + 8 + i * 2 * ch) / 32768; return { data: out, sr }; }
    o += 8 + sz + (sz & 1);
  }
  throw new Error('no audio data in ' + file);
}
export function writeMonoWav(file, data, sr = 48000) {
  const pcm = Buffer.alloc(44 + data.length * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + data.length * 2, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(sr, 24); pcm.writeUInt32LE(sr * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(file, pcm);
}
