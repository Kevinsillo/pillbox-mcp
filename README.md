<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="resources/pillbox-logo-light.png">
  <img src="resources/pillbox-logo-dark.png" alt="Pillbox" width="220">
</picture>

# pillbox-mcp

***MCP server for Pillbox — bridges AI agents to persistent project memory***

Part of the [Pillbox](https://github.com/Kevinsillo/pillbox) ecosystem.

</div>

Installed automatically via `pillbox mcp install` — you probably don't need to clone this directly.

## What this is

The MCP server that connects AI coding assistants to the Pillbox core. It exposes the Pillbox tools (pills, capsules, prescriptions) over the MCP protocol, allowing agents to read and write persistent memory during their work sessions.

All data persistence happens in the Rust binary — this server is a thin bridge with no database dependency of its own.

## Manual installation

```bash
git clone https://github.com/Kevinsillo/pillbox-mcp
cd pillbox-mcp
pnpm install && pnpm build
```

Then point your MCP client to `dist/index.js`.

## Development

```bash
make build   # compile
make dev     # watch mode
make check   # typecheck + fmt
```

## Main repository

→ [pillbox](https://github.com/Kevinsillo/pillbox) — install the full ecosystem from there.
