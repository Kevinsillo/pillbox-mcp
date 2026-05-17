/**
 * Pill tools — project-specific knowledge.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execTool, validationError } from "../dispatch.js";
import {
  PillStoreSchema,
  PillReadSchema,
  PillReviseSchema,
  PillDiscardSchema,
  PillFindSchema,
  PillCompoundsSchema,
} from "../schemas.js";

export function registerPillTools(server: McpServer): void {
  server.registerTool(
    "pill_store",
    {
      description:
        "Stores project-specific knowledge inside an open prescription. " +
        "Use instead of capsule_store when the knowledge belongs to this specific project — " +
        "requires an active prescription_id. " +
        "Examples: architecture decisions, fixed bugs, code patterns. " +
        "The compound field is free text — check the skill for conventional values.",
      inputSchema: PillStoreSchema.shape,
    },
    async (input) => execTool("pill_store", input),
  );

  server.registerTool(
    "pill_read",
    {
      description: "Reads the full content of a pill by its ID.",
      inputSchema: PillReadSchema.shape,
    },
    async (input) => execTool("pill_read", input),
  );

  server.registerTool(
    "pill_revise",
    {
      description:
        "Updates the title, content and/or compound of an existing pill. " +
        "Only the provided fields are modified.",
      inputSchema: PillReviseSchema.shape,
    },
    async (input) => execTool("pill_revise", input),
  );

  server.registerTool(
    "pill_discard",
    {
      description: "Soft-deletes a pill. Cannot be undone.",
      inputSchema: PillDiscardSchema.shape,
    },
    async (input) => execTool("pill_discard", input),
  );

  server.registerTool(
    "pill_search",
    {
      description:
        "Searches pills using full-text search (FTS5). " +
        "Either 'query' (FTS text) or 'compound' (exact filter) must be provided — at least one. " +
        "If only 'compound' is passed, lists pills of that compound without FTS filtering. " +
        "Optionally filters by bottle_id. " +
        "fuzzy: enable approximate match (default false).",
      inputSchema: PillFindSchema.shape,
    },
    async (input) => {
      const query = typeof input.query === "string" ? input.query.trim() : "";
      const compound = typeof input.compound === "string" ? input.compound.trim() : "";
      if (!query && !compound) {
        return validationError("Either 'query' or 'compound' must be provided (at least one).");
      }
      return execTool("pill_search", input);
    },
  );

  server.registerTool(
    "pill_compounds",
    {
      description:
        "List distinct pill compounds with their frequency in the current bottle, ordered by count desc.",
      inputSchema: PillCompoundsSchema.shape,
    },
    async (input) => execTool("pill_compounds", input),
  );
}
