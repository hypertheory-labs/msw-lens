import { existsSync, readFileSync } from 'fs';
import { basename, dirname, join } from 'path';

// Resolution order mirrors how bundlers resolve `./Foo` — try .ts first, then
// .tsx, then .js, then .jsx. TypeScript sources preferred over plain JS.
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Files we don't want to pull into LLM context — noise, not signal
const SKIP_PATTERNS = [
  /\.(spec|test)\.(tsx?|jsx?)$/, // test files — never useful
  /\/index\.(tsx?|jsx?)$/,        // barrel files — just re-exports, no content
];

function shouldSkip(filePath: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(filePath));
}

function isSourceFile(filePath: string): boolean {
  return SOURCE_EXTENSIONS.some((ext) => filePath.endsWith(ext));
}

function resolveImport(importPath: string, fromFile: string): string | null {
  const dir = dirname(fromFile);
  const candidates: string[] = [];
  for (const ext of SOURCE_EXTENSIONS) {
    candidates.push(join(dir, importPath + ext));
  }
  for (const ext of SOURCE_EXTENSIONS) {
    candidates.push(join(dir, importPath, 'index' + ext));
  }
  candidates.push(join(dir, importPath));
  for (const c of candidates) {
    if (existsSync(c) && isSourceFile(c)) return c;
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
 *   Level 0 — the component itself + its sibling template (if templateExtension is set)
 *   Level 1 — direct relative imports (stores, services, local types)
 *   Level 2 — relative imports from level-1 files (type definitions, interfaces)
 *
 * Only follows relative imports — node_modules are excluded automatically.
 * Skips spec files and barrel index files.
 */
export function discoverRelatedFiles(entryTs: string, templateExtension: string | null = null): string[] {
  const collected: string[] = [];
  const seen = new Set<string>();

  function add(file: string) {
    if (!seen.has(file) && !shouldSkip(file)) {
      seen.add(file);
      collected.push(file);
    }
  }

  // Level 0: entry file + sibling template (if framework uses a separate template file)
  add(entryTs);
  if (templateExtension) {
    const templatePath = entryTs.replace(/\.ts$/, templateExtension);
    if (existsSync(templatePath)) add(templatePath);
  }

  // Level 1: direct imports from the entry
  const level1Ts: string[] = [];
  for (const imp of getRelativeImports(entryTs)) {
    const resolved = resolveImport(imp, entryTs);
    if (resolved) {
      add(resolved);
      level1Ts.push(resolved);
    }
  }

  // Level 2: imports from level-1 files (type definitions, etc.)
  // add() applies SKIP_PATTERNS — the filter runs here too, just via the helper.
  for (const file of level1Ts) {
    for (const imp of getRelativeImports(file)) {
      const resolved = resolveImport(imp, file);
      if (resolved) add(resolved);
    }
  }

  return collected;
}
