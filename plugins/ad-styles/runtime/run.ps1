# Code-video runtime for Windows (Windows PowerShell 5.1 and PowerShell 7). Mirrors run.sh.
# Makes sure Node.js, ffmpeg and the canvas engine are available, then runs a script with them. The first run on a
# computer downloads portable copies into %USERPROFILE%\.code-video. It needs no admin rights, and every download is
# checked against a pinned SHA-256. Later runs, and every style skill, reuse that cache.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File run.ps1 <script.mjs> [args...]
#   powershell -NoProfile -ExecutionPolicy Bypass -File run.ps1 --setup-only
#
# Env: CODE_VIDEO_HOME (cache dir) - CODE_VIDEO_FORCE_PORTABLE=1 (ignore system node/ffmpeg)
# Exit codes (same as run.sh): 1 general - 3 unsupported platform - 4 download failed - 5 checksum mismatch

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # Invoke-WebRequest is very slow in 5.1 with the progress bar on
try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}

$Here = $PSScriptRoot
$Root = if ($env:CODE_VIDEO_HOME) { $env:CODE_VIDEO_HOME } else { Join-Path $env:USERPROFILE '.code-video' }
$NodeVer = '22.23.3'
$FfmpegTag = 'b6.1.1'
$CanvasVer = '1.0.9'

function Log([string]$m) { [Console]::Error.WriteLine("[code-video] $m") }
function Die([string]$m, [int]$code = 1) { Log "ERROR: $m"; exit $code }

# ---------- platform + pinned downloads ----------
if ($PSVersionTable.PSEdition -eq 'Core' -and -not $IsWindows) { Die 'run.ps1 is for Windows; use run.sh on macOS/Linux' 3 }
$arch = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
if ($arch -eq 'ARM64') { Log 'Windows on ARM: using the x64 builds, which run under Windows emulation' }
elseif ($arch -ne 'AMD64') { Die "unsupported Windows architecture $arch (a 64-bit Windows 10 or 11 is needed)" 3 }

$NodeUrl   = "https://nodejs.org/dist/v$NodeVer/node-v$NodeVer-win-x64.zip"
$NodeSha   = '2b0ff57b049cda1bbcea2240eec20467018713c1efe1f7360c2681859b90ed71'
$FfmpegUrl = "https://github.com/eugeneware/ffmpeg-static/releases/download/$FfmpegTag/ffmpeg-win32-x64.gz"
$FfmpegSha = '8883a3dffbd0a16cf4ef95206ea05283f78908dbfb118f73c83f4951dcc06d77'
$CanvasUrl = "https://registry.npmjs.org/@napi-rs/canvas-win32-x64-msvc/-/canvas-win32-x64-msvc-$CanvasVer.tgz"
$CanvasSha = 'f78a3f43e4a6a2fd24e54937fad6d6a8732bb8d7a1a495ed70325249f54075a4'

