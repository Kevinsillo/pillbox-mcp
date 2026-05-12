/**
 * Schemas Zod para los inputs de todas las tools.
 * Se usan tanto para validación como para generar el inputSchema del MCP.
 */

import { z } from "zod";

// ─── Author (compartido) ──────────────────────────────────────────────────────
// Campos obligatorios. Resolución (responsabilidad del agente):
//   (1) Leer ~/.pillbox/identity.json (campos `name` y `email`).
//   (2) Si no existe: obtener de git config y persistir en identity.json.
//   (3) Si git config falla: preguntar al usuario y persistir en identity.json.

export const AUTHOR_NAME_DESC =
  "Nombre del autor humano detrás del agente. Resolución en 3 pasos: " +
  "(1) leer el campo `name` de ~/.pillbox/identity.json; " +
  "(2) si no existe, obtener de `git config user.name` y persistirlo en ese fichero; " +
  "(3) si git config falla, preguntar al usuario y persistirlo en ese fichero.";

export const AUTHOR_EMAIL_DESC =
  "Email del autor humano detrás del agente. Resolución en 3 pasos: " +
  "(1) leer el campo `email` de ~/.pillbox/identity.json; " +
  "(2) si no existe, obtener de `git config user.email` y persistirlo en ese fichero; " +
  "(3) si git config falla, preguntar al usuario y persistirlo en ese fichero.";

// ─── Pills ────────────────────────────────────────────────────────────────────

export const PillStoreSchema = z.object({
  prescription_id: z.string().min(12),
  compound: z.string().min(1).max(64),
  title: z.string().min(1).max(200).describe("Título legible en lenguaje natural."),
  content: z.string().min(1).max(5000).describe("Máximo 5000 caracteres."),
  author_name: z.string().min(1).max(200).describe(AUTHOR_NAME_DESC),
  author_email: z.string().min(1).max(200).describe(AUTHOR_EMAIL_DESC),
});

export const PillReadSchema = z.object({
  id: z.string().min(12),
});

export const PillReviseSchema = z.object({
  id: z.string().min(12),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  compound: z.string().min(1).max(64).optional(),
});

export const PillDiscardSchema = z.object({
  id: z.string().min(12),
});

export const PillFindSchema = z.object({
  query: z.string().min(1),
  bottle_id: z.string().min(12).optional(),
  compound: z.string().min(1).max(64).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const BottleContextSchema = z.object({
  bottle_id: z.string().min(12),
  limit: z.number().int().min(1).max(100).optional(),
});

export const PrescriptionContextSchema = z.object({
  prescription_id: z.string().min(12),
  limit: z.number().int().min(1).max(100).optional(),
});

// ─── Capsules ─────────────────────────────────────────────────────────────────

export const CapsuleStoreSchema = z.object({
  compound: z.string().min(1).max(64),
  title: z.string().min(1).max(200).describe("Título legible en lenguaje natural."),
  content: z.string().min(1).max(5000).describe("Máximo 5000 caracteres."),
});

export const CapsuleReadSchema = z.object({
  id: z.string().min(12),
});

export const CapsuleReviseSchema = z.object({
  id: z.string().min(12),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  compound: z.string().min(1).max(64).optional(),
});

export const CapsuleDiscardSchema = z.object({
  id: z.string().min(12),
});

export const CapsuleFindSchema = z.object({
  query: z.string().min(1),
  compound: z.string().min(1).max(64).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ─── Prescriptions ────────────────────────────────────────────────────────────

export const PrescriptionOpenSchema = z.object({
  bottle_id: z.string().min(12),
  title: z.string().min(1).max(300).describe("Título legible en lenguaje natural."),
  author_name: z.string().min(1).max(200).describe(AUTHOR_NAME_DESC),
  author_email: z.string().min(1).max(200).describe(AUTHOR_EMAIL_DESC),
});

export const PrescriptionCloseSchema = z.object({
  id: z.string().min(12),
});

export const PrescriptionReadSchema = z.object({
  id: z.string().min(12),
});

export const PrescriptionDiscardSchema = z.object({
  id: z.string().min(12),
});

// ─── Bottles ──────────────────────────────────────────────────────────────────

export const BottleCreateSchema = z.object({
  name: z.string().min(1).max(100),
  display_name: z.string().min(1).max(200),
  directory: z.string().min(1),
  scope: z.enum(["local", "global"]),
});

export const BottleVinculateSchema = z.object({
  directory: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Absolute path to directory containing .pillbox/pillbox.db. Defaults to cwd of the pillbox process.",
    ),
});
