import { glob } from 'glob';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';

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

export async function discoverManifests(cwd: string): Promise<Manifest[]> {
  const files = await glob('**/__mocks__/**/*.yaml', {
    cwd,
    ignore: ['node_modules/**'],
    absolute: true,
  });

  const manifests: Manifest[] = [];
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const parsed = yaml.load(content) as Manifest;
    parsed._filePath = file;
    manifests.push(parsed);
  }
  return manifests;
}
