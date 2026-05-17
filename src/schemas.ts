/**
 * Zod schemas for all tool inputs.
 *
 * SHAPE-ONLY: these schemas validate shape only (types, field presence,
 * optionality). Business rules (min/max lengths, numeric ranges, ID format)
 * are enforced in the Rust binary via `validator` and `PillboxError`, and
 * returned to the client as typed codes (`invalid_id`, `content_too_large`,
 * `validation_error`). Keeping rules in a single place avoids drift between
 * the TS wrapper and the Rust core.
 */

import { z } from "zod";

// ─── Author (shared) ──────────────────────────────────────────────────────────
// Required fields. Resolution (agent responsibility):
//   (1) Read ~/.pillbox/identity.json (`name` and `email` fields).
//   (2) If missing: fetch from git config and persist to identity.json.
//   (3) If git config fails: ask the user and persist to identity.json.

export const AUTHOR_NAME_DESC =
  "Name of the human author behind the agent. 3-step resolution: " +
  "(1) read the `name` field from ~/.pillbox/identity.json; " +
  "(2) if missing, fetch from `git config user.name` and persist it there; " +
  "(3) if git config fails, ask the user and persist it there.";

export const AUTHOR_EMAIL_DESC =
  "Email of the human author behind the agent. 3-step resolution: " +
  "(1) read the `email` field from ~/.pillbox/identity.json; " +
  "(2) if missing, fetch from `git config user.email` and persist it there; " +
  "(3) if git config fails, ask the user and persist it there.";

// ─── Pills ────────────────────────────────────────────────────────────────────

export const PillStoreSchema = z.object({
  prescription_id: z.string(),
  compound: z.string(),
  title: z.string().describe("Human-readable natural-language title."),
  content: z.string().describe("Up to 5000 characters."),
  author_name: z.string().describe(AUTHOR_NAME_DESC),
  author_email: z.string().describe(AUTHOR_EMAIL_DESC),
});

export const PillReadSchema = z.object({
  id: z.string(),
});

export const PillReviseSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  compound: z.string().optional(),
});

export const PillDiscardSchema = z.object({
  id: z.string(),
});

export const PillFindSchema = z.object({
  query: z.string().optional(),
  bottle_id: z.string().optional(),
  compound: z.string().optional(),
  limit: z.number().int().optional(),
  fuzzy: z
    .boolean()
    .optional()
    .describe("Enable approximate (fuzzy) match via Jaro-Winkler expansion. Default false."),
});

export const PillCompoundsSchema = z.object({
  bottle_id: z.string().optional(),
  limit: z.number().int().optional(),
});

export const BottleContextSchema = z.object({
  bottle_id: z.string(),
  limit: z.number().int().optional(),
});

export const PrescriptionContextSchema = z.object({
  prescription_id: z.string(),
  limit: z.number().int().optional(),
});

// ─── Capsules ─────────────────────────────────────────────────────────────────

export const CapsuleStoreSchema = z.object({
  compound: z.string(),
  title: z.string().describe("Human-readable natural-language title."),
  content: z.string().describe("Up to 5000 characters."),
});

export const CapsuleReadSchema = z.object({
  id: z.string(),
});

export const CapsuleReviseSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  compound: z.string().optional(),
});

export const CapsuleDiscardSchema = z.object({
  id: z.string(),
});

export const CapsuleFindSchema = z.object({
  query: z.string().optional(),
  compound: z.string().optional(),
  limit: z.number().int().optional(),
  fuzzy: z
    .boolean()
    .optional()
    .describe("Enable approximate (fuzzy) match via Jaro-Winkler expansion. Default false."),
});

export const CapsuleCompoundsSchema = z.object({
  limit: z.number().int().optional(),
});

// ─── Prescriptions ────────────────────────────────────────────────────────────

export const PrescriptionOpenSchema = z.object({
  bottle_id: z.string(),
  title: z.string().describe("Human-readable natural-language title."),
  author_name: z.string().describe(AUTHOR_NAME_DESC),
  author_email: z.string().describe(AUTHOR_EMAIL_DESC),
});

export const PrescriptionCloseSchema = z.object({
  id: z.string(),
});

export const PrescriptionReopenSchema = z.object({
  id: z.string(),
});

export const PrescriptionReadSchema = z.object({
  id: z.string(),
});

export const PrescriptionDiscardSchema = z.object({
  id: z.string(),
});

// ─── Bottles ──────────────────────────────────────────────────────────────────

export const BottleCreateSchema = z.object({
  name: z.string().describe("Slug del bottle (kebab-case, derivado del proyecto)."),
  display_name: z.string().describe("Nombre legible para mostrar."),
  scope: z
    .enum(["local", "global"])
    .default("local")
    .describe(
      "'local' → DB en el cwd del proceso pillbox (.pillbox/pillbox.db). 'global' → DB del usuario (~/.pillbox/pillbox.db). Default: 'local'.",
    ),
});

export const BottleVinculateSchema = z.object({
  directory: z
    .string()
    .optional()
    .describe(
      "Absolute path to directory containing .pillbox/pillbox.db. Defaults to cwd of the pillbox process.",
    ),
});
