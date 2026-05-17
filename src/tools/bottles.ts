/**
 * Bottle (project) management tools.
 */

import os from "node:os";
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
        "Normally done by `pillbox bottle init`; this tool exists for automation. " +
        "The directory is derived automatically from the cwd of the pillbox process " +
        "(for scope='local') or from the user's home (for scope='global') — " +
        "do NOT accept directory paths from the user. The only model choice is scope.",
      inputSchema: BottleCreateSchema.shape,
    },
    async (input) => {
      const directory = input.scope === "global" ? os.homedir() : process.cwd();
      return execTool("bottle_create", { ...input, directory });
    },
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
