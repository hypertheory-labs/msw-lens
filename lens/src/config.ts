import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface LensConfig {
  mocksDir: string;
}

const DEFAULTS: LensConfig = {
  mocksDir: 'src/__mocks__',
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
