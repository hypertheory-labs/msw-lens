import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, join, relative } from 'path';
import type { Manifest } from './discover.js';
import type { LensConfig } from './config.js';
import { discoverRelatedFiles } from './follow-imports.js';

const LENS_DIR = '.msw-lens';
const PROMPTS_DIR = join(LENS_DIR, 'prompts');

const SCENARIO_ARCHETYPES = `
**Document endpoints** (single item responses):
- \`happy-path\` — successful response with typical data
- \`not-found\` — 404, resource doesn't exist
- \`unauthorized\` — 401, tests auth guards and login redirect
- \`server-error\` — 500, tests error boundary or fallback UI
- \`slow\` — MSW delay('real'), tests loading/skeleton states
- \`malformed-data\` — response missing optional fields or with unexpected nulls

**Collection endpoints** (array/list responses):
- \`typical\` — N items, normal case
- \`empty\` — zero items, tests empty-state UI
- \`overloaded\` — far more items than the UI was designed for (tests pagination, overflow)
- \`slow\` — tests loading skeleton
- \`unauthorized\` — 401
- \`server-error\` — 500

**Mutation endpoints** (POST / PUT / PATCH / DELETE):
- \`success\` / \`created\` — 201/202/204, happy path; tests UI confirmation, redirect, or form reset
- \`validation-error\` — 400/422, field-level ProblemDetails; tests whether error messages surface per-field or as a summary
- \`conflict\` — 409, duplicate or constraint violation; tests whether the UI surfaces a meaningful message
- \`unauthorized\` — 401, session expired mid-form; tests redirect or inline session error
- \`forbidden\` — 403, insufficient role; tests whether the UI blocks submission or shows an access error
- \`server-error\` — 500; tests whether the form retains input and shows a recoverable error message
- \`slow\` — MSW delay('real'); tests whether the submit button shows a pending/disabled state during submission
`.trim();

function fenceLang(filePath: string): string {
  if (filePath.endsWith('.html')) return 'html';
  if (filePath.endsWith('.jsx')) return 'jsx';
  if (filePath.endsWith('.js')) return 'javascript';
  return 'typescript';
}

function inlineFile(filePath: string, cwd: string): string {
  const rel = relative(cwd, filePath);
  const content = readFileSync(filePath, 'utf8');
  return [`### ${basename(filePath)}`, `\`${rel}\``, `\`\`\`${fenceLang(filePath)}`, content.trim(), '```'].join(
    '\n'
  );
}

// Strip source-file extensions so `cart.component.ts`, `Cart.tsx`, `cart.ts`
// all collapse to a framework-neutral identifier.
const STRIPPABLE_EXTENSIONS = /\.(component\.ts|tsx?|jsx?)$/;

function deriveComponentName(filePath: string): string {
  return basename(filePath)
    .replace(STRIPPABLE_EXTENSIONS, '')
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
  manifests: Manifest[],
  config: LensConfig
): void {
  const dir = join(cwd, LENS_DIR);
  if (!existsSync(dir)) mkdirSync(dir);
  const promptsDir = join(cwd, PROMPTS_DIR);
  if (!existsSync(promptsDir)) mkdirSync(promptsDir);

  const timestamp = new Date().toISOString();
  const relEntry = relative(cwd, entryFile);
  const compName = deriveComponentName(entryFile);

  const relatedFiles = discoverRelatedFiles(entryFile, config.templateExtension);

  const lines: string[] = [
    '# msw-lens context',
    `generated: ${timestamp}`,
    `entry: ${relEntry}`,
    '',
    '---',
    '',
    '## The ask',
    '',
    `I'm working on the \`${compName}\` component in a web application and want to`,
    'create MSW mock scenarios for the endpoints it depends on.',
    '',
    'Based on the source files below, please:',
    '',
    '1. Identify the HTTP endpoints this component reaches — through its hooks, stores, services, or direct fetch/http calls',
    '2. For each endpoint, generate a `.yaml` manifest in msw-lens format',
    '3. For each endpoint, also generate a handler stub (`.ts`) with a switch statement',
    '   over the scenario names — match the pattern in the existing handler files',
    '4. Register the new handler in `handlers.ts` — match the existing import pattern',
    '5. For each scenario, cover: happy path, empty/null states, error conditions',
    '   (with appropriate HTTP status codes), slow/timeout, and any edge cases the',
    '   **response type shape** suggests I haven\'t anticipated',
    '',
    '**On scenario descriptions:** say what UI behavior it tests, not what the data',
    'looks like. Not: "Returns an empty items array." Instead: "Tests that the empty',
    'cart message appears and the checkout button disables."',
    '',
    'Use the format and vocabulary from the existing manifests below. If you notice',
    'anything in the component or its markup that suggests a scenario I should',
    'consider but haven\'t asked about — flag it.',
    '',
    'If the provided files are incomplete — init methods with no visible call site,',
    'protected routes with no guard in scope, dependencies that seem to come from',
    'outside what was crawled — **list your assumptions explicitly** rather than',
    'silently filling the gaps.',
    '',
    '---',
    '',
    '## Source files',
    '',
  ];

  for (const file of relatedFiles) {
    lines.push(inlineFile(file, cwd), '');
  }

  // handlers.ts registration file — shows where to register new handlers
  const handlersPath = join(cwd, config.mocksDir, 'handlers.ts');
  if (existsSync(handlersPath)) {
    lines.push('---', '', '## Handler registration', '');
    lines.push(inlineFile(handlersPath, cwd), '');
  }

  if (manifests.length > 0) {
    lines.push('---', '', '## Existing manifests + handlers (pattern reference)', '');
    for (const m of manifests) {
      const rel = relative(cwd, m._filePath);
      const content = readFileSync(m._filePath, 'utf8');
      lines.push(`### ${basename(m._filePath)}`, `\`${rel}\``, '```yaml', content.trim(), '```', '');

      // Include the sibling handler .ts alongside the manifest
      const handlerPath = m._filePath.replace(/\.yaml$/, '.ts');
      if (existsSync(handlerPath)) {
        lines.push(inlineFile(handlerPath, cwd), '');
      }
    }
  }

  lines.push(
    '---',
    '',
    '## About msw-lens',
    '',
    'msw-lens manages MSW scenario switching for web development. Manifests live',
    `alongside handlers in \`__mocks__\` directories. The active scenario is written to`,
    `\`${config.mocksDir}/active-scenarios.ts\` — Vite HMR picks it up immediately.`,
    '',
    '`active-scenarios.ts` is tool-owned. Do not include instructions to edit it manually.',
    '',
    'Scenario archetypes to consider:',
    '',
    SCENARIO_ARCHETYPES,
    ''
  );

  const promptFileName = basename(entryFile).replace(STRIPPABLE_EXTENSIONS, '') + '.md';
  writeFileSync(join(promptsDir, promptFileName), lines.join('\n'), 'utf8');
}
