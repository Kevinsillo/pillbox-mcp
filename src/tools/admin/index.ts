/**
 * Tools de administración: bottle_create y compounds.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execTool } from "../../response.js";
import { BottleCreateSchema, BottleVinculateSchema } from "../../schemas.js";

export function registerAdminTools(server: McpServer): void {
  server.registerTool(
    "bottle_create",
    {
      description:
        "Registra un nuevo bottle (proyecto) en Pillbox. " +
        "Normalmente lo hace `pillbox bottle init`; esta tool existe para automatización.",
      inputSchema: BottleCreateSchema.shape,
    },
    async (input) => execTool("bottle_create", input),
  );

  server.registerTool(
    "bottle_vinculate",
    {
      description:
        "Link a local .pillbox database to the calling user's global registry. " +
        "Use when a second user needs to access a bottle created by another user on the same machine. " +
        "Idempotent: returns status='already_linked' if already registered. directory defaults to cwd.",
      inputSchema: BottleVinculateSchema.shape,
    },
    async (input) => execTool("bottle_vinculate", input),
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

  server.registerTool(
    "capsule_compounds",
    {
      description:
        "Devuelve los compounds disponibles para capsule_store, con descripción y prompt_hint. " +
        "Consultar antes de capsule_store si no estás seguro de qué compound usar.",
      inputSchema: {},
    },
    async () => execTool("capsule_compounds"),
  );
}
