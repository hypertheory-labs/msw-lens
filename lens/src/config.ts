import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface LensConfig {
  mocksDir: string;
  templateExtension: string | null; // e.g. '.html' for Angular, null for React (inline JSX)
}

const DEFAULTS: LensConfig = {
  mocksDir: 'src/__mocks__',
  templateExtension: '.html',
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
