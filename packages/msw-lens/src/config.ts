import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface LensConfig {
  mocksDir: string;
  // Sibling template file extension, for frameworks that separate template from
  // logic. Angular: '.html'. React/Vue-with-inline-templates/Svelte: leave null.
  templateExtension: string | null;
}

const DEFAULTS: LensConfig = {
  mocksDir: 'src/mocks',
  templateExtension: null,
};

export function readConfig(cwd: string): LensConfig {
  try {
    const pkgPath = join(cwd, 'package.json');
    if (!existsSync(pkgPath)) return DEFAULTS;
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return { ...DEFAULTS, ...(pkg['msw-lens'] ?? {}) };
  } catch {
    return DEFAULTS;
  }
}
