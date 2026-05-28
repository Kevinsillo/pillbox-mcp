/**
 * UUID v7 helpers compartidos.
 *
 * UUID v7 codifica el timestamp en milisegundos en los primeros 48 bits (12 hex
 * chars). Con 8 chars solo se cubren 32 bits → colisiones en la misma ventana
 * de ~65 segundos. 12 hex chars sin guiones cubren el timestamp completo.
 * Mismo criterio que shortId() en webui/src/core/utils/id.ts.
 *
 * Ejemplo: "019e1d52-1a89-7d41-b9c0-1cc0f730b512" → "019e1d521a89"
 */
export function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 12);
}
