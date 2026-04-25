import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, join, relative } from 'path';
import type { Manifest } from './discover.js';
import type { LensConfig } from './config.js';
import { discoverRelatedFiles } from './follow-imports.js';
import { MANIFEST_FORMAT_BODY } from './manifest-format.js';

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
    '2. For each endpoint, generate a `.yaml` manifest in msw-lens format (see "Manifest pattern" below)',
    '3. For each endpoint, also generate a handler stub (`.ts`) with a switch statement',
    '   over the scenario names (see "Handler pattern" below)',
    '4. Register the new handler in `handlers.ts` — match the import pattern shown above',
    '5. For each scenario, cover: happy path, empty/null states, error conditions',
    '   (with appropriate HTTP status codes), slow/timeout, and any edge cases the',
    '   **response type shape** suggests I haven\'t anticipated',
    '',
    '**On scenario descriptions:** say what UI behavior it tests, not what the data',
    'looks like. Not: "Returns an empty items array." Instead: "Tests that the empty',
    'cart message appears and the checkout button disables."',
    '',
    '**If an endpoint already has a manifest** below: do not generate a new one. Suggest',
    'scenarios to add to the existing manifest (or note that coverage is sufficient), and',
    'be explicit about which endpoints you treated this way.',
    '',
    'Follow the canonical Manifest pattern in the "About msw-lens" section below. If you',
    'notice anything in the component or its markup that suggests a scenario I should',
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
    `alongside handlers under \`${config.mocksDir}/\`. msw-lens writes two tool-owned files:`,
    `\`${config.mocksDir}/active-scenarios.ts\` (which scenario is active per endpoint) and`,
    `\`${config.mocksDir}/bypassed-endpoints.ts\` (endpoints that pass through to the real API`,
    'instead of being mocked). Vite HMR picks up changes immediately.',
    '',
    'Both files are tool-owned. Do not include instructions to edit them manually.',
    '',
    'Bypass requires MSW worker started with `onUnhandledRequest: \'bypass\'` — otherwise',
    'unhandled requests warn or error instead of passing through.',
    '',
    '### Manifest pattern (match this exactly)',
    '',
    MANIFEST_FORMAT_BODY,
    '',
    '### Handler pattern (match this exactly)',
    '',
    'Every handler follows the shape below. Three things are non-negotiable:',
    '',
    '1. **Default-import** `activeScenarios` — the file uses `export default`, not a named export.',
    '2. **Key lookup uses `` `METHOD ${ENDPOINT}` ``** — the switcher writes keys in that format. Missing the method prefix means the switcher has no effect and the handler silently falls through to the default case.',
    '3. **Default-export the handler array** as `HttpHandler[]` — `handlers.ts` aggregates by importing each as a default and spreading.',
    '',
    '```typescript',
    "import { http, HttpHandler, HttpResponse, delay } from 'msw';",
    "import activeScenarios from '../active-scenarios';",
    '',
    "const ENDPOINT = '/api/cart';",
    '',
    'export default [',
    '  http.get(ENDPOINT, async () => {',
    "    const scenario = activeScenarios[`GET ${ENDPOINT}`] ?? 'typical';",
    '',
    '    switch (scenario) {',
    "      case 'empty':",
    '        return HttpResponse.json({ items: [], total: 0 });',
    "      case 'unauthorized':",
    '        // Returning a structured ProblemDetails body — see manifest `errorType`',
    '        return HttpResponse.json(',
    "          { type: 'about:blank', title: 'Session expired', status: 401 },",
    '          { status: 401 }',
    '        );',
    "      case 'server-error':",
    '        return new HttpResponse(null, { status: 500 });',
    "      case 'slow':",
    "        await delay('real');",
    '        return HttpResponse.json(typicalResponse);',
    "      case 'never-resolves':",
    "        // delay('infinite') — request never settles; tests timeout / loading-stuck UI",
    "        await delay('infinite');",
    '        return HttpResponse.json(typicalResponse);',
    "      case 'typical':",
    '      default:',
    '        return HttpResponse.json(typicalResponse);',
    '    }',
    '  }),',
    '] as HttpHandler[];',
    '```',
    '',
    'Register in `handlers.ts` (with the bypass filter):',
    '',
    '```typescript',
    "import { HttpHandler } from 'msw';",
    "import cartHandler from './cart/cart';",
    "import bypassed from './bypassed-endpoints';",
    '',
    'const all: HttpHandler[] = [...cartHandler];',
    '',
    'export const handlers: HttpHandler[] = all.filter((h) => {',
    '  const { method, path } = h.info;',
    "  if (typeof method !== 'string' || typeof path !== 'string') return true;",
    '  return !bypassed.has(`${method} ${path}`);',
    '});',
    '```',
    '',
    '`bypassed-endpoints.ts` is tool-owned. The filter removes bypassed endpoints from MSW',
    'registration entirely so matching requests pass through to the real network. Requires',
    "`worker.start({ onUnhandledRequest: 'bypass' })`.",
    '',
    'Scenario archetypes to consider:',
    '',
    SCENARIO_ARCHETYPES,
    ''
  );

  const promptFileName = basename(entryFile).replace(STRIPPABLE_EXTENSIONS, '') + '.md';
  writeFileSync(join(promptsDir, promptFileName), lines.join('\n'), 'utf8');
}
