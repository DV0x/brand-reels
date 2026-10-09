#!/usr/bin/env bash
# Code-video runtime for macOS and Linux (Windows: run.ps1). Makes sure Node.js, ffmpeg and the canvas engine are
# available, then runs a script with them. The first run on a machine downloads portable copies into ~/.code-video.
# It needs no Homebrew and no admin rights, and every download is checked against a pinned SHA-256. Later runs, and
# every style skill, reuse that cache.
#
#   bash run.sh <script.mjs> [args...]   set up if needed, then run the script
#   bash run.sh --setup-only             set up and print what will be used
#
# Env: CODE_VIDEO_HOME (cache dir, default ~/.code-video) · CODE_VIDEO_FORCE_PORTABLE=1 (ignore system node/ffmpeg)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Git Bash / MSYS / Cygwin on Windows: hand over to the PowerShell launcher with the same arguments.
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    ps1="$HERE/run.ps1"; command -v cygpath >/dev/null && ps1="$(cygpath -w "$ps1")"
    exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$ps1" "$@" ;;
esac

ROOT="${CODE_VIDEO_HOME:-$HOME/.code-video}"
NODE_VER=22.23.3
FFMPEG_TAG=b6.1.1
CANVAS_VER=1.0.9

log() { echo "[code-video] $*" >&2; }
die() { log "ERROR: $1"; exit "${2:-1}"; }

# ---------- platform + pinned downloads ----------
case "$(uname -s)-$(uname -m)" in
  Darwin-arm64)
    PLAT=darwin-arm64; NODE_EXT=tar.xz; CANVAS_PLAT=darwin-arm64
    NODE_SHA=72d5d8832b41c9d9646197af614ffd751406ea4d215060eb91b98864e1919a3e
    FFMPEG_SHA=8923876afa8db5585022d7860ec7e589af192f441c56793971276d450ed3bbfa
    CANVAS_SHA=12b318615c9a86933b5df4999cef16a1f67d72fdfee2b2d05f82a51d9a537b7b ;;
  Darwin-x86_64)
    PLAT=darwin-x64; NODE_EXT=tar.xz; CANVAS_PLAT=darwin-x64
    NODE_SHA=ac41874c3352937119cfec39e1a98c578fe58ce8a86d7e785b89a4706015f305
    FFMPEG_SHA=929b375c1182d956c51f7ac25e0b2b0411fb01f6f407aa15c9758efeb4242106
    CANVAS_SHA=1a5de05040dfdc24998895b1d2d8b554e42a939a8021e7955cf37fe4deace800 ;;
  Linux-aarch64|Linux-arm64)
    PLAT=linux-arm64; NODE_EXT=tar.gz; CANVAS_PLAT=linux-arm64-gnu
    NODE_SHA=5ced2d48d1d7198739b7f86804de0171aefb6823b684b12341d3321afc3cb0b2
    FFMPEG_SHA=754a678672298bc68156adff58aa7385a592c2b30b1d0ae8750c45c915c4bac0
    CANVAS_SHA=9d00b41abd35aca69b8c1c84ba076102a676a0b5f5ee958ef5d9d597face6798 ;;
  Linux-x86_64)
    PLAT=linux-x64; NODE_EXT=tar.gz; CANVAS_PLAT=linux-x64-gnu
    NODE_SHA=1084aa36196bba4c3a5e69a1ee388a6e4ff729dad09445fbcd434b28fe3c24af
    FFMPEG_SHA=bfe8a8fc511530457b528c48d77b5737527b504a3797a9bc4866aeca69c2dffa
    CANVAS_SHA=5f61c05860e78096582c5b2cfde652916c5019b87713dfc4b79f7aa1f9fff415 ;;
  *) die "unsupported platform $(uname -s)-$(uname -m). Supported: macOS (Apple Silicon or Intel) and Linux (arm64/x64)." 3 ;;
esac
if [ "${PLAT%%-*}" = linux ] && ldd --version 2>&1 | grep -qi musl; then die "musl Linux (e.g. Alpine) is not supported; use a glibc distro." 3; fi

NODE_URL="https://nodejs.org/dist/v$NODE_VER/node-v$NODE_VER-$PLAT.$NODE_EXT"
FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/$FFMPEG_TAG/ffmpeg-$PLAT.gz"
CANVAS_URL="https://registry.npmjs.org/@napi-rs/canvas-$CANVAS_PLAT/-/canvas-$CANVAS_PLAT-$CANVAS_VER.tgz"

sha256() { if command -v sha256sum >/dev/null; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi; }

