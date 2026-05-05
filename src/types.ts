/**
 * Tipos de dominio — espejo de los structs que devuelve el binario Rust.
 */

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
  id: number;
  compound: string;
  title: string;
  content: string;
  prescription_id: string;
  author_name: string | null;
  author_email: string | null;
  created_at: string;
}

export interface PillStoreResult {
  id: number;
  action: string;
  title: string;
  compound: string;
  content: string;
}

export interface PillDiscardResult {
  id: number;
  deleted_at: string;
}

export interface Capsule {
  id: number;
  compound: string;
  title: string;
  content: string;
  created_at: string;
}

export interface CapsuleStoreResult {
  id: number;
  action: string;
  title: string;
  compound: string;
  content: string;
}

export interface CapsuleDiscardResult {
  id: number;
  deleted_at: string;
}

export interface SearchResult {
  id: number;
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

export interface CompoundEntry {
  id: string;
  description: string;
  prompt_hint: string;
}

export interface ContextResult {
  context: string;
  prescription_count: number;
  pill_count: number;
}
