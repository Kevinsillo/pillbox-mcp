#!/usr/bin/env node
// Registers the Pillbox MCP server in a provider's config, preserving JSONC
// comments and formatting. Idempotent: writes nothing when already registered.
//
// Usage: node scripts/register-mcp.mjs <claude-code|opencode> <entryPath>

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse, modify, applyEdits, printParseErrorCode } from 'jsonc-parser';

const [provider, entry] = process.argv.slice(2);

if (!provider || !entry) {
  console.error('Usage: register-mcp.mjs <claude-code|opencode> <entryPath>');
  process.exit(2);
}

const targets = {
  'claude-code': {
    cfg: path.join(os.homedir(), '.claude.json'),
    keyPath: ['mcpServers', 'pillbox'],
    value: { command: 'node', args: [entry] },
  },
  opencode: {
    cfg: path.join(os.homedir(), '.config', 'opencode', 'opencode.json'),
    keyPath: ['mcp', 'pillbox'],
    value: { type: 'local', command: ['node', entry], enabled: true },
  },
};

const target = targets[provider];
if (!target) {
  console.error(`Unknown provider: ${provider}`);
  process.exit(2);
}

const { cfg, keyPath, value } = target;

fs.mkdirSync(path.dirname(cfg), { recursive: true });

let text = fs.existsSync(cfg) ? fs.readFileSync(cfg, 'utf8') : '';
if (text.trim() === '') {
  text = '{}\n';
}

const errors = [];
const root = parse(text, errors, { disallowComments: false, allowTrailingComma: true });
if (errors.length > 0) {
  const details = errors.map((e) => `${printParseErrorCode(e.error)} at offset ${e.offset}`).join(', ');
  console.error(`Refusing to modify ${cfg}: it is not valid JSON/JSONC (${details}).`);
  console.error('Comments are allowed, but braces, brackets and commas must balance. Fix the file and re-run.');
  process.exit(1);
}

const current = keyPath.reduce((obj, key) => (obj == null ? undefined : obj[key]), root);
if (deepEqual(current, value)) {
  console.log(`already-registered:${cfg}`);
  process.exit(0);
}

const edits = modify(text, keyPath, value, {
  formattingOptions: { insertSpaces: true, tabSize: 2, eol: '\n' },
});
fs.writeFileSync(cfg, applyEdits(text, edits));
console.log(`registered:${cfg}`);

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]));
}
