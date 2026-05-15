/**
 * Tools de capsules — conocimiento personal cross-proyecto.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execTool } from "../dispatch.js";
import {
  CapsuleStoreSchema,
  CapsuleReadSchema,
  CapsuleReviseSchema,
  CapsuleDiscardSchema,
  CapsuleFindSchema,
  CapsuleCompoundsSchema,
} from "../schemas.js";

export function registerCapsuleTools(server: McpServer): void {
  server.registerTool(
    "capsule_store",
    {
      description:
        "Guarda conocimiento personal del usuario (preferencias, convenciones, workflow). " +
        "Usar en lugar de pill_store cuando el conocimiento NO pertenece a un proyecto específico — " +
        "cross-proyecto, sin prescription activa. " +
        "Ejemplos: estilo de código preferido, herramientas del entorno, forma de trabajar. " +
        "El campo compound es texto libre — consultar el skill para los valores convencionales.",
      inputSchema: CapsuleStoreSchema.shape,
    },
    async (input) => execTool("capsule_store", input),
  );

  server.registerTool(
    "capsule_read",
    {
      description: "Lee el contenido completo de una capsule por su ID.",
      inputSchema: CapsuleReadSchema.shape,
    },
    async (input) => execTool("capsule_read", input),
  );

  server.registerTool(
    "capsule_revise",
    {
      description: "Actualiza el título y/o contenido de una capsule existente.",
      inputSchema: CapsuleReviseSchema.shape,
    },
    async (input) => execTool("capsule_revise", input),
  );

  server.registerTool(
    "capsule_discard",
    {
      description: "Hace soft-delete de una capsule.",
      inputSchema: CapsuleDiscardSchema.shape,
    },
    async (input) => execTool("capsule_discard", input),
  );

  server.registerTool(
    "capsule_search",
    {
      description:
        "Busca capsules usando búsqueda full-text (FTS5). " +
        "Las capsules son globales — no se filtran por proyecto. " +
        "fuzzy: enable approximate match (default false).",
      inputSchema: CapsuleFindSchema.shape,
    },
    async (input) => execTool("capsule_search", input),
  );

  server.registerTool(
    "capsule_compounds",
    {
      description:
        "List distinct capsule compounds with their frequency, ordered by count desc.",
      inputSchema: CapsuleCompoundsSchema.shape,
    },
    async (input) => execTool("capsule_compounds", input),
  );

}
