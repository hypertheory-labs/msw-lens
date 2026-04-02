import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Convention: active-scenarios.ts lives at the root of the __mocks__ directory.
// This is opinionated — configuration support is a future backlog item.
const STATE_PATH = 'src/app/__mocks__/active-scenarios.ts';

export function readActiveScenarios(cwd: string): Record<string, string> {
  const fullPath = join(cwd, STATE_PATH);
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

export function writeActiveScenarios(cwd: string, selections: Record<string, string>): void {
  const fullPath = join(cwd, STATE_PATH);
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