function Ensure-Dir([string]$p) { if (-not (Test-Path -LiteralPath $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null } }

# Fetch URL SHA DEST: download to a temp file, verify, then move into place
function Fetch([string]$url, [string]$want, [string]$dest) {
  Ensure-Dir (Split-Path -Parent $dest)
  $tmp = "$dest.part.$PID"
  $name = [IO.Path]::GetFileName(([uri]$url).AbsolutePath)
  Log "downloading $name (one-time) ..."
  $ok = $false
  for ($i = 1; $i -le 3 -and -not $ok; $i++) {
    try { Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing -TimeoutSec 900; $ok = $true }
    catch { if ($i -lt 3) { Start-Sleep -Seconds (2 * $i) } }
  }
  if (-not $ok) { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue; Die "download failed: $url (no internet, or the network blocks it)" 4 }
  $got = (Get-FileHash -Algorithm SHA256 -LiteralPath $tmp).Hash.ToLower()
  if ($got -ne $want) { Remove-Item -LiteralPath $tmp -Force; Die "checksum mismatch for $url (expected $want, got $got). Not using it." 5 }
  Move-Item -LiteralPath $tmp -Destination $dest -Force
}

# Run a native command without Windows PowerShell 5.1 turning its stderr into terminating errors
function Run-Native([scriptblock]$sb) {
  $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { & $sb } catch { $null } finally { $ErrorActionPreference = $old }
}

Ensure-Dir $Root
$Dl = Join-Path $Root 'dl'

# ---------- Node.js (system if >= 18, else portable) ----------
$Node = $null
if ($env:CODE_VIDEO_FORCE_PORTABLE -ne '1') {
  $cmd = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($cmd) {
    $v = Run-Native { & $cmd.Path -v 2>$null }
    $major = 0; if ("$v" -match '^v(\d+)\.') { $major = [int]$Matches[1] }
    if ($major -ge 18) { $Node = $cmd.Path }
  }
}
if (-not $Node) {
  $Node = Join-Path $Root "node-$NodeVer\node.exe"
  if (-not (Test-Path -LiteralPath $Node)) {
    $zip = Join-Path $Dl 'node.zip'
    Fetch $NodeUrl $NodeSha $zip
    try { Add-Type -AssemblyName System.IO.Compression } catch {}
    try { Add-Type -AssemblyName System.IO.Compression.FileSystem } catch {}
    Ensure-Dir (Split-Path -Parent $Node)
    $tmp = "$Node.tmp.$PID"
    $za = [IO.Compression.ZipFile]::OpenRead($zip)
    try {
      # only node.exe is needed (npm, headers and docs are not)
      $entry = $za.Entries | Where-Object { $_.FullName -eq "node-v$NodeVer-win-x64/node.exe" } | Select-Object -First 1
      if ($entry) { [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $tmp, $true) }
    } finally { $za.Dispose() }
    if (-not (Test-Path -LiteralPath $tmp)) { Die 'could not unpack Node.js' }
    Move-Item -LiteralPath $tmp -Destination $Node -Force
    Remove-Item -LiteralPath $zip -Force
    Log "Node.js $NodeVer ready"
  }
}

# ---------- ffmpeg (system if it has libx264, else portable) ----------
$Ffmpeg = $null
if ($env:CODE_VIDEO_FORCE_PORTABLE -ne '1') {
  $cmd = Get-Command ffmpeg -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($cmd) {
    $enc = (Run-Native { & $cmd.Path -hide_banner -encoders 2>$null }) -join "`n"
    if ($enc -match ' libx264 ') { $Ffmpeg = $cmd.Path }
  }
}
if (-not $Ffmpeg) {
  $Ffmpeg = Join-Path $Root "ffmpeg-$FfmpegTag\ffmpeg.exe"
  if (-not (Test-Path -LiteralPath $Ffmpeg)) {
    $gz = Join-Path $Dl 'ffmpeg.gz'
    Fetch $FfmpegUrl $FfmpegSha $gz
    Ensure-Dir (Split-Path -Parent $Ffmpeg)
    $tmp = "$Ffmpeg.tmp.$PID"
    $in = [IO.File]::OpenRead($gz); $out = [IO.File]::Create($tmp); $gzs = $null
    try { $gzs = New-Object IO.Compression.GZipStream($in, [IO.Compression.CompressionMode]::Decompress); $gzs.CopyTo($out) }
    finally { if ($gzs) { $gzs.Dispose() }; $out.Dispose(); $in.Dispose() }
    Move-Item -LiteralPath $tmp -Destination $Ffmpeg -Force
    Remove-Item -LiteralPath $gz -Force
    Log "ffmpeg ($FfmpegTag) ready"
  }
}

# ---------- canvas engine (Skia native binary + its ICU data file) ----------
$CanvasDir = Join-Path $Root "canvas-$CanvasVer"
$CanvasNode = Join-Path $CanvasDir 'skia.win32-x64-msvc.node'
if (-not (Test-Path -LiteralPath $CanvasNode)) {
  $tgz = Join-Path $Dl 'canvas.tgz'
  Fetch $CanvasUrl $CanvasSha $tgz
  $tar = Join-Path $env:SystemRoot 'System32\tar.exe'
  if (-not (Test-Path -LiteralPath $tar)) { Die 'this Windows has no built-in tar.exe (Windows 10 version 1803 or newer is needed)' 3 }
  $stage = Join-Path $Dl "canvas-stage.$PID"
  Ensure-Dir $stage
  Run-Native { & $tar -xzf $tgz -C $stage 'package/skia.win32-x64-msvc.node' 'package/icudtl.dat' 2>$null } | Out-Null
  $srcNode = Join-Path $stage 'package\skia.win32-x64-msvc.node'
  if (-not (Test-Path -LiteralPath $srcNode)) { Die 'could not unpack the canvas engine' }
  Ensure-Dir $CanvasDir
  $icu = Join-Path $stage 'package\icudtl.dat'
  if (Test-Path -LiteralPath $icu) { Move-Item -LiteralPath $icu -Destination (Join-Path $CanvasDir 'icudtl.dat') -Force }
  Move-Item -LiteralPath $srcNode -Destination $CanvasNode -Force   # last, so its presence means the install is complete
  Remove-Item -LiteralPath $stage -Recurse -Force
  Remove-Item -LiteralPath $tgz -Force
  Log "canvas engine $CanvasVer ready"
}
if ((Test-Path -LiteralPath $Dl) -and -not (Get-ChildItem -LiteralPath $Dl -Force)) { Remove-Item -LiteralPath $Dl -Force }

$env:CODE_VIDEO_NODE = $Node
$env:CODE_VIDEO_FFMPEG = $Ffmpeg
$env:CODE_VIDEO_CANVAS_JS = Join-Path $Here 'canvas-js\index.js'
$env:NAPI_RS_NATIVE_LIBRARY_PATH = $CanvasNode

if ($args.Count -eq 0 -or $args[0] -eq '--setup-only') {
  $nv = Run-Native { & $Node -v 2>$null }
  $size = '{0:N0} MB' -f ((Get-ChildItem -LiteralPath $Root -Recurse -File -Force | Measure-Object -Property Length -Sum).Sum / 1MB)
  Write-Output "READY - win32-x64$(if ($arch -eq 'ARM64') { ' (on ARM64, emulated)' })"
  Write-Output "  node:   $Node ($nv)"
  Write-Output "  ffmpeg: $Ffmpeg"
  Write-Output "  canvas: $CanvasNode"
  Write-Output "  cache:  $Root ($size)"
  exit 0
}

$ErrorActionPreference = 'Continue'
& $Node @args
exit $LASTEXITCODE
