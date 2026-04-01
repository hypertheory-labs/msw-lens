import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, join, relative } from 'path';
import type { Manifest } from './discover.js';
import { discoverRelatedFiles } from './follow-imports.js';

const LENS_DIR = '.msw-lens';

const SCENARIO_ARCHETYPES = `
**Document endpoints** (single item responses):
- \`happy-path\` — successful response with typical data
- \`not-found\` — 404, resource doesn't exist
- \`unauthorized\` — 401, tests auth guards and login redirect
- \`server-error\` — 500, tests error boundary or fallback UI
- \`slow\` — MSW delay:realistic, tests loading/skeleton states
- \`malformed-data\` — response missing optional fields or with unexpected nulls

**Collection endpoints** (array/list responses):
- \`typical\` — N items, normal case
- \`empty\` — zero items, tests empty-state UI
- \`overloaded\` — far more items than the UI was designed for (tests pagination, overflow)
- \`slow\` — tests loading skeleton
- \`unauthorized\` — 401
- \`server-error\` — 500
`.trim();

function inlineFile(filePath: string, cwd: string): string {
  const rel = relative(cwd, filePath);
  const content = readFileSync(filePath, 'utf8');
  const lang = filePath.endsWith('.html') ? 'html' : 'typescript';
  return [`### ${basename(filePath)}`, `\`${rel}\``, `\`\`\`${lang}`, content.trim(), '```'].join(
    '\n'
  );
}

function deriveComponentName(filePath: string): string {
  return basename(filePath)
    .replace(/\.component\.ts$/, '')
    .replace(/\.ts$/, '')
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/**
 * Generates .msw-lens/prompt.md — a ready-to-paste LLM prompt that includes
 * the full source of a component and its dependencies, existing manifests for
 * pattern reference, and a pre-written ask that uses the msw-lens scenario
 * vocabulary. Developer pastes it into any LLM conversation to get specific,
 * accurate manifest + handler suggestions for their component.
 */
export function generatePromptFile(
  entryFile: string,
  cwd: string,
  manifests: Manifest[]
): void {
  const dir = join(cwd, LENS_DIR);
  if (!existsSync(dir)) mkdirSync(dir);

  const timestamp = new Date().toISOString();
  const relEntry = relative(cwd, entryFile);
  const compName = deriveComponentName(entryFile);

  const relatedFiles = discoverRelatedFiles(entryFile);

  const lines: string[] = [
    '# msw-lens context',
    `generated: ${timestamp}`,
    `entry: ${relEntry}`,
    '',
    '---',
    '',
    '## The ask',
    '',
    `I'm working on the \`${compName}\` component in an Angular application and want to`,
    'create MSW mock scenarios for the endpoints it depends on.',
    '',
    'Based on the source files below, please:',
    '',
    '1. Identify the HTTP endpoints this component reaches (through its store or service)',
    '2. For each endpoint, generate a `.yaml` manifest in msw-lens format',
    '3. For each endpoint, also generate a handler stub (`.ts`) with a switch statement',
    '   over the scenario names — match the pattern in the existing manifests',
    '4. For each scenario, cover: happy path, empty/null states, error conditions',
    '   (with appropriate HTTP status codes), slow/timeout, and any edge cases the',
    '   **response type shape** suggests I haven\'t anticipated',
    '',
    '**On scenario descriptions:** say what UI behavior it tests, not what the data',
    'looks like. Not: "Returns an empty items array." Instead: "Tests that the empty',
    'cart message appears and the checkout button disables."',
    '',
    'Use the format and vocabulary from the existing manifests below. If you notice',
    'anything in the component or template that suggests a scenario I should consider',
    'but haven\'t asked about — flag it.',
    '',
    '---',
    '',
    '## Source files',
    '',
  ];

  for (const file of relatedFiles) {
    lines.push(inlineFile(file, cwd), '');
  }

  if (manifests.length > 0) {
    lines.push('---', '', '## Existing manifests (pattern reference)', '');
    for (const m of manifests) {
      const rel = relative(cwd, m._filePath);
      const content = readFileSync(m._filePath, 'utf8');
      lines.push(`### ${basename(m._filePath)}`, `\`${rel}\``, '```yaml', content.trim(), '```', '');
    }
  }

  lines.push(
    '---',
    '',
    '## About msw-lens',
    '',
    'msw-lens manages MSW scenario switching for Angular development. Manifests live',
    'alongside handlers in `__mocks__` directories. The active scenario is written to',
    '`src/app/__mocks__/active-scenarios.ts` — Vite HMR picks it up immediately.',
    '',
    '`active-scenarios.ts` is tool-owned. Do not include instructions to edit it manually.',
    '',
    'Scenario archetypes to consider:',
    '',
    SCENARIO_ARCHETYPES,
    ''
  );

  writeFileSync(join(dir, 'prompt.md'), lines.join('\n'), 'utf8');
}
