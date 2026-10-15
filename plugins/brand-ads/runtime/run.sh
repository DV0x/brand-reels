#!/usr/bin/env bash
# Runtime for brand-ads on macOS and Linux (Windows: run.ps1). Makes sure Node.js 18 or newer is available, then runs a
# script with it. It uses the computer's own Node when it is new enough; otherwise the first run downloads a portable
# copy into ~/.code-video, checked against a pinned SHA-256 (the same pins and cache as Brand Reels' launcher, so a
# computer that has Brand Reels downloads nothing). It needs no Homebrew and no admin rights.
#
#   bash run.sh <script.mjs> [args...]   set up if needed, then run the script
#   bash run.sh --setup-only             set up and print what will be used
#
# Env: CODE_VIDEO_HOME (cache dir, default ~/.code-video) · CODE_VIDEO_FORCE_PORTABLE=1 (ignore the system node)
# Exit codes: 1 general · 3 unsupported platform · 4 download failed · 5 checksum mismatch
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

log() { echo "[brand-ads] $*" >&2; }
die() { log "ERROR: $1"; exit "${2:-1}"; }

# ---------- platform + pinned download ----------
case "$(uname -s)-$(uname -m)" in
  Darwin-arm64)              PLAT=darwin-arm64; NODE_EXT=tar.xz; NODE_SHA=72d5d8832b41c9d9646197af614ffd751406ea4d215060eb91b98864e1919a3e ;;
  Darwin-x86_64)             PLAT=darwin-x64;   NODE_EXT=tar.xz; NODE_SHA=ac41874c3352937119cfec39e1a98c578fe58ce8a86d7e785b89a4706015f305 ;;
  Linux-aarch64|Linux-arm64) PLAT=linux-arm64;  NODE_EXT=tar.gz; NODE_SHA=5ced2d48d1d7198739b7f86804de0171aefb6823b684b12341d3321afc3cb0b2 ;;
  Linux-x86_64)              PLAT=linux-x64;    NODE_EXT=tar.gz; NODE_SHA=1084aa36196bba4c3a5e69a1ee388a6e4ff729dad09445fbcd434b28fe3c24af ;;
  *) die "unsupported platform $(uname -s)-$(uname -m). Supported: macOS (Apple Silicon or Intel) and Linux (arm64/x64)." 3 ;;
esac
if [ "${PLAT%%-*}" = linux ] && ldd --version 2>&1 | grep -qi musl; then die "musl Linux (e.g. Alpine) is not supported; use a glibc distro." 3; fi

NODE_URL="https://nodejs.org/dist/v$NODE_VER/node-v$NODE_VER-$PLAT.$NODE_EXT"

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
rmdir "$ROOT/dl" 2>/dev/null || true

if [ "${1:-}" = "--setup-only" ] || [ $# -eq 0 ]; then
  echo "READY · $PLAT"
  echo "  node:   $NODE ($("$NODE" -v))"
  echo "  cache:  $ROOT"
  exit 0
fi
exec "$NODE" "$@"
