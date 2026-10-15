# Runtime for brand-ads on Windows (Windows PowerShell 5.1 and PowerShell 7). Mirrors run.sh.
# Makes sure Node.js 18 or newer is available, then runs a script with it. It uses the computer's own Node when it is
# new enough; otherwise the first run downloads a portable copy into %USERPROFILE%\.code-video, checked against a
# pinned SHA-256 (the same pins and cache as Brand Reels' launcher). It needs no admin rights.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File run.ps1 <script.mjs> [args...]
#   powershell -NoProfile -ExecutionPolicy Bypass -File run.ps1 --setup-only
#
# Env: CODE_VIDEO_HOME (cache dir) - CODE_VIDEO_FORCE_PORTABLE=1 (ignore the system node)
# Exit codes (same as run.sh): 1 general - 3 unsupported platform - 4 download failed - 5 checksum mismatch

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # Invoke-WebRequest is very slow in 5.1 with the progress bar on
try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}

$Root = if ($env:CODE_VIDEO_HOME) { $env:CODE_VIDEO_HOME } else { Join-Path $env:USERPROFILE '.code-video' }
$NodeVer = '22.23.3'

function Log([string]$m) { [Console]::Error.WriteLine("[brand-ads] $m") }
function Die([string]$m, [int]$code = 1) { Log "ERROR: $m"; exit $code }

# ---------- platform + pinned download ----------
if ($PSVersionTable.PSEdition -eq 'Core' -and -not $IsWindows) { Die 'run.ps1 is for Windows; use run.sh on macOS/Linux' 3 }
$arch = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
if ($arch -eq 'ARM64') { Log 'Windows on ARM: using the x64 build, which runs under Windows emulation' }
elseif ($arch -ne 'AMD64') { Die "unsupported Windows architecture $arch (a 64-bit Windows 10 or 11 is needed)" 3 }

$NodeUrl = "https://nodejs.org/dist/v$NodeVer/node-v$NodeVer-win-x64.zip"
$NodeSha = '2b0ff57b049cda1bbcea2240eec20467018713c1efe1f7360c2681859b90ed71'

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
if ($args.Count -eq 0 -or $args[0] -eq '--setup-only') {
  $nv = Run-Native { & $Node -v 2>$null }
  Write-Output "READY - win32-x64$(if ($arch -eq 'ARM64') { ' (on ARM64, emulated)' })"
  Write-Output "  node:   $Node ($nv)"
  Write-Output "  cache:  $Root"
  exit 0
}

$ErrorActionPreference = 'Continue'
& $Node @args
exit $LASTEXITCODE
