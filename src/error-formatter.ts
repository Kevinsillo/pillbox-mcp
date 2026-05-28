/**
 * Error formatting recipes. These 4 symbols (parseValidationError,
 * cleanSerdeMessage, errorRecipes, genericError) are KEPT TOGETHER because
 * `parseValidationError` is tightly coupled to the `validator` crate's Display
 * format on the Rust side, and `cleanSerdeMessage` handles serde_json message
 * shapes; both are consumed only by `errorRecipes`. Splitting them across
 * files would scatter Rust-error-format knowledge with no benefit.
 */

import { shortId } from "./id.js";

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

export const errorRecipes: Record<string, ErrorRecipe> = {
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

  prescription_closed: (_message, data) => {
    const d = (data ?? {}) as { prescription_id?: string };
    const lines = [`error: prescription_closed`];
    if (d.prescription_id) lines.push(`prescription_id: ${shortId(d.prescription_id)}`);
    lines.push("Reopen the prescription with `prescription_reopen` before editing its pills.");
    return lines.join("\n");
  },
};

export function genericError(error: string, message: string, data?: unknown): string {
  const lines = [`error: ${error}`, `message: ${message}`];
  if (data !== null && data !== undefined && typeof data === "object") {
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (v !== null && v !== undefined) lines.push(`${k}: ${v}`);
    }
  }
  return lines.join("\n");
}
