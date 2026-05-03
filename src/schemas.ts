/**
 * Schemas Zod para los inputs de todas las tools.
 * Se usan tanto para validación como para generar el inputSchema del MCP.
 */

import { z } from "zod";

// ─── Author (compartido) ──────────────────────────────────────────────────────
// Identidad del usuario humano detrás del agente. Resolución en 3 pasos
// (responsabilidad del cliente MCP/agente, no del servidor):
//   (1) git config user.name / user.email del repo o entorno actual.
//   (2) Si falla: leer ~/.pillbox/identity.json (campos `name` y `email`).
//   (3) Si sigue sin valor: preguntar al usuario y persistir la respuesta en
//       ~/.pillbox/identity.json para futuras invocaciones.

export const AUTHOR_NAME_DESC =
  "Nombre del autor humano detrás del agente. Resolución en 3 pasos: " +
  "(1) leer `git config user.name` del repo/entorno actual; " +
  "(2) si falla, leer el campo `name` de ~/.pillbox/identity.json; " +
  "(3) si sigue vacío, preguntar al usuario y persistirlo en ese mismo fichero.";

export const AUTHOR_EMAIL_DESC =
  "Email del autor humano detrás del agente. Resolución en 3 pasos: " +
  "(1) leer `git config user.email` del repo/entorno actual; " +
  "(2) si falla, leer el campo `email` de ~/.pillbox/identity.json; " +
  "(3) si sigue vacío, preguntar al usuario y persistirlo en ese mismo fichero.";

// ─── Pills ────────────────────────────────────────────────────────────────────

export const PillStoreSchema = z.object({
  prescription_id: z.string().uuid(),
  compound: z.enum([
    "decision",
    "architecture",
    "bugfix",
    "pattern",
    "discovery",
    "learning",
    "feedback",
    "prescription_summary",
    "manual",
  ]),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  author_name: z.string().min(1).max(200).optional().describe(AUTHOR_NAME_DESC),
  author_email: z.string().min(1).max(200).optional().describe(AUTHOR_EMAIL_DESC),
});

export const PillReadSchema = z.object({
  id: z.number().int().positive(),
});

export const PillReviseSchema = z.object({
  id: z.number().int().positive(),
  patch: z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).optional(),
  }),
});

export const PillDiscardSchema = z.object({
  id: z.number().int().positive(),
});

export const PillFindSchema = z.object({
  query: z.string().min(1),
  bottle_id: z.string().uuid().optional(),
  compound: z
    .enum([
      "decision",
      "architecture",
      "bugfix",
      "pattern",
      "discovery",
      "learning",
      "feedback",
      "prescription_summary",
      "manual",
    ])
    .optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const PillContextSchema = z.object({
  bottle_id: z.string().uuid(),
  prescription_limit: z.number().int().min(1).max(20).optional(),
  pill_limit: z.number().int().min(1).max(100).optional(),
});

// ─── Capsules ─────────────────────────────────────────────────────────────────

export const CapsuleStoreSchema = z.object({
  compound: z.enum([
    "convention",
    "workflow",
    "environment",
    "context",
    "goal",
    "feedback",
    "manual",
  ]),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
});

export const CapsuleReadSchema = z.object({
  id: z.number().int().positive(),
});

export const CapsuleReviseSchema = z.object({
  id: z.number().int().positive(),
  patch: z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).optional(),
    compound: z
      .enum(["convention", "workflow", "environment", "context", "goal", "feedback", "manual"])
      .optional(),
  }),
});

export const CapsuleDiscardSchema = z.object({
  id: z.number().int().positive(),
});

export const CapsuleFindSchema = z.object({
  query: z.string().min(1),
  compound: z
    .enum(["convention", "workflow", "environment", "context", "goal", "feedback", "manual"])
    .optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ─── Prescriptions ────────────────────────────────────────────────────────────

export const PrescriptionOpenSchema = z.object({
  bottle_id: z.string().uuid(),
  title: z.string().min(1).max(300),
  author_name: z.string().min(1).max(200).optional().describe(AUTHOR_NAME_DESC),
  author_email: z.string().min(1).max(200).optional().describe(AUTHOR_EMAIL_DESC),
});

export const PrescriptionCloseSchema = z.object({
  id: z.string().uuid(),
});

export const PrescriptionReadSchema = z.object({
  id: z.string().uuid(),
});

export const PrescriptionDiscardSchema = z.object({
  id: z.string().uuid(),
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
