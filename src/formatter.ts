/**
 * Recetas de formateo por tool — convierte el JSON de Rust a texto plano estructurado
 * listo para consumir por el LLM.
 */

// ─── Tipos de dominio (espejo de los structs Rust) ────────────────────────────

interface Prescription {
  id: string;
  bottle_id: string;
  title: string;
  started_at: string;
  ended_at?: string | null;
}

interface Pill {
  id: number;
  compound: string;
  title: string;
  content: string;
  prescription_id: string;
  created_at: string;
}

interface PillTakeResult {
  id: number;
  action: string;
  title: string;
  compound: string;
  content: string;
}

interface PillDiscardResult {
  id: number;
  deleted_at: string;
}

interface Capsule {
  id: number;
  compound: string;
  title: string;
  content: string;
  created_at: string;
}

interface CapsuleTakeResult {
  id: number;
  action: string;
  title: string;
  compound: string;
  content: string;
}

interface CapsuleDiscardResult {
  id: number;
  deleted_at: string;
}

interface SearchResult {
  id: number;
  compound: string;
  title: string;
  snippet: string;
  prescription_id?: string;
}

interface Bottle {
  id: string;
  name: string;
  display_name: string;
  directory: string;
  scope: string;
  linked: boolean;
}

interface CompoundEntry {
  id: string;
  description: string;
  prompt_hint: string;
}

interface PillContextResult {
  context: string;
  prescription_count: number;
  pill_count: number;
}

// ─── Helpers de formateo ──────────────────────────────────────────────────────

function prescription(d: Prescription, includeId = false): string {
  const lines: string[] = [];
  if (includeId) lines.push(`id: ${d.id}`);
  lines.push(`title: ${d.title}`);
  lines.push(`started_at: ${d.started_at}`);
  if (d.ended_at) lines.push(`ended_at: ${d.ended_at}`);
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

function writeOutput(title: string, compound: string, content: string): string {
  return `title: ${title}\ncompound: ${compound}\ncontent: ${content}`;
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

  pill_take: (d) => {
    const r = d as PillTakeResult;
    return writeOutput(r.title, r.compound, r.content);
  },
  pill_read: (d) => {
    const p = d as Pill;
    return `id: ${p.id}\ntitle: ${p.title}\ncompound: ${p.compound}\ncontent: ${p.content}`;
  },
  pill_revise: (d) => {
    const p = d as Pill;
    return writeOutput(p.title, p.compound, p.content);
  },
  pill_discard: (d) => {
    const r = d as PillDiscardResult;
    return `id: ${r.id}\ndeleted_at: ${r.deleted_at}`;
  },
  pill_search: (d) => searchResults(d as SearchResult[], "pills"),
  pill_context: (d) => {
    const ctx = d as PillContextResult;
    return `${ctx.context}\n---\nprescriptions: ${ctx.prescription_count} | pills: ${ctx.pill_count}`;
  },
  pill_compounds: (d) => compoundList(d as CompoundEntry[]),

  capsule_take: (d) => {
    const r = d as CapsuleTakeResult;
    return writeOutput(r.title, r.compound, r.content);
  },
  capsule_read: (d) => {
    const c = d as Capsule;
    return `id: ${c.id}\ntitle: ${c.title}\ncompound: ${c.compound}\ncontent: ${c.content}`;
  },
  capsule_revise: (d) => {
    const c = d as Capsule;
    return writeOutput(c.title, c.compound, c.content);
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
