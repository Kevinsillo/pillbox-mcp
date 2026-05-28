/**
 * Validaciones compartidas entre tools MCP.
 */

import { validationError } from "./dispatch.js";
import type { McpResponse } from "./types.js";

/**
 * Valida que al menos uno de `query` o `compound` esté presente tras `trim`.
 *
 * Replica el guard inline duplicado en `pill_search` y `capsule_search`:
 * devuelve la misma `McpResponse` de error de validación cuando ambos están
 * vacíos, o `null` cuando la entrada es válida.
 */
export function requireQueryOrCompound(input: Record<string, unknown>): McpResponse | null {
  const query = typeof input.query === "string" ? input.query.trim() : "";
  const compound = typeof input.compound === "string" ? input.compound.trim() : "";
  if (!query && !compound) {
    return validationError("Either 'query' or 'compound' must be provided (at least one).");
  }
  return null;
}
