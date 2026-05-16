/**
 * Prescription (work session) management tools and navigation context.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execTool } from "../dispatch.js";
import {
  PrescriptionOpenSchema,
  PrescriptionCloseSchema,
  PrescriptionReopenSchema,
  PrescriptionReadSchema,
  PrescriptionDiscardSchema,
  PrescriptionContextSchema,
} from "../schemas.js";

export function registerPrescriptionTools(server: McpServer): void {
  server.registerTool(
    "prescription_open",
    {
      description:
        "Opens a new prescription (work session) for a bottle. " +
        "Returns the ID of the created prescription. " +
        "If one is already open, returns error `prescription_already_open` with its data.",
      inputSchema: PrescriptionOpenSchema.shape,
    },
    async (input) => execTool("prescription_open", input),
  );

  server.registerTool(
    "prescription_close",
    {
      description: "Closes an open prescription. Ends the work session.",
      inputSchema: PrescriptionCloseSchema.shape,
    },
    async (input) => execTool("prescription_close", input),
  );

  server.registerTool(
    "prescription_reopen",
    {
      description:
        "Reopens a closed prescription to allow editing/adding pills. " +
        "If the bottle already has another open prescription, returns error `prescription_collision` with its `existing_id`.",
      inputSchema: PrescriptionReopenSchema.shape,
    },
    async (input) => execTool("prescription_reopen", input),
  );

  server.registerTool(
    "prescription_read",
    {
      description: "Reads the details of a prescription by its ID.",
      inputSchema: PrescriptionReadSchema.shape,
    },
    async (input) => execTool("prescription_read", input),
  );

  server.registerTool(
    "prescription_discard",
    {
      description: "Discards a prescription and cascades soft-delete to all its pills.",
      inputSchema: PrescriptionDiscardSchema.shape,
    },
    async (input) => execTool("prescription_discard", input),
  );

  server.registerTool(
    "prescription_context",
    {
      description:
        "Pills of a specific prescription with id, compound, title and 300-char snippet. " +
        "Use after bottle_context to drill into a specific work session. " +
        "For the full content of an individual pill, use pill_read.",
      inputSchema: PrescriptionContextSchema.shape,
    },
    async (input) => execTool("prescription_context", input),
  );
}
