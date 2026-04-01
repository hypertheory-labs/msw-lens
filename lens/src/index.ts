#!/usr/bin/env tsx
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { cancel, intro, isCancel, log, note, outro, select } from '@clack/prompts';
import { discoverManifests } from './discover.js';
import { readActiveScenarios, writeActiveScenarios } from './state.js';
import { generateContextFile } from './generate-context.js';
import { generatePromptFile } from './generate-prompt.js';

const cwd = process.cwd();
const watch = process.argv.includes('--watch') || process.argv.includes('-w');

// --context <file>: generate .msw-lens/prompt.md for the given component
const contextFlagIdx = process.argv.indexOf('--context');
const contextFile =
  contextFlagIdx !== -1 ? resolve(cwd, process.argv[contextFlagIdx + 1]) : null;

if (!existsSync(join(cwd, 'angular.json'))) {
  console.error('msw-lens must be run from an Angular project root (angular.json not found).');
  process.exit(1);
}

async function runOnce(
  manifests: Awaited<ReturnType<typeof discoverManifests>>,
  currentState: Record<string, string>
): Promise<Record<string, string> | null> {
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

  return updatedState;
}

async function main() {
  const manifests = await discoverManifests(cwd);
  const currentState = readActiveScenarios(cwd);

  // Context generation mode — emit files, no interactive prompt
  if (contextFile) {
    if (!existsSync(contextFile)) {
      console.error(`File not found: ${contextFile}`);
      process.exit(1);
    }
    intro('msw-lens — generating context');
    generateContextFile(cwd, manifests, currentState);
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

  if (watch) {
    while (true) {
      const updatedState = await runOnce(manifests, currentState);
      if (updatedState) {
        writeActiveScenarios(cwd, updatedState);
        generateContextFile(cwd, manifests, updatedState);
        log.success('active-scenarios.ts updated.');
        Object.assign(currentState, updatedState);
      }
    }
  } else {
    const updatedState = await runOnce(manifests, currentState);
    if (updatedState) {
      writeActiveScenarios(cwd, updatedState);
      generateContextFile(cwd, manifests, updatedState);
    }
    outro('active-scenarios.ts updated.');
  }
}

main().catch(console.error);
