/**
 * Capsule tools — personal cross-project knowledge.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execTool, validationError } from "../dispatch.js";
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
        "Stores personal user knowledge (preferences, conventions, workflow). " +
        "Use instead of pill_store when the knowledge does NOT belong to a specific project — " +
        "cross-project, no active prescription. " +
        "Examples: preferred coding style, environment tools, ways of working. " +
        "The compound field is free text — check the skill for conventional values.",
      inputSchema: CapsuleStoreSchema.shape,
    },
    async (input) => execTool("capsule_store", input),
  );

  server.registerTool(
    "capsule_read",
    {
      description: "Reads the full content of a capsule by its ID.",
      inputSchema: CapsuleReadSchema.shape,
    },
    async (input) => execTool("capsule_read", input),
  );

  server.registerTool(
    "capsule_revise",
    {
      description: "Updates the title and/or content of an existing capsule.",
      inputSchema: CapsuleReviseSchema.shape,
    },
    async (input) => execTool("capsule_revise", input),
  );

  server.registerTool(
    "capsule_discard",
    {
      description: "Soft-deletes a capsule.",
      inputSchema: CapsuleDiscardSchema.shape,
    },
    async (input) => execTool("capsule_discard", input),
  );

  server.registerTool(
    "capsule_search",
    {
      description:
        "Searches capsules using full-text search (FTS5). " +
        "Either 'query' (FTS text) or 'compound' (exact filter) must be provided — at least one. " +
        "If only 'compound' is passed, lists capsules of that compound without FTS filtering. " +
        "Capsules are global — not filtered by project. " +
        "fuzzy: enable approximate match (default false).",
      inputSchema: CapsuleFindSchema.shape,
    },
    async (input) => {
      const query = typeof input.query === "string" ? input.query.trim() : "";
      const compound = typeof input.compound === "string" ? input.compound.trim() : "";
      if (!query && !compound) {
        return validationError("Either 'query' or 'compound' must be provided (at least one).");
      }
      return execTool("capsule_search", input);
    },
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
