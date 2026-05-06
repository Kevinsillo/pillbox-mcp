#!/usr/bin/env bash
# Builds and installs the Pillbox MCP server to ~/.pillbox/mcp/
# Usage: ./install.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HOME/.pillbox/mcp"

# Check dependencies
if ! command -v node &>/dev/null; then
  echo "Error: node not found. Install Node.js >= 18 and try again."
  exit 1
fi

PKG_MANAGER=""
for pm in pnpm bun npm; do
  if command -v "$pm" &>/dev/null; then
    PKG_MANAGER="$pm"
    break
  fi
done

if [ -z "$PKG_MANAGER" ]; then
  echo "Error: no package manager found. Install pnpm, bun or npm and try again."
  exit 1
fi

echo "=== Pillbox MCP install ==="
echo "Package manager: $PKG_MANAGER"
echo ""

# Build
echo "Building..."
cd "$SCRIPT_DIR"
"$PKG_MANAGER" install
"$PKG_MANAGER" run build

# Install
echo "Installing to $DEST..."
mkdir -p "$DEST"
cp dist/index.js "$DEST/index.js"

echo ""
echo "✓ MCP installed at $DEST/index.js"
echo ""
echo "Run 'pillbox mcp install' to register it with your AI providers."
