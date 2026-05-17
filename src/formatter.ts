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
  BottleContextResult,
  PrescriptionContextResult,
} from "./types.js";

// ─── Helpers de formateo ──────────────────────────────────────────────────────

// UUID v7 codifica el timestamp en milisegundos en los primeros 48 bits (12 hex
// chars). Con 8 chars solo se cubren 32 bits → colisiones en la misma ventana
// de ~65 segundos. 12 hex chars sin guiones cubren el timestamp completo.
// Mismo criterio que shortId() en webui/src/core/utils/id.ts.
//
// Ejemplo: "019e1d52-1a89-7d41-b9c0-1cc0f730b512" → "019e1d521a89"
function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 12);
}

function formatAuthor(name: string | null, email: string | null): string | null {
  if (name && email) return `${name} <${email}>`;
  if (name) return name;
  if (email) return email;
  return null;
}

function prescription(d: Prescription, includeId = false): string {
  const lines: string[] = [];
  if (includeId) lines.push(`id: ${shortId(d.id)}`);
  lines.push(`title: ${d.title}`);
  lines.push(`started_at: ${d.started_at}`);
  if (d.ended_at) lines.push(`ended_at: ${d.ended_at}`);
  const author = formatAuthor(d.author_name, d.author_email);
  if (author) lines.push(`author: ${author}`);
  return lines.join("\n");
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s*\n\s*/g, " ");
}

function searchResults(results: SearchResult[], entity: string): string {
  if (!results.length) return `No ${entity} found.`;
  const label = results.length === 1 ? entity.slice(0, -1) : entity;
  const lines = [`Found ${results.length} ${label}`];
  for (const r of results) {
    lines.push("");
    lines.push(`id: ${shortId(r.id)}`);
    lines.push(`compound: ${r.compound}`);
    lines.push(`title: ${r.title}`);
    if (r.prescription_id) lines.push(`prescription_id: ${shortId(r.prescription_id)}`);
    if (r.snippet) lines.push(`snippet: ${stripHtml(r.snippet)}`);
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
    lines.push(`${status} ${b.display_name} [${b.scope}] ${shortId(b.id)}${unlinked}`);
    lines.push(`  ${b.directory}`);
  }
  return lines.join("\n");
}

function compoundFrequencyList(entries: { compound: string; count: number }[]): string {
  if (!entries.length) return "No compounds in use.";
  return entries.map((e) => `- ${e.compound} (${e.count})`).join("\n");
}

