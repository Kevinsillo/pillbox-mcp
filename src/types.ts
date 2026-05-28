/**
 * Tipos de dominio — espejo de los structs que devuelve el binario Rust.
 */

/**
 * Forma de respuesta que espera el SDK MCP.
 *
 * El SDK requiere { content: [{ type: "text", text: string }], isError?: boolean }.
 * El texto que ve el LLM es texto plano estructurado — nunca JSON crudo.
 */
export interface McpContent {
  type: "text";
  text: string;
}

export interface McpResponse {
  [key: string]: unknown;
  content: McpContent[];
  isError?: boolean;
}

export interface Prescription {
  id: string;
  bottle_id: string;
  title: string;
  started_at: string;
  ended_at?: string | null;
  author_name: string | null;
  author_email: string | null;
}

export interface Pill {
  id: string;
  compound: string;
  title: string;
  content: string;
  prescription_id: string;
  author_name: string | null;
  author_email: string | null;
  created_at: string;
}

export interface PillStoreResult {
  id: string;
  action: string;
  title: string;
  compound: string;
  content: string;
}

export interface PillDiscardResult {
  id: string;
  deleted_at: string;
}

export interface Capsule {
  id: string;
  compound: string;
  title: string;
  content: string;
  created_at: string;
}

export interface CapsuleStoreResult {
  id: string;
  action: string;
  title: string;
  compound: string;
  content: string;
}

export interface CapsuleDiscardResult {
  id: string;
  deleted_at: string;
}

export interface SearchResult {
  id: string;
  compound: string;
  title: string;
  snippet: string;
  prescription_id?: string;
}

export interface Bottle {
  id: string;
  name: string;
  display_name: string;
  directory: string;
  scope: string;
  linked: boolean;
}

export interface BottleRxEntry {
  id: string;
  title: string;
  started_at: string;
  ended_at?: string | null;
  pill_count: number;
}

export interface BottleContextResult {
  prescription_count: number;
  prescriptions: BottleRxEntry[];
}

export interface PrescriptionPillEntry {
  id: string;
  compound: string;
  title: string;
  snippet: string;
}

export interface PrescriptionContextResult {
  id: string | null;
  title: string;
  started_at: string;
  ended_at?: string | null;
  pill_count: number;
  pills: PrescriptionPillEntry[];
}
