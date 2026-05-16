/**
 * Bottle (project) management tools.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execTool } from "../dispatch.js";
import { BottleContextSchema, BottleCreateSchema, BottleVinculateSchema } from "../schemas.js";

export function registerBottleTools(server: McpServer): void {
  server.registerTool(
    "bottle_list",
    {
      description: "Lists all bottles (projects) registered in Pillbox.",
      inputSchema: {},
    },
    async () => execTool("bottle_list"),
  );

  server.registerTool(
    "bottle_context",
    {
      description:
        "Navigable index of prescriptions in a bottle: id, title, status, dates and pill_count. " +
        "Use at the start of a session to see which work sessions exist. " +
        "To view the pills of a specific prescription, use prescription_context with its id.",
      inputSchema: BottleContextSchema.shape,
    },
    async (input) => execTool("bottle_context", input),
  );

  server.registerTool(
    "bottle_create",
    {
      description:
        "Registers a new bottle (project) in Pillbox. " +
        "Normally done by `pillbox bottle init`; this tool exists for automation.",
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