function writeOutput(title: string, compound: string, content: string, id?: string): string {
  const idLine = id !== undefined ? `id: ${shortId(id)}\n` : "";
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
  prescription_reopen: (d) => prescription(d as Prescription, true),
  prescription_read: (d) => prescription(d as Prescription),
  prescription_discard: () => "Prescription discarded.",

  pill_store: (d) => {
    const r = d as PillStoreResult;
    return writeOutput(r.title, r.compound, r.content, r.id);
  },
  pill_read: (d) => {
    const p = d as Pill;
    const lines = [`id: ${shortId(p.id)}`, `title: ${p.title}`, `compound: ${p.compound}`];
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
    return `id: ${shortId(r.id)}\ndeleted_at: ${r.deleted_at}`;
  },
  pill_search: (d) => searchResults(d as SearchResult[], "pills"),
  bottle_context: (d) => {
    const ctx = d as BottleContextResult;
    if (!ctx.prescriptions.length) return "No prescriptions found.";
    const lines: string[] = [];
    for (const rx of ctx.prescriptions) {
      const status = rx.ended_at ? "closed" : "open";
      const started = rx.started_at.slice(0, 10);
      const dateRange = rx.ended_at ? `${started} → ${rx.ended_at.slice(0, 10)}` : started;
      lines.push(`id: ${shortId(rx.id)}`);
      lines.push(`[${status}] ${rx.title}  ${dateRange}  ${rx.pill_count} pills`);
      lines.push("");
    }
    lines.push(`---`);
    lines.push(`prescriptions: ${ctx.prescription_count}`);
    return lines.join("\n");
  },
  prescription_context: (d) => {
    const ctx = d as PrescriptionContextResult;
    if (!ctx.id) return "";
    const status = ctx.ended_at ? "closed" : "open";
    const started = ctx.started_at.slice(0, 10);
    const dateRange = ctx.ended_at ? `${started} → ${ctx.ended_at.slice(0, 10)}` : started;
    const lines = [`id: ${shortId(ctx.id)}`, `[${status}] ${ctx.title}  started: ${dateRange}`, ""];
    for (const pill of ctx.pills) {
      lines.push(`  id: ${shortId(pill.id)} [${pill.compound}] ${pill.title}`);
      lines.push(`  ${pill.snippet}`);
      lines.push("");
    }
    lines.push(`---`);
    lines.push(`pills: ${ctx.pill_count}`);
    return lines.join("\n");
  },
  pill_compounds: (d) => compoundFrequencyList(d as { compound: string; count: number }[]),

  capsule_store: (d) => {
    const r = d as CapsuleStoreResult;
    return writeOutput(r.title, r.compound, r.content, r.id);
  },
  capsule_read: (d) => {
    const c = d as Capsule;
    return `id: ${shortId(c.id)}\ntitle: ${c.title}\ncompound: ${c.compound}\ncontent: ${c.content}`;
  },
  capsule_revise: (d) => {
    const c = d as Capsule;
    return writeOutput(c.title, c.compound, c.content, c.id);
  },
  capsule_discard: (d) => {
    const r = d as CapsuleDiscardResult;
    return `id: ${shortId(r.id)}\ndeleted_at: ${r.deleted_at}`;
  },
  capsule_search: (d) => searchResults(d as SearchResult[], "capsules"),
  capsule_compounds: (d) => compoundFrequencyList(d as { compound: string; count: number }[]),

  bottle_create: (d) => {
    const b = d as Bottle;
    return [
      "Bottle created",
      `id: ${shortId(b.id)}`,
      `name: ${b.name}`,
      `display_name: ${b.display_name}`,
      `directory: ${b.directory}`,
      `scope: ${b.scope}`,
    ].join("\n");
  },
  bottle_list: (d) => bottleList(d as Bottle[]),
};

// ─── Recetas por error ────────────────────────────────────────────────────────

type ErrorRecipe = (message: string, data: unknown) => string;

const TARGET_PART_CHARS = 2000;

// `validator` crate emits Display strings like:
//   field: Validation error: rule [{"max": Number(5000), "value": String("…")}], …
// Possibly multiple fields comma-separated. We extract field, rule, and the
// param map (Number/String/Bool wrappers) into a readable list.
function parseValidationError(
  message: string,
): { field: string; rule: string; params: string }[] | null {
  const fieldRe = /(\w+): Validation error: (\w+) \[\{([^\]]*)\}\]/g;
  const paramRe = /"(\w+)": (?:Number\(([^)]+)\)|String\("([^"]*)"\)|Bool\((true|false)\))/g;
  const out: { field: string; rule: string; params: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = fieldRe.exec(message)) !== null) {
    const [, field, rule, paramsRaw] = m;
    const params: string[] = [];
    let p: RegExpExecArray | null;
    while ((p = paramRe.exec(paramsRaw)) !== null) {
      const [, key, num, str, bool] = p;
      const value = num ?? (str !== undefined ? JSON.stringify(str) : bool);
      params.push(`${key}=${value}`);
    }
    out.push({ field, rule, params: params.join(", ") });
  }
  return out.length ? out : null;
}

