#!/usr/bin/env bash
# Builds and installs the Pillbox MCP server and registers it with AI providers.
# Usage: ./install.sh [--yes|-y]

set -euo pipefail

AUTO_YES=false
for arg in "$@"; do
  case "$arg" in
    --yes|-y) AUTO_YES=true ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HOME/.pillbox/mcp"

# ─── Check dependencies ─────────────────────────────────────────────────────────

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

# ─── Build ──────────────────────────────────────────────────────────────────────

echo "Building..."
cd "$SCRIPT_DIR"
"$PKG_MANAGER" install
"$PKG_MANAGER" run build

# ─── Copy bundle ────────────────────────────────────────────────────────────────

echo "Installing to $DEST..."
mkdir -p "$DEST"
cp dist/index.js "$DEST/index.js"
echo "✓ MCP installed at $DEST/index.js"

# ─── Detect providers ───────────────────────────────────────────────────────────

DETECTED=()
[ -d "$HOME/.claude" ] && DETECTED+=("claude-code")
[ -d "$HOME/.config/opencode" ] && DETECTED+=("opencode")

if [ ${#DETECTED[@]} -eq 0 ]; then
  echo ""
  echo "No AI providers detected. Skipping registration."
  echo "To register manually, add the following to your provider config:"
  echo "  Claude Code (~/.claude.json): mcpServers.pillbox = { command: 'node', args: ['$DEST/index.js'] }"
  echo "  OpenCode (~/.config/opencode/opencode.json): mcp.pillbox = { type: 'local', command: ['node', '$DEST/index.js'], enabled: true }"
  exit 0
fi

echo ""
echo "Detected providers: ${DETECTED[*]}"
echo ""
echo "Register Pillbox MCP with all detected providers?"
if [ "$AUTO_YES" = true ]; then
  answer="y"
  echo "[Y/n]: y (auto)"
else
  read -rp "[Y/n]: " answer
  answer=$(echo "${answer:-y}" | tr '[:upper:]' '[:lower:]')
fi

if [ "$answer" = "n" ]; then
  echo "Skipping registration."
  exit 0
fi

# ─── Register ───────────────────────────────────────────────────────────────────

ENTRY="$DEST/index.js"

REGISTER="$SCRIPT_DIR/scripts/register-mcp.mjs"

for provider in "${DETECTED[@]}"; do
  case "$provider" in
    claude-code)
      node "$REGISTER" claude-code "$ENTRY" >/dev/null
      echo "✓ Registered with Claude Code (~/.claude.json)"
      ;;
    opencode)
      node "$REGISTER" opencode "$ENTRY" >/dev/null
      echo "✓ Registered with OpenCode (~/.config/opencode/opencode.json)"
      ;;
  esac
done

echo ""
echo "Done."
