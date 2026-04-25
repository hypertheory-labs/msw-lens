import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { cancel, intro, isCancel, log, note, outro, select } from '@clack/prompts';
import { discoverManifests, type Manifest } from './discover.js';
import { readConfig } from './config.js';
import { readActiveScenarios, writeActiveScenarios, readBypassed, writeBypassed } from './state.js';
import { generateContextFile } from './generate-context.js';
import { generatePromptFile } from './generate-prompt.js';

const cwd = process.cwd();
const watch = process.argv.includes('--watch') || process.argv.includes('-w');
const init = process.argv.includes('--init');

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
  // Nudge: if state files are missing, point the user at lens:init before doing anything else.
  if (!init) {
    const mocksAbs = join(cwd, config.mocksDir);
    const missing: string[] = [];
    if (!existsSync(join(mocksAbs, 'active-scenarios.ts'))) missing.push('active-scenarios.ts');
    if (!existsSync(join(mocksAbs, 'bypassed-endpoints.ts'))) missing.push('bypassed-endpoints.ts');

    if (missing.length > 0) {
      intro('msw-lens');
      note(
        `Missing in ${config.mocksDir}/:\n${missing.map((f) => `  - ${f}`).join('\n')}\n\nRun \`npm run lens:init\` to bootstrap.`,
        'setup needed'
      );
      outro('');
      process.exit(1);
    }
  }

  const manifests = await discoverManifests(cwd, config);
  const state = readActiveScenarios(cwd, config);
  const bypassed = readBypassed(cwd, config);

  // Init mode — bootstrap tool-owned files, print setup checklist, exit
  if (init) {
    intro('msw-lens — init');

    const mocksAbs = join(cwd, config.mocksDir);
    if (!existsSync(mocksAbs)) {
      mkdirSync(mocksAbs, { recursive: true });
      log.success(`created ${config.mocksDir}/`);
    }

    const activeScenariosAbs = join(mocksAbs, 'active-scenarios.ts');
    if (existsSync(activeScenariosAbs)) {
      log.info(`${config.mocksDir}/active-scenarios.ts already exists — skipped`);
    } else {
      writeActiveScenarios(cwd, config, {});
      log.success(`created ${config.mocksDir}/active-scenarios.ts`);
    }

    const bypassedAbs = join(mocksAbs, 'bypassed-endpoints.ts');
    if (existsSync(bypassedAbs)) {
      log.info(`${config.mocksDir}/bypassed-endpoints.ts already exists — skipped`);
    } else {
      writeBypassed(cwd, config, new Set());
      log.success(`created ${config.mocksDir}/bypassed-endpoints.ts`);
    }

    generateContextFile(cwd, manifests, state, bypassed, config);
    log.success('regenerated .msw-lens/context.md');

    note(
      `MSW must be started with \`onUnhandledRequest: 'bypass'\` for the bypass option to work — otherwise unhandled requests warn or error instead of passing through.\n\n` +
        `Next: \`npm run lens:context -- <component>\` to generate an LLM prompt, or \`npm run lens\` to switch scenarios.`,
      'setup'
    );

    outro('init complete');
    return;
  }

  // Context generation mode — emit files, no interactive prompt
  if (contextFile) {
    if (!existsSync(contextFile)) {
      console.error(`File not found: ${contextFile}`);
      process.exit(1);
    }
    intro('msw-lens — generating context');
    generateContextFile(cwd, manifests, state, bypassed, config);
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
          const current = bypassed.has(key) ? 'bypass' : (state[key] ?? defaultScenario(m));
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
    const current = bypassed.has(key) ? 'bypass' : (state[key] ?? defaultScenario(manifest));

    const scenarioChoice = await select({
      message: `${manifest.method} ${manifest.endpoint}`,
      options: [
        ...Object.entries(manifest.scenarios).map(([name, scenario]) => ({
          value: name,
          label: name,
          hint: scenario.description ?? '',
        })),
        {
          value: 'bypass',
          label: 'bypass — pass through to real API',
          hint: "requires worker.start({ onUnhandledRequest: 'bypass' })",
        },
      ],
      initialValue: current,
    });

    if (isCancel(scenarioChoice)) continue;

    if (scenarioChoice === 'bypass') {
      bypassed.add(key);
      delete state[key];
    } else {
      bypassed.delete(key);
      state[key] = scenarioChoice as string;
    }
    writeActiveScenarios(cwd, config, state);
    writeBypassed(cwd, config, bypassed);
    generateContextFile(cwd, manifests, state, bypassed, config);
    log.success(`${manifest.method} ${manifest.endpoint} → ${scenarioChoice}`);
  }

  outro('Done.');
}

main().catch(console.error);
