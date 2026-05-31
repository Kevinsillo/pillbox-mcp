# Builds and installs the Pillbox MCP server to ~/.pillbox/mcp/ on Windows.
# PowerShell counterpart of install.sh — builds from source and copies the bundle.
# Usage: ./install.ps1

#Requires -Version 5.1

[CmdletBinding()]
param()

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

# ─── Install ────────────────────────────────────────────────────────────────────

Write-Host "Installing to $Dest..."
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
Copy-Item -Path (Join-Path $ScriptDir "dist\index.js") -Destination (Join-Path $Dest "index.js") -Force

Write-Host ""
Write-Host "OK MCP installed at $(Join-Path $Dest 'index.js')" -ForegroundColor Green
Write-Host ""
Write-Host "Run 'pillbox mcp install' to register it with your AI providers."