# fetch URL SHA DEST: download to a temp file, verify, then move into place
fetch() {
  local url="$1" want="$2" dest="$3" tmp="$3.part.$$"
  mkdir -p "$(dirname "$dest")"
  log "downloading $(basename "$url") (one-time) ..."
  if command -v curl >/dev/null; then curl -fsSL --retry 3 --connect-timeout 20 -o "$tmp" "$url" || { rm -f "$tmp"; die "download failed: $url (no internet, or the network blocks it)" 4; }
  elif command -v wget >/dev/null; then wget -q -O "$tmp" "$url" || { rm -f "$tmp"; die "download failed: $url" 4; }
  else die "need curl or wget to download $url" 4; fi
  local got; got="$(sha256 "$tmp")"
  [ "$got" = "$want" ] || { rm -f "$tmp"; die "checksum mismatch for $url (expected $want, got $got). Not using it." 5; }
  mv "$tmp" "$dest"
}

mkdir -p "$ROOT"

# ---------- Node.js (system if >= 18, else portable) ----------
NODE=""
if [ "${CODE_VIDEO_FORCE_PORTABLE:-0}" != 1 ] && command -v node >/dev/null; then
  major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  [ "$major" -ge 18 ] 2>/dev/null && NODE="$(command -v node)"
fi
if [ -z "$NODE" ]; then
  NODE="$ROOT/node-$NODE_VER/bin/node"
  if [ ! -x "$NODE" ]; then
    arc="$ROOT/dl/node.$NODE_EXT"; fetch "$NODE_URL" "$NODE_SHA" "$arc"
    stage="$ROOT/dl/node-stage.$$"; mkdir -p "$stage"
    # only bin/node is needed (npm and headers are not)
    tar -xf "$arc" -C "$stage" "node-v$NODE_VER-$PLAT/bin/node" || die "could not unpack Node.js"
    mkdir -p "$ROOT/node-$NODE_VER/bin"; mv "$stage/node-v$NODE_VER-$PLAT/bin/node" "$NODE"; rm -rf "$stage" "$arc"
    log "Node.js $NODE_VER ready"
  fi
fi

# ---------- ffmpeg (system if it has libx264, else portable) ----------
FFMPEG=""
if [ "${CODE_VIDEO_FORCE_PORTABLE:-0}" != 1 ] && command -v ffmpeg >/dev/null && ffmpeg -hide_banner -encoders 2>/dev/null | grep -q ' libx264 '; then
  FFMPEG="$(command -v ffmpeg)"
fi
if [ -z "$FFMPEG" ]; then
  FFMPEG="$ROOT/ffmpeg-$FFMPEG_TAG/ffmpeg"
  if [ ! -x "$FFMPEG" ]; then
    gz="$ROOT/dl/ffmpeg.gz"; fetch "$FFMPEG_URL" "$FFMPEG_SHA" "$gz"
    mkdir -p "$(dirname "$FFMPEG")"; gzip -dc "$gz" > "$FFMPEG.tmp.$$" && chmod +x "$FFMPEG.tmp.$$" && mv "$FFMPEG.tmp.$$" "$FFMPEG"; rm -f "$gz"
    log "ffmpeg ($FFMPEG_TAG) ready"
  fi
fi

# ---------- canvas engine (Skia native binary for this platform) ----------
CANVAS_NODE="$ROOT/canvas-$CANVAS_VER/skia.$CANVAS_PLAT.node"
if [ ! -f "$CANVAS_NODE" ]; then
  tgz="$ROOT/dl/canvas.tgz"; fetch "$CANVAS_URL" "$CANVAS_SHA" "$tgz"
  stage="$ROOT/dl/canvas-stage.$$"; mkdir -p "$stage"
  tar -xzf "$tgz" -C "$stage" "package/skia.$CANVAS_PLAT.node" || die "could not unpack the canvas engine"
  mkdir -p "$(dirname "$CANVAS_NODE")"; mv "$stage/package/skia.$CANVAS_PLAT.node" "$CANVAS_NODE"; rm -rf "$stage" "$tgz"
  log "canvas engine $CANVAS_VER ready"
fi
rmdir "$ROOT/dl" 2>/dev/null || true

export CODE_VIDEO_NODE="$NODE" CODE_VIDEO_FFMPEG="$FFMPEG" CODE_VIDEO_CANVAS_JS="$HERE/canvas-js/index.js" NAPI_RS_NATIVE_LIBRARY_PATH="$CANVAS_NODE"

if [ "${1:-}" = "--setup-only" ] || [ $# -eq 0 ]; then
  echo "READY · $PLAT"
  echo "  node:   $NODE ($("$NODE" -v))"
  echo "  ffmpeg: $FFMPEG"
  echo "  canvas: $CANVAS_NODE"
  echo "  cache:  $ROOT ($(du -sh "$ROOT" 2>/dev/null | cut -f1))"
  exit 0
fi
exec "$NODE" "$@"
