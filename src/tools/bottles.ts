/**
 * Tools de gestión de bottles (proyectos).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execTool } from "../dispatch.js";
import { BottleContextSchema, BottleCreateSchema, BottleVinculateSchema } from "../schemas.js";

export function registerBottleTools(server: McpServer): void {
  server.registerTool(
    "bottle_list",
    {
      description: "Lista todos los bottles (proyectos) registrados en Pillbox.",
      inputSchema: {},
    },
    async () => execTool("bottle_list"),
  );

  server.registerTool(
    "bottle_context",
    {
      description:
        "Índice navegable de prescriptions de un bottle: id, título, estado, fechas y pill_count. " +
        "Usar al inicio de una sesión para ver qué sesiones de trabajo existen. " +
        "Para ver las pills de una prescription concreta, usar prescription_context con su id.",
      inputSchema: BottleContextSchema.shape,
    },
    async (input) => execTool("bottle_context", input),
  );

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
}
