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

if ! command -v pnpm &>/dev/null; then
  echo "Error: pnpm not found. Install it with: npm install -g pnpm"
  exit 1
fi

echo "=== Pillbox MCP install ==="
echo ""

# Build
echo "Building..."
cd "$SCRIPT_DIR"
pnpm install --frozen-lockfile
pnpm build

# Install
echo "Installing to $DEST..."
mkdir -p "$DEST"
cp dist/index.js "$DEST/index.js"

echo ""
echo "✓ MCP installed at $DEST/index.js"
echo ""
echo "Run 'pillbox mcp install' to register it with your AI providers."
