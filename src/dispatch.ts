/**
 * Helpers para construir respuestas MCP.
 *
 * El SDK espera { content: [{ type: "text", text: string }], isError?: boolean }
 * El texto que ve el LLM es texto plano estructurado — nunca JSON crudo.
 */

import { pillboxExec } from "./exec.js";
import type { ExecResult } from "./exec.js";
import { formatter } from "./formatter.js";

export interface McpContent {
  type: "text";
  text: string;
}

export interface McpResponse {
  [key: string]: unknown;
  content: McpContent[];
  isError?: boolean;
}

function fromExecResult(tool: string, result: ExecResult): McpResponse {
  if (result.ok) {
    return {
      content: [{ type: "text", text: formatter.format(tool, result.data) }],
    };
  }
  return {
    content: [
      {
        type: "text",
        text: formatter.formatError(result.error, result.message, result.data),
      },
    ],
    isError: true,
  };
}

export function validationError(message: string): McpResponse {
  return {
    content: [{ type: "text", text: `Validation error: ${message}` }],
    isError: true,
  };
}

export async function execTool(
  tool: string,
  input: Record<string, unknown> = {},
): Promise<McpResponse> {
  const result = await pillboxExec(tool, input);
  if (!result.ok) {
    return {
      content: [
        {
          type: "text",
          text:
            formatter.formatError(result.error, result.message, result.data) +
            `\nsent_input: ${JSON.stringify(input)}`,
        },
      ],
      isError: true,
    };
  }
  return fromExecResult(tool, result);
}
