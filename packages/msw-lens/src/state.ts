import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { LensConfig } from './config.js';

function statePath(config: LensConfig): string {
  return join(config.mocksDir, 'active-scenarios.ts');
}

export function readActiveScenarios(cwd: string, config: LensConfig): Record<string, string> {
  const fullPath = join(cwd, statePath(config));
  try {
    const content = readFileSync(fullPath, 'utf8');
    const match = content.match(/=\s*\{([^}]*)\}/);
    if (!match) return {};
    const entries: Record<string, string> = {};
    for (const line of match[1].split('\n')) {
      const m = line.match(/'([^']+)':\s*'([^']+)'/);
      if (m) entries[m[1]] = m[2];
    }
    return entries;
  } catch {
    return {};
  }
}

export function writeActiveScenarios(cwd: string, config: LensConfig, selections: Record<string, string>): void {
  const fullPath = join(cwd, statePath(config));
  const entries = Object.entries(selections)
    .map(([k, v]) => `  '${k}': '${v}',`)
    .join('\n');

  const content = `/**
 * Active scenario selection for MSW handlers.
 * This file is written by msw-lens — do not edit manually.
 * Keys are "METHOD endpoint", values are scenario names defined in the handler.
 */
const activeScenarios: Record<string, string> = {
${entries}
};

export default activeScenarios;
`;
  writeFileSync(fullPath, content, 'utf8');
}
