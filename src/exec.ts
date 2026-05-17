/**
 * Cliente persistente del subproceso `pillbox mcp run`.
 *
 * Mantiene un único child spawneado durante toda la vida del wrapper MCP.
 * Multiplexa peticiones en flight con un Map id→{resolve,reject,timer} y
 * un UUID por request. El protocolo es NDJSON (una línea JSON por dirección).
 *
 * Recovery:
 *  - on('exit'/'error') del child: rechaza todas las pendientes con
 *    `exec_child_died` y resetea el singleton. La próxima llamada
 *    respawnea transparentemente.
 *  - timeout de 15s por request: resuelve con `exec_timeout` y libera el
 *    slot del Map; NO mata al child (el resto de pendientes siguen vivas).
 */

import { spawn, type ChildProcess } from "node:child_process";
import type { Readable, Writable } from "node:stream";
import { createInterface, type Interface } from "node:readline";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

// ─── Localización del binario ─────────────────────────────────────────────────

function pillboxBin(): string {
  if (process.env.PILLBOX_BIN) {
    return resolve(process.env.PILLBOX_BIN);
  }
  return "pillbox";
}

// ─── Tipos de respuesta ───────────────────────────────────────────────────────

export interface ExecOk<T = unknown> {
  ok: true;
  data: T;
}

export interface ExecErr {
  ok: false;
  error: string;
  message: string;
  data?: unknown;
}

export type ExecResult<T = unknown> = ExecOk<T> | ExecErr;

/** Wire format de respuesta del binario (incluye id de correlación). */
interface WireResponse {
  id: string;
  ok: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

// ─── Singleton del child ──────────────────────────────────────────────────────

const TIMEOUT_MS = 15_000;

interface Pending {
  resolve: (r: ExecResult) => void;
  timer: NodeJS.Timeout;
}

// Tipo del child: stdin/stdout son pipes (Writable/Readable), stderr es
// `'inherit'` → null en el handle. Anotamos manualmente porque spawn devuelve
// `ChildProcess` (unión amplia) cuando los stdio son mixtos.
interface ChildProc extends ChildProcess {
  stdin: Writable;
  stdout: Readable;
}

interface Child {
  proc: ChildProc;
  rl: Interface;
  pending: Map<string, Pending>;
}

let child: Child | null = null;

function ensureChild(): Child {
  if (child) return child;

  const proc = spawn(pillboxBin(), ["mcp", "run"], {
    stdio: ["pipe", "pipe", "inherit"],
  }) as ChildProc;

  const rl = createInterface({ input: proc.stdout });
  const pending = new Map<string, Pending>();
  const c: Child = { proc, rl, pending };

  rl.on("line", (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg: WireResponse;
    try {
      msg = JSON.parse(trimmed) as WireResponse;
    } catch {
      // Línea no-JSON en stdout del child: imposible en operación normal
      // (tracing va a stderr). Si llega aquí, ignorar — el timeout cubrirá
      // las pendientes si el child está realmente roto.
      return;
    }
    const slot = c.pending.get(msg.id);
    if (!slot) return; // id desconocido (e.g. respuesta a request ya expirada)
    clearTimeout(slot.timer);
    c.pending.delete(msg.id);
    if (msg.ok) {
      slot.resolve({ ok: true, data: msg.data });
    } else {
      slot.resolve({
        ok: false,
        error: msg.error ?? "unknown_error",
        message: msg.message ?? "",
        data: msg.data,
      });
    }
  });

  const die = (cause: string, detail: string) => {
    if (child !== c) return; // ya reemplazado/limpiado
    for (const [, slot] of c.pending) {
      clearTimeout(slot.timer);
      slot.resolve({
        ok: false,
        error: "exec_child_died",
        message: `${cause}: ${detail}`,
      });
    }
    c.pending.clear();
    try {
      c.rl.close();
    } catch {
      // ignore
    }
    child = null;
  };

  proc.on("exit", (code, signal) => {
    die("child exited", `code=${code} signal=${signal}`);
  });
  proc.on("error", (err: Error) => {
    die("child spawn error", err.message);
  });

  child = c;
  return c;
}

// ─── API pública ──────────────────────────────────────────────────────────────

export async function pillboxExec<T = unknown>(
  tool: string,
  input: Record<string, unknown> = {},
): Promise<ExecResult<T>> {
  const c = ensureChild();
  const id = randomUUID();
  const payload = JSON.stringify({ id, tool, input, cwd: process.cwd() });

  return new Promise<ExecResult<T>>((resolvePromise) => {
    const timer = setTimeout(() => {
      if (c.pending.delete(id)) {
        resolvePromise({
          ok: false,
          error: "exec_timeout",
          message: `tool '${tool}' did not respond within ${TIMEOUT_MS}ms`,
        });
      }
    }, TIMEOUT_MS);

    c.pending.set(id, {
      resolve: resolvePromise as (r: ExecResult) => void,
      timer,
    });

    try {
      c.proc.stdin.write(payload + "\n");
    } catch (e) {
      clearTimeout(timer);
      c.pending.delete(id);
      resolvePromise({
        ok: false,
        error: "exec_write_failed",
        message: (e as Error).message,
      });
    }
  });
}
