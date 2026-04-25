import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import type { Manifest } from './discover.js';
import type { LensConfig } from './config.js';
import { MANIFEST_FORMAT_BODY } from './manifest-format.js';

const LENS_DIR = '.msw-lens';

function howItWorks(config: LensConfig): string {
  return `## How msw-lens works

msw-lens reads scenario manifests — YAML files co-located with MSW handlers under
\`${config.mocksDir}/\`. The active selection writes to two tool-owned files:

- \`${config.mocksDir}/active-scenarios.ts\` — which scenario is active per endpoint
- \`${config.mocksDir}/bypassed-endpoints.ts\` — endpoints that bypass MSW entirely (pass through to the real API)

Vite HMR picks up file changes immediately. No browser refresh needed.

These files are **tool-owned**. Do not edit them manually; msw-lens regenerates them on every run.

**Bypass requires** MSW worker started with \`onUnhandledRequest: 'bypass'\` —
otherwise unhandled requests will warn or error instead of passing through.

**Commands:**
- \`npm run lens\` — interactive scenario switcher (single run)
- \`npm run lens:watch\` — stay in the switcher, Ctrl+C to exit
- \`npm run lens:context -- <component.ts>\` — generate a prompt for an LLM

Manifests live alongside handlers: \`auth/user.yaml\` next to \`auth/user.ts\`.
`.trim();
}

const MANIFEST_FORMAT = `## Manifest format\n\n${MANIFEST_FORMAT_BODY}`;

function getActive(
  m: Manifest,
  activeScenarios: Record<string, string>,
  bypassed: Set<string>
): string {
  const key = `${m.method} ${m.endpoint}`;
  if (bypassed.has(key)) return 'bypass';
  return (
    activeScenarios[key] ??
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
  bypassed: Set<string>,
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
    lines.push(`*No manifests found. Create a \`.yaml\` file alongside a handler under \`${config.mocksDir}/\`.*`);
  } else {
    // Summary table
    lines.push('## Active scenarios', '');
    lines.push('| endpoint | method | active scenario |');
    lines.push('|----------|--------|-----------------|');
    for (const m of manifests) {
      const active = getActive(m, activeScenarios, bypassed);
      lines.push(`| \`${m.endpoint}\` | ${m.method} | \`${active}\` |`);
    }
    lines.push('');

    // Full detail per endpoint
    lines.push('## Scenario details', '');
    for (const m of manifests) {
      const active = getActive(m, activeScenarios, bypassed);
      const relPath = relative(cwd, m._filePath);

      lines.push(`### ${m.method} \`${m.endpoint}\``);
      lines.push(`manifest: \`${relPath}\``);
      if (m.description) lines.push(`> ${m.description}`);
      lines.push('');

      if (bypassed.has(`${m.method} ${m.endpoint}`)) {
        lines.push('**Currently bypassed** — requests pass through to the real API; no scenario is active.');
        lines.push('');
      }

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
