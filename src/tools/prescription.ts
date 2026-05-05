/**
 * Tools de gestión de prescripciones (sesiones de trabajo) y contexto de navegación.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execTool } from "../dispatch.js";
import {
  PrescriptionOpenSchema,
  PrescriptionCloseSchema,
  PrescriptionReadSchema,
  PrescriptionDiscardSchema,
  PrescriptionContextSchema,
} from "../schemas.js";

export function registerPrescriptionTools(server: McpServer): void {
  server.registerTool(
    "prescription_open",
    {
      description:
        "Abre una nueva prescripción (sesión de trabajo) para un bottle. " +
        "Devuelve el ID de la prescripción creada. " +
        "Si ya hay una abierta, devuelve error `prescription_already_open` con sus datos.",
      inputSchema: PrescriptionOpenSchema.shape,
    },
    async (input) => execTool("prescription_open", input),
  );

  server.registerTool(
    "prescription_close",
    {
      description: "Cierra una prescripción abierta. Finaliza la sesión de trabajo.",
      inputSchema: PrescriptionCloseSchema.shape,
    },
    async (input) => execTool("prescription_close", input),
  );

  server.registerTool(
    "prescription_read",
    {
      description: "Lee los detalles de una prescripción por su ID.",
      inputSchema: PrescriptionReadSchema.shape,
    },
    async (input) => execTool("prescription_read", input),
  );

  server.registerTool(
    "prescription_discard",
    {
      description: "Descarta una prescripción y hace soft-delete en cascada de todas sus pills.",
      inputSchema: PrescriptionDiscardSchema.shape,
    },
    async (input) => execTool("prescription_discard", input),
  );

  server.registerTool(
    "prescription_context",
    {
      description:
        "Pills de una prescription concreta con id, compound, título y snippet de 300 chars. " +
        "Usar tras bottle_context para profundizar en una sesión de trabajo específica. " +
        "Para el contenido completo de una pill individual, usar pill_read.",
      inputSchema: PrescriptionContextSchema.shape,
    },
    async (input) => execTool("prescription_context", input),
  );
}
