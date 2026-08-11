import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AdversarialRecipe,
  FixtureRegistry,
  KnownBadRecipe,
  SeedBundle,
} from '../types';
import { stableJsonHash } from '../hash';

const HERE = dirname(fileURLToPath(import.meta.url));
export const FIXTURES_ROOT = join(HERE, '..', 'fixtures');

export function loadFixtureRegistry(root = FIXTURES_ROOT): FixtureRegistry {
  return JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8')) as FixtureRegistry;
}

export function loadSeedBundle(root = FIXTURES_ROOT): SeedBundle {
  return JSON.parse(readFileSync(join(root, 'seeds', 'seed-bundle.json'), 'utf8')) as SeedBundle;
}

export function loadKnownBadRecipe(recipePath: string, root = FIXTURES_ROOT): KnownBadRecipe {
  return JSON.parse(readFileSync(join(root, recipePath), 'utf8')) as KnownBadRecipe;
}

export function loadAdversarialRecipe(recipePath: string, root = FIXTURES_ROOT): AdversarialRecipe {
  return JSON.parse(readFileSync(join(root, recipePath), 'utf8')) as AdversarialRecipe;
}

export function fixtureSetFingerprint(root = FIXTURES_ROOT): string {
  const registry = loadFixtureRegistry(root);
  const seedBundle = loadSeedBundle(root);
  const recipes = registry.samples.map(sample => {
    const raw = readFileSync(join(root, sample.recipePath), 'utf8');
    return { id: sample.id, recipe: JSON.parse(raw) };
  });
  return stableJsonHash({ registry, seedBundle, recipes });
}

export function buildSealedLabels(root = FIXTURES_ROOT): Record<string, {
  kind: string;
  expectedDetections?: string[];
  expectedBlockCodes?: string[];
}> {
  const registry = loadFixtureRegistry(root);
  const labels: Record<string, {
    kind: string;
    expectedDetections?: string[];
    expectedBlockCodes?: string[];
  }> = {};
  for (const sample of registry.samples) {
    labels[sample.id] = {
      kind: sample.kind,
      expectedDetections: sample.expectedDetections,
      expectedBlockCodes: sample.expectedBlockCodes,
    };
  }
  return labels;
}
