.PHONY: dev build check typecheck fmt fmt-check install

# ─── Desarrollo ───────────────────────────────────────────────────────────────

## Arranca el MCP en modo watch (requiere dist/ compilado)
dev:
	node --watch dist/index.js

# ─── Build ────────────────────────────────────────────────────────────────────

## Compila el MCP (typecheck + esbuild)
build:
	pnpm install && pnpm build

# ─── Calidad ──────────────────────────────────────────────────────────────────

## Verifica tipos TypeScript sin compilar
typecheck:
	pnpm typecheck

## Formatea el código TypeScript
fmt:
	pnpm fmt

## Verifica formato sin modificar
fmt-check:
	pnpm fmt:check

## Ejecuta typecheck + fmt-check
check: typecheck fmt-check

# ─── Instalación local ────────────────────────────────────────────────────────

## Compila e instala el MCP en ~/.pillbox/mcp/
install: build
	mkdir -p $${HOME}/.pillbox/mcp
	cp -r dist/ $${HOME}/.pillbox/mcp/dist
	cp package.json $${HOME}/.pillbox/mcp/
	cd $${HOME}/.pillbox/mcp && npm install --production --silent
	@echo "✓ MCP instalado en ~/.pillbox/mcp/"
