#!/usr/bin/env tsx
import { existsSync } from 'fs';
import { join } from 'path';
import { cancel, intro, isCancel, log, note, outro, select } from '@clack/prompts';
import { discoverManifests } from './discover.js';
import { readActiveScenarios, writeActiveScenarios } from './state.js';

const cwd = process.cwd();
const watch = process.argv.includes('--watch') || process.argv.includes('-w');

if (!existsSync(join(cwd, 'angular.json'))) {
  console.error('msw-lens must be run from an Angular project root (angular.json not found).');
  process.exit(1);
}

async function runOnce(): Promise<boolean> {
  const manifests = await discoverManifests(cwd);

  if (manifests.length === 0) {
    note(
      'No manifests found. Create a .yaml file alongside a handler in a __mocks__ directory.',
      'nothing to switch'
    );
    return false;
  }

  const currentState = readActiveScenarios(cwd);
  const updatedState = { ...currentState };

  for (const manifest of manifests) {
    const defaultScenario =
      Object.entries(manifest.scenarios).find(([, s]) => s.active)?.[0] ??
      Object.keys(manifest.scenarios)[0];

    const currentActive = currentState[manifest.endpoint] ?? defaultScenario;

    const result = await select({
      message: `${manifest.method} ${manifest.endpoint}`,
      options: Object.entries(manifest.scenarios).map(([name, scenario]) => ({
        value: name,
        label: name,
        hint: scenario.description,
      })),
      initialValue: currentActive,
    });

    if (isCancel(result)) {
      cancel('Cancelled — no changes written.');
      process.exit(0);
    }

    updatedState[manifest.endpoint] = result as string;
  }

  writeActiveScenarios(cwd, updatedState);
  return true;
}

async function main() {
  intro(watch ? 'msw-lens — watch mode (ctrl+c to exit)' : 'msw-lens');

  if (watch) {
    while (true) {
      const changed = await runOnce();
      if (changed) log.success('active-scenarios.ts updated.');
    }
  } else {
    await runOnce();
    outro('active-scenarios.ts updated.');
  }
}

main().catch(console.error);
