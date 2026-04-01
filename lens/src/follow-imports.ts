import { existsSync, readFileSync } from 'fs';
import { basename, dirname, join } from 'path';

// Files we don't want to pull into LLM context — noise, not signal
const SKIP_PATTERNS = [
  /\.spec\.ts$/,
  /\.module\.ts$/,
  /\.routing\.ts$/,
  /\.routes\.ts$/,
  /\/index\.ts$/,
];

function shouldSkip(filePath: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(filePath));
}

function resolveImport(importPath: string, fromFile: string): string | null {
  const dir = dirname(fromFile);
  const candidates = [
    join(dir, importPath + '.ts'),
    join(dir, importPath, 'index.ts'),
    join(dir, importPath),
  ];
  for (const c of candidates) {
    if (existsSync(c) && c.endsWith('.ts')) return c;
  }
  return null;
}

function getRelativeImports(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf8');
  const matches = [...content.matchAll(/from\s+['"](\.[^'"]+)['"]/g)];
  return matches.map((m) => m[1]);
}

/**
 * Starting from a component .ts file, discover the related files an LLM
 * needs to understand what the component does and what it expects from the API:
 *
 *   Level 0 — the component itself + its .html template
 *   Level 1 — direct relative imports (stores, services, local types)
 *   Level 2 — relative imports from level-1 files (type definitions, interfaces)
 *
 * Only follows relative imports — node_modules and Angular framework files
 * are excluded automatically. Skips spec, module, and routing files.
 */
export function discoverRelatedFiles(entryTs: string): string[] {
  const collected: string[] = [];
  const seen = new Set<string>();

  function add(file: string) {
    if (!seen.has(file) && !shouldSkip(file)) {
      seen.add(file);
      collected.push(file);
    }
  }

  // Level 0: entry file + sibling HTML template
  add(entryTs);
  const htmlPath = entryTs.replace(/\.ts$/, '.html');
  if (existsSync(htmlPath)) add(htmlPath);

  // Level 1: direct imports from the entry
  const level1Ts: string[] = [];
  for (const imp of getRelativeImports(entryTs)) {
    const resolved = resolveImport(imp, entryTs);
    if (resolved) {
      add(resolved);
      level1Ts.push(resolved);
    }
  }

  // Level 2: imports from level-1 files (type files, etc.)
  for (const file of level1Ts) {
    for (const imp of getRelativeImports(file)) {
      const resolved = resolveImport(imp, file);
      if (resolved) add(resolved);
    }
  }

  return collected;
}
