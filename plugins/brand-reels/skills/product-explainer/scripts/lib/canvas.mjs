// canvas.mjs: loads the Skia canvas engine from the plugin's runtime (see runtime/run.sh) and the bundled fonts.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SKILL = path.resolve(HERE, '../..');
const require = createRequire(import.meta.url);

const CANVAS_JS = process.env.CODE_VIDEO_CANVAS_JS || path.resolve(SKILL, '../../runtime/canvas-js/index.js');
if (!process.env.NAPI_RS_NATIVE_LIBRARY_PATH) {
  const root = process.env.CODE_VIDEO_HOME || path.join(os.homedir(), '.code-video');
  const dir = fs.existsSync(root) && fs.readdirSync(root).find(d => d.startsWith('canvas-'));
  const hit = dir && fs.readdirSync(path.join(root, dir)).find(f => f.endsWith('.node'));
  if (hit) process.env.NAPI_RS_NATIVE_LIBRARY_PATH = path.join(root, dir, hit);
}

let lib;
try { lib = require(CANVAS_JS); }
catch (e) {
  console.error('[product-explainer] ERROR: the canvas engine did not load: ' + e.message.split('\n')[0]);
  console.error('[product-explainer] Run scripts through the plugin launcher: bash <plugin>/runtime/run.sh <script> ...');
  process.exit(2);
}
export const { createCanvas, loadImage, GlobalFonts, Path2D, DOMMatrix, DOMPoint, ImageData } = lib;
export const FFMPEG = process.env.CODE_VIDEO_FFMPEG || 'ffmpeg';

// Fonts are named <Family_Name>-<weight>[-italic].ttf; underscores become spaces in the family name.
export function registerFonts(dir) {
  const got = [];
  if (!dir || !fs.existsSync(dir)) return got;
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(ttf|otf)$/i.test(f)) continue;
    const fam = f.replace(/\.(ttf|otf)$/i, '').split('-')[0].replace(/_/g, ' ');
    if (GlobalFonts.registerFromPath(path.join(dir, f), fam)) got.push(f);
  }
  return got;
}
registerFonts(path.join(SKILL, 'assets/fonts'));
