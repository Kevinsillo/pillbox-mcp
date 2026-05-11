/**
 * Recetas de formateo por tool — convierte el JSON de Rust a texto plano estructurado
 * listo para consumir por el LLM.
 */

import type {
  Prescription,
  Pill,
  PillStoreResult,
  PillDiscardResult,
  Capsule,
  CapsuleStoreResult,
  CapsuleDiscardResult,
  SearchResult,
  Bottle,
  CompoundEntry,
  ContextResult,
} from "./types.js";

// ─── Helpers de formateo ──────────────────────────────────────────────────────

function formatAuthor(name: string | null, email: string | null): string | null {
  if (name && email) return `${name} <${email}>`;
  if (name) return name;
  if (email) return email;
  return null;
}

function prescription(d: Prescription, includeId = false): string {
  const lines: string[] = [];
  if (includeId) lines.push(`id: ${d.id}`);
  lines.push(`title: ${d.title}`);
  lines.push(`started_at: ${d.started_at}`);
  if (d.ended_at) lines.push(`ended_at: ${d.ended_at}`);
  const author = formatAuthor(d.author_name, d.author_email);
  if (author) lines.push(`author: ${author}`);
  return lines.join("\n");
}


function searchResults(results: SearchResult[], entity: string): string {
  if (!results.length) return `No ${entity} found.`;
  const label = results.length === 1 ? entity.slice(0, -1) : entity;
  const lines = [`Found ${results.length} ${label}`];
  for (const r of results) {
    const meta = r.prescription_id
      ? ` (id: ${r.id}, rx: ${r.prescription_id.slice(0, 8)}...)`
      : ` (id: ${r.id})`;
    lines.push("");
    lines.push(`[${r.compound}] ${r.title}${meta}`);
    if (r.snippet) lines.push(r.snippet);
  }
  return lines.join("\n");
}

function bottleList(bottles: Bottle[]): string {
  if (!bottles.length) return "No bottles registered.";
  const lines = [`Bottles (${bottles.length})`];
  for (const b of bottles) {
    const status = b.linked ? "●" : "○";
    const unlinked = b.linked ? "" : " [unlinked]";
    lines.push("");
    lines.push(`${status} ${b.display_name} [${b.scope}] ${b.id}${unlinked}`);
    lines.push(`  ${b.directory}`);
  }
  return lines.join("\n");
}

function compoundList(entries: CompoundEntry[]): string {
  if (!entries.length) return "No compounds available.";
  return entries.map((e) => `${e.id}\n  ${e.description}\n  ${e.prompt_hint}`).join("\n\n");
}

function writeOutput(title: string, compound: string, content: string, id?: string): string {
  const idLine = id !== undefined ? `id: ${id}\n` : "";
  return `${idLine}title: ${title}\ncompound: ${compound}\ncontent: ${content}`;
}

function generic(data: unknown, indent = ""): string {
  if (data === null || data === undefined) return "";
  if (typeof data !== "object") return String(data);
  if (Array.isArray(data)) {
    return data.map((item, i) => `${indent}[${i}]\n${generic(item, indent + "  ")}`).join("\n");
  }
  return Object.entries(data as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) =>
      typeof v === "object"
        ? `${indent}${k}:\n${generic(v, indent + "  ")}`
        : `${indent}${k}: ${v}`,
    )
    .join("\n");
}

// ─── Recetas por tool ─────────────────────────────────────────────────────────

type Recipe = (data: unknown) => string;

const recipes: Record<string, Recipe> = {
  prescription_open: (d) => prescription(d as Prescription, true),
  prescription_close: (d) => prescription(d as Prescription),
  prescription_read: (d) => prescription(d as Prescription),
  prescription_discard: () => "Prescription discarded.",

  pill_store: (d) => {
    const r = d as PillStoreResult;
    return writeOutput(r.title, r.compound, r.content, r.id);
  },
  pill_read: (d) => {
    const p = d as Pill;
    const lines = [
      `id: ${p.id}`,
      `title: ${p.title}`,
      `compound: ${p.compound}`,
    ];
    const author = formatAuthor(p.author_name, p.author_email);
    if (author) lines.push(`author: ${author}`);
    lines.push(`content: ${p.content}`);
    return lines.join("\n");
  },
  pill_revise: (d) => {
    const p = d as Pill;
    return writeOutput(p.title, p.compound, p.content, p.id);
  },
  pill_discard: (d) => {
    const r = d as PillDiscardResult;
    return `id: ${r.id}\ndeleted_at: ${r.deleted_at}`;
  },
  pill_search: (d) => searchResults(d as SearchResult[], "pills"),
  bottle_context: (d) => {
    const ctx = d as ContextResult;
    return `${ctx.context}---\nprescriptions: ${ctx.prescription_count}`;
  },
  prescription_context: (d) => {
    const ctx = d as ContextResult;
    return `${ctx.context}\n---\npills: ${ctx.pill_count}`;
  },
  pill_compounds: (d) => compoundList(d as CompoundEntry[]),

  capsule_store: (d) => {
    const r = d as CapsuleStoreResult;
    return writeOutput(r.title, r.compound, r.content, r.id);
  },
  capsule_read: (d) => {
    const c = d as Capsule;
    return `id: ${c.id}\ntitle: ${c.title}\ncompound: ${c.compound}\ncontent: ${c.content}`;
  },
  capsule_revise: (d) => {
    const c = d as Capsule;
    return writeOutput(c.title, c.compound, c.content, c.id);
  },
  capsule_discard: (d) => {
    const r = d as CapsuleDiscardResult;
    return `id: ${r.id}\ndeleted_at: ${r.deleted_at}`;
  },
  capsule_search: (d) => searchResults(d as SearchResult[], "capsules"),
  capsule_compounds: (d) => compoundList(d as CompoundEntry[]),

  bottle_create: (d) => {
    const b = d as Bottle;
    return [
      "Bottle created",
      `id: ${b.id}`,
      `name: ${b.name}`,
      `display_name: ${b.display_name}`,
      `directory: ${b.directory}`,
      `scope: ${b.scope}`,
    ].join("\n");
  },
  bottle_list: (d) => bottleList(d as Bottle[]),
};

// ─── Clase pública ────────────────────────────────────────────────────────────

export class ResponseFormatter {
  format(tool: string, data: unknown): string {
    return recipes[tool]?.(data) ?? generic(data);
  }

  formatError(error: string, message: string, data?: unknown): string {
    const lines = [`error: ${error}`, `message: ${message}`];
    if (data !== null && data !== undefined && typeof data === "object") {
      for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
        if (v !== null && v !== undefined) lines.push(`${k}: ${v}`);
      }
    }
    return lines.join("\n");
  }
}

export const formatter = new ResponseFormatter();
