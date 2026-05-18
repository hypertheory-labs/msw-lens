import { glob } from 'glob';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { normalize } from 'path';
import type { LensConfig } from './config.js';

export interface Scenario {
  description: string;
  active?: boolean;
  httpStatus?: number;
  delay?: string;
}

export interface Manifest {
  endpoint: string;
  method: string;
  shape?: string;
  description?: string;
  responseType?: { name: string; path: string };
  context?: { sourceHints?: string[] };
  scenarios: Record<string, Scenario>;
  _filePath: string;
}

export async function discoverManifests(cwd: string, config: LensConfig): Promise<Manifest[]> {
  const files = await glob(`${config.mocksDir}/**/*.yaml`, {
    cwd,
    ignore: ['node_modules/**'],
    absolute: true,
  });

  const manifests: Manifest[] = [];
  for (const file of files) {
    // glob returns forward-slash paths even on Windows; normalize so downstream
    // path.relative / path.dirname operations agree with the platform separator.
    const filePath = normalize(file);
    const content = readFileSync(filePath, 'utf8');
    const parsed = yaml.load(content) as Manifest;
    parsed._filePath = filePath;
    manifests.push(parsed);
  }
  return manifests;
}
