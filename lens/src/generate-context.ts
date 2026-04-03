import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import type { Manifest } from './discover.js';
import type { LensConfig } from './config.js';

const LENS_DIR = '.msw-lens';

function howItWorks(config: LensConfig): string {
  return `## How msw-lens works

msw-lens reads scenario manifests — YAML files co-located with MSW handlers in \`__mocks__\`
directories — and writes the active selection to \`${config.mocksDir}/active-scenarios.ts\`.
Vite HMR picks up that file change immediately. No browser refresh needed.

\`active-scenarios.ts\` is **tool-owned**. Do not edit it manually; msw-lens regenerates it
on every run.

**Commands:**
- \`npm run lens\` — interactive scenario switcher (single run)
- \`npm run lens:watch\` — stay in the switcher, Ctrl+C to exit
- \`npm run lens:context -- <component.ts>\` — generate a prompt for an LLM

Manifests live alongside handlers: \`auth/user.yaml\` next to \`auth/user.ts\`.
`.trim();
}

const MANIFEST_FORMAT = `
## Manifest format

\`\`\`yaml
endpoint: /api/resource/
method: GET
shape: document         # document | collection — determines scenario vocabulary
description: What this endpoint returns

responseType:
  name: TypeScriptTypeName
  path: relative/path/to/types.ts

context:
  sourceHints:          # paths to files that consume this endpoint
    - path/to/store.ts  # LLM reads these directly — provide pointers, not summaries
    - path/to/component.ts

scenarios:
  scenario-name:
    description: What UI behavior this tests (not just what the data looks like)
    active: true        # marks the default scenario
    httpStatus: 401     # optional — omit for 200
    delay: real    # optional — MSW delay mode
\`\`\`
`.trim();

function getActive(m: Manifest, activeScenarios: Record<string, string>): string {
  return (
    activeScenarios[`${m.method} ${m.endpoint}`] ??
    Object.entries(m.scenarios).find(([, s]) => s.active)?.[0] ??
    Object.keys(m.scenarios)[0]
  );
}

/**
 * Generates .msw-lens/context.md — a committed, always-current snapshot of this
 * project's mock state, designed to be dropped into any LLM conversation as
 * instant context. Regenerated on every lens run.
 */
export function generateContextFile(
  cwd: string,
  manifests: Manifest[],
  activeScenarios: Record<string, string>,
  config: LensConfig
): void {
  const dir = join(cwd, LENS_DIR);
  if (!existsSync(dir)) mkdirSync(dir);

  const timestamp = new Date().toISOString();
  const lines: string[] = [
    '# msw-lens — project context',
    `generated: ${timestamp}`,
    '',
    '> Drop this file into any LLM conversation for instant context about what',
    '> is mocked in this project, what scenarios exist, and what is currently active.',
    '',
  ];

  if (manifests.length === 0) {
    lines.push('*No manifests found. Create a `.yaml` file alongside a handler in a `__mocks__` directory.*');
  } else {
    // Summary table
    lines.push('## Active scenarios', '');
    lines.push('| endpoint | method | active scenario |');
    lines.push('|----------|--------|-----------------|');
    for (const m of manifests) {
      const active = getActive(m, activeScenarios);
      lines.push(`| \`${m.endpoint}\` | ${m.method} | \`${active}\` |`);
    }
    lines.push('');

    // Full detail per endpoint
    lines.push('## Scenario details', '');
    for (const m of manifests) {
      const active = getActive(m, activeScenarios);
      const relPath = relative(cwd, m._filePath);

      lines.push(`### ${m.method} \`${m.endpoint}\``);
      lines.push(`manifest: \`${relPath}\``);
      if (m.description) lines.push(`> ${m.description}`);
      lines.push('');

      for (const [name, scenario] of Object.entries(m.scenarios)) {
        const marker = name === active ? ' ✓ **(active)**' : '';
        const extras: string[] = [];
        if (scenario.httpStatus) extras.push(`${scenario.httpStatus}`);
        if (scenario.delay) extras.push(`delay: ${scenario.delay}`);
        const suffix = extras.length ? ` *(${extras.join(', ')})*` : '';
        lines.push(`- **${name}**${marker}${suffix} — ${scenario.description}`);
      }

      if (m.context?.sourceHints?.length) {
        lines.push('');
        lines.push('sourceHints:');
        for (const hint of m.context.sourceHints) {
          lines.push(`- \`${hint}\``);
        }
      }
      lines.push('');
    }
  }

  lines.push('---', '', howItWorks(config), '', '---', '', MANIFEST_FORMAT, '');

  writeFileSync(join(dir, 'context.md'), lines.join('\n'), 'utf8');
}