// serde_json messages have shape like `missing field \`title\` at line 1 column 23`.
// Strip the location suffix and reformat known patterns.
function cleanSerdeMessage(message: string): string {
  const stripped = message.replace(/\s+at line \d+ column \d+\.?$/, "").trim();
  const missing = stripped.match(/^missing field [`'"](.+?)[`'"]$/);
  if (missing) return `Missing field: ${missing[1]}`;
  const unknown = stripped.match(/^unknown field [`'"](.+?)[`'"](?:,.*)?$/);
  if (unknown) return `Unknown field: ${unknown[1]}`;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

const errorRecipes: Record<string, ErrorRecipe> = {
  content_too_large: (_message, data) => {
    const d = data as {
      actual: number;
      limit: number;
      operation: "create" | "update";
    };
    const over = d.actual - d.limit;
    const lines = [
      `error: content_too_large`,
      `Content exceeds ${d.limit} chars (got ${d.actual}, ${over} over).`,
    ];
    if (d.operation === "update") {
      // Update modifies one row in place — splitting would require creating
      // a new entry, contradicting the operation. Trim instead.
      lines.push(
        `Recommendation: trim the content (consolidate, drop low-value detail, reference adjacent entries by ID instead of re-describing). Splitting is NOT possible on update — it modifies one ID in place. If trimming would lose load-bearing information, the entry has outgrown its scope and needs a refactor.`,
      );
    } else {
      const parts = Math.ceil(d.actual / TARGET_PART_CHARS);
      lines.push(`Recommendation: split into ${parts} parts of ~${TARGET_PART_CHARS} chars each.`);
    }
    return lines.join("\n");
  },

  validation_error: (message) => {
    const parsed = parseValidationError(message);
    if (!parsed) return `error: validation_error\n${message}`;
    const lines = [`error: validation_error`];
    for (const { field, rule, params } of parsed) {
      const suffix = params ? ` (${params})` : "";
      lines.push(`${field}: failed ${rule}${suffix}`);
    }
    return lines.join("\n");
  },

  invalid_input: (message) => {
    return `error: invalid_input\n${cleanSerdeMessage(message)}`;
  },

  ambiguous_id: (_message, data) => {
    const d = data as { id_prefix: string; candidates: string[] };
    const lines = [
      `error: ambiguous_id`,
      `Prefix '${d.id_prefix}' matches ${d.candidates.length} candidates:`,
    ];
    for (const c of d.candidates) lines.push(`  ${shortId(c)}`);
    return lines.join("\n");
  },

  prescription_already_open: (_message, data) => {
    const d = data as { id: string; title: string; started_at: string; pill_count: number };
    return [
      `error: prescription_already_open`,
      `Prescription already open: ${d.title} (id: ${shortId(d.id)}, since ${d.started_at}, ${d.pill_count} pills)`,
    ].join("\n");
  },

  prescription_closed: (_message, data) => {
    const d = (data ?? {}) as { prescription_id?: string };
    const lines = [`error: prescription_closed`];
    if (d.prescription_id) lines.push(`prescription_id: ${shortId(d.prescription_id)}`);
    lines.push("Reopen the prescription with `prescription_reopen` before editing its pills.");
    return lines.join("\n");
  },

  prescription_collision: (_message, data) => {
    const d = data as { bottle_id: string; existing_id: string };
    return [
      `error: prescription_collision`,
      `bottle_id: ${shortId(d.bottle_id)}`,
      `existing_id: ${shortId(d.existing_id)}`,
      "Close the other open prescription before reopening this one.",
    ].join("\n");
  },
};

function genericError(error: string, message: string, data?: unknown): string {
  const lines = [`error: ${error}`, `message: ${message}`];
  if (data !== null && data !== undefined && typeof data === "object") {
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (v !== null && v !== undefined) lines.push(`${k}: ${v}`);
    }
  }
  return lines.join("\n");
}

// ─── Clase pública ────────────────────────────────────────────────────────────

export class ResponseFormatter {
  format(tool: string, data: unknown): string {
    return recipes[tool]?.(data) ?? generic(data);
  }

  formatError(error: string, message: string, data?: unknown): string {
    const recipe = errorRecipes[error];
    if (recipe) return recipe(message, data);
    return genericError(error, message, data);
  }
}

export const formatter = new ResponseFormatter();
