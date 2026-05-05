/**
 * Tools de pills — conocimiento específico de proyecto.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execTool } from "../dispatch.js";
import {
  PillStoreSchema,
  PillReadSchema,
  PillReviseSchema,
  PillDiscardSchema,
  PillFindSchema,
} from "../schemas.js";

export function registerPillTools(server: McpServer): void {
  server.registerTool(
    "pill_store",
    {
      description:
        "Guarda conocimiento específico del proyecto en una prescripción abierta. " +
        "Usar en lugar de capsule_store cuando el conocimiento pertenece a este proyecto concreto — " +
        "requiere prescription_id activa. " +
        "Ejemplos: decisiones de arquitectura, bugs corregidos, patrones del código. " +
        "Para elegir compound, llamar pill_compounds.",
      inputSchema: PillStoreSchema.shape,
    },
    async (input) => execTool("pill_store", input),
  );

  server.registerTool(
    "pill_read",
    {
      description: "Lee el contenido completo de una pill por su ID.",
      inputSchema: PillReadSchema.shape,
    },
    async (input) => execTool("pill_read", input),
  );

  server.registerTool(
    "pill_revise",
    {
      description:
        "Actualiza el título, contenido y/o compound de una pill existente. " +
        "Solo los campos proporcionados se modifican.",
      inputSchema: PillReviseSchema.shape,
    },
    async (input) => execTool("pill_revise", input),
  );

  server.registerTool(
    "pill_discard",
    {
      description: "Hace soft-delete de una pill. No se puede deshacer.",
      inputSchema: PillDiscardSchema.shape,
    },
    async (input) => execTool("pill_discard", input),
  );

  server.registerTool(
    "pill_search",
    {
      description:
        "Busca pills usando búsqueda full-text (FTS5). " +
        "Acepta múltiples términos separados por espacios. " +
        "Filtra opcionalmente por bottle_id o compound.",
      inputSchema: PillFindSchema.shape,
    },
    async (input) => execTool("pill_search", input),
  );

  server.registerTool(
    "pill_compounds",
    {
      description:
        "Devuelve los compounds disponibles para pill_store, con descripción y prompt_hint. " +
        "Consultar antes de pill_store si no estás seguro de qué compound usar.",
      inputSchema: {},
    },
    async () => execTool("pill_compounds"),
  );
}
