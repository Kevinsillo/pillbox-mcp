# Builds and installs the Pillbox MCP server and registers it with AI providers.
# Usage: ./install.ps1 [-Yes]

#Requires -Version 5.1

[CmdletBinding()]
param(
    [switch]$Yes
)

$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot
$Dest      = Join-Path $HOME ".pillbox\mcp"

# ─── Check dependencies ─────────────────────────────────────────────────────────

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: node not found. Install Node.js >= 18 and try again." -ForegroundColor Red
    exit 1
}

$PkgManager = $null
foreach ($pm in @("pnpm", "bun", "npm")) {
    if (Get-Command $pm -ErrorAction SilentlyContinue) {
        $PkgManager = $pm
        break
    }
}

if (-not $PkgManager) {
    Write-Host "Error: no package manager found. Install pnpm, bun or npm and try again." -ForegroundColor Red
    exit 1
}

Write-Host "=== Pillbox MCP install ==="
Write-Host "Package manager: $PkgManager"
Write-Host ""

# ─── Build ──────────────────────────────────────────────────────────────────────

Write-Host "Building..."
Push-Location $ScriptDir
try {
    & $PkgManager install
    if ($LASTEXITCODE -ne 0) { throw "'$PkgManager install' failed (exit $LASTEXITCODE)." }
    & $PkgManager run build
    if ($LASTEXITCODE -ne 0) { throw "'$PkgManager run build' failed (exit $LASTEXITCODE)." }
} finally {
    Pop-Location
}

# ─── Copy bundle ────────────────────────────────────────────────────────────────

Write-Host "Installing to $Dest..."
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
Copy-Item -Path (Join-Path $ScriptDir "dist\index.js") -Destination (Join-Path $Dest "index.js") -Force
Write-Host "OK MCP installed at $(Join-Path $Dest 'index.js')" -ForegroundColor Green

# ─── Detect providers ───────────────────────────────────────────────────────────

$Detected = @()
if (Test-Path (Join-Path $HOME ".claude")) { $Detected += "claude-code" }
if (Test-Path (Join-Path $HOME ".config\opencode")) { $Detected += "opencode" }

if ($Detected.Count -eq 0) {
    Write-Host ""
    Write-Host "No AI providers detected. Skipping registration."
    Write-Host "To register manually, add the following to your provider config:"
    Write-Host "  Claude Code (~/.claude.json): mcpServers.pillbox = { command: 'node', args: ['$Dest\index.js'] }"
    Write-Host "  OpenCode (~/.config/opencode/opencode.json): mcp.pillbox = { type: 'local', command: ['node', '$Dest\index.js'], enabled: true }"
    exit 0
}

Write-Host ""
Write-Host "Detected providers: $($Detected -join ', ')"
Write-Host ""

if ($Yes) {
    $Answer = "y"
    Write-Host "Register with all detected providers? [Y/n]: y (auto)"
} else {
    $Answer = (Read-Host "Register with all detected providers? [Y/n]").ToLower()
    if ([string]::IsNullOrWhiteSpace($Answer)) { $Answer = "y" }
}

if ($Answer -eq "n") {
    Write-Host "Skipping registration."
    exit 0
}

# ─── Register ───────────────────────────────────────────────────────────────────

$Entry = Join-Path $Dest "index.js"

foreach ($Provider in $Detected) {
    switch ($Provider) {
        "claude-code" {
            $Cfg = Join-Path $HOME ".claude.json"
            $script = @"
const fs = require('fs');
const cfg = '$($Cfg.Replace('\','\\'))';
const root = fs.existsSync(cfg) ? JSON.parse(fs.readFileSync(cfg, 'utf8')) : {};
root.mcpServers = root.mcpServers || {};
root.mcpServers.pillbox = { command: 'node', args: ['$($Entry.Replace('\','\\'))'] };
fs.writeFileSync(cfg, JSON.stringify(root, null, 2) + '\n');
"@
            node -e $script
            if ($LASTEXITCODE -ne 0) { throw "Failed to register with Claude Code." }
            Write-Host "OK Registered with Claude Code ($Cfg)" -ForegroundColor Green
        }
        "opencode" {
            $Cfg = Join-Path $HOME ".config\opencode\opencode.json"
            $CfgDir = Split-Path $Cfg -Parent
            $script = @"
const fs = require('fs');
const cfg = '$($Cfg.Replace('\','\\'))';
if (!fs.existsSync('$($CfgDir.Replace('\','\\'))')) {
  fs.mkdirSync('$($CfgDir.Replace('\','\\'))', { recursive: true });
}
const root = fs.existsSync(cfg) ? JSON.parse(fs.readFileSync(cfg, 'utf8')) : {};
root.mcp = root.mcp || {};
root.mcp.pillbox = { type: 'local', command: ['node', '$($Entry.Replace('\','\\'))'], enabled: true };
fs.writeFileSync(cfg, JSON.stringify(root, null, 2) + '\n');
"@
            node -e $script
            if ($LASTEXITCODE -ne 0) { throw "Failed to register with OpenCode." }
            Write-Host "OK Registered with OpenCode ($Cfg)" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "Done."
