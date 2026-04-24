import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { cancel, intro, isCancel, log, note, outro, select } from '@clack/prompts';
import { discoverManifests, type Manifest } from './discover.js';
import { readConfig } from './config.js';
import { readActiveScenarios, writeActiveScenarios } from './state.js';
import { generateContextFile } from './generate-context.js';
import { generatePromptFile } from './generate-prompt.js';

const cwd = process.cwd();
const watch = process.argv.includes('--watch') || process.argv.includes('-w');

const contextFlagIdx = process.argv.indexOf('--context');
const contextFile =
  contextFlagIdx !== -1 ? resolve(cwd, process.argv[contextFlagIdx + 1]) : null;

if (!existsSync(join(cwd, 'package.json'))) {
  console.error('msw-lens must be run from a project root (package.json not found).');
  process.exit(1);
}

const config = readConfig(cwd);

export function stateKey(method: string, endpoint: string): string {
  return `${method} ${endpoint}`;
}

function defaultScenario(manifest: Manifest): string {
  return (
    Object.entries(manifest.scenarios).find(([, s]) => s.active)?.[0] ??
    Object.keys(manifest.scenarios)[0]
  );
}

async function main() {
  const manifests = await discoverManifests(cwd, config);
  const state = readActiveScenarios(cwd, config);

  // Context generation mode — emit files, no interactive prompt
  if (contextFile) {
    if (!existsSync(contextFile)) {
      console.error(`File not found: ${contextFile}`);
      process.exit(1);
    }
    intro('msw-lens — generating context');
    generateContextFile(cwd, manifests, state, config);
    generatePromptFile(contextFile, cwd, manifests, config);
    outro('.msw-lens/context.md written. Prompt saved to .msw-lens/prompts/');
    return;
  }

  // Switching mode
  intro(watch ? 'msw-lens — watch mode (ctrl+c to exit)' : 'msw-lens');

  if (manifests.length === 0) {
    note(
      `No manifests found in ${config.mocksDir}/.\n\n` +
        `Expected layout: ${config.mocksDir}/<endpoint>/<handler>.yaml\n\n` +
        `If your mocks live elsewhere, set "msw-lens.mocksDir" in package.json:\n` +
        `  "msw-lens": { "mocksDir": "path/to/your/mocks" }`,
      'nothing to switch'
    );
    outro('');
    process.exit(0);
  }

  while (true) {
    const endpointChoice = await select({
      message: 'Which endpoint?',
      options: [
        ...(watch ? [] : [{ value: '__done__', label: '[done]' }]),
        ...manifests.map((m) => {
          const key = stateKey(m.method, m.endpoint);
          const current = state[key] ?? defaultScenario(m);
          return { value: key, label: `${m.method} ${m.endpoint}  [${current}]` };
        }),
      ],
    });

    if (isCancel(endpointChoice)) {
      cancel('Cancelled.');
      process.exit(0);
    }

    if (endpointChoice === '__done__') break;

    const manifest = manifests.find(
      (m) => stateKey(m.method, m.endpoint) === endpointChoice,
    )!;
    const key = endpointChoice as string;
    const current = state[key] ?? defaultScenario(manifest);

    const scenarioChoice = await select({
      message: `${manifest.method} ${manifest.endpoint}`,
      options: Object.entries(manifest.scenarios).map(([name, scenario]) => ({
        value: name,
        label: name,
        hint: scenario.description ?? '',
      })),
      initialValue: current,
    });

    if (isCancel(scenarioChoice)) continue;

    state[key] = scenarioChoice as string;
    writeActiveScenarios(cwd, config, state);
    generateContextFile(cwd, manifests, state, config);
    log.success(`${manifest.method} ${manifest.endpoint} → ${scenarioChoice}`);
  }

  outro('Done.');
}

main().catch(console.error);
