#!/usr/bin/env tsx
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { cancel, intro, isCancel, log, note, outro, select } from '@clack/prompts';
import { discoverManifests, type Manifest } from './discover.js';
import { readActiveScenarios, writeActiveScenarios } from './state.js';
import { generateContextFile } from './generate-context.js';
import { generatePromptFile } from './generate-prompt.js';

const cwd = process.cwd();
const watch = process.argv.includes('--watch') || process.argv.includes('-w');

const contextFlagIdx = process.argv.indexOf('--context');
const contextFile =
  contextFlagIdx !== -1 ? resolve(cwd, process.argv[contextFlagIdx + 1]) : null;

if (!existsSync(join(cwd, 'angular.json'))) {
  console.error('msw-lens must be run from an Angular project root (angular.json not found).');
  process.exit(1);
}

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
  const manifests = await discoverManifests(cwd);
  const state = readActiveScenarios(cwd);

  // Context generation mode — emit files, no interactive prompt
  if (contextFile) {
    if (!existsSync(contextFile)) {
      console.error(`File not found: ${contextFile}`);
      process.exit(1);
    }
    intro('msw-lens — generating context');
    generateContextFile(cwd, manifests, state);
    generatePromptFile(contextFile, cwd, manifests);
    outro('.msw-lens/context.md and .msw-lens/prompt.md written.');
    return;
  }

  // Switching mode
  intro(watch ? 'msw-lens — watch mode (ctrl+c to exit)' : 'msw-lens');

  if (manifests.length === 0) {
    note(
      'No manifests found. Create a .yaml file alongside a handler in a __mocks__ directory.',
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
    writeActiveScenarios(cwd, state);
    generateContextFile(cwd, manifests, state);
    log.success(`${manifest.method} ${manifest.endpoint} → ${scenarioChoice}`);
  }

  outro('Done.');
}

main().catch(console.error);
