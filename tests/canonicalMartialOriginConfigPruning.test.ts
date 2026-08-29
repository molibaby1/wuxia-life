import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert } from './GameTestFramework';
import { traitSystem } from '../src/core/TraitSystem';
import { origins } from '../src/data/traits/origins';
import type { PlayerState } from '../src/types/eventTypes';

const LEGACY_MARTIAL_FIELDS = new Set(['externalSkill', 'internalSkill', 'qinggong']);

type LegacyHit = { originId: string; stat: string; value: number };

function collectLegacyOriginInitialStats(): LegacyHit[] {
  const hits: LegacyHit[] = [];
  for (const origin of origins) {
    for (const entry of origin.initialStats ?? []) {
      if (LEGACY_MARTIAL_FIELDS.has(entry.stat)) {
        hits.push({ originId: origin.id, stat: entry.stat, value: entry.value });
      }
    }
  }
  return hits;
}

function createBaselinePlayer(): PlayerState {
  return {
    name: 'origin-pruning',
    gender: 'male',
    age: 0,
    martialPower: 10,
    chivalry: 0,
    constitution: 10,
    charisma: 10,
    knowledge: 10,
    connections: 0,
    reputation: 0,
    wealthCapacity: 'no_surplus',
    flags: {},
    events: [],
    relationships: [],
    alive: true,
  };
}

function testGreenConfig(): void {
  const hits = collectLegacyOriginInitialStats();
  assert(hits.length === 0, `Origin initialStats must have 0 legacy martial fields, got ${JSON.stringify(hits)}`);

  const martialFamily = origins.find(item => item.id === 'martial_family');
  assert(Boolean(martialFamily), 'martial_family must exist');
  assert(martialFamily!.name === '武林世家', 'martial_family name must remain unchanged');
  assert(
    martialFamily!.initialStats.some(item => item.stat === 'martialPower' && item.value === 3),
    'martial_family.initialStats.martialPower must remain exactly +3',
  );
  assert(
    martialFamily!.earlyEventBiases.length === 2 &&
      martialFamily!.earlyEventBiases.some(item => item.tag === 'training' && item.multiplier === 1.4) &&
      martialFamily!.earlyEventBiases.some(item => item.tag === 'reputation' && item.multiplier === 1.1),
    'martial_family earlyEventBiases must remain unchanged',
  );
}

function testNoOriginInitialStatsApplicator(): void {
  const baseline = createBaselinePlayer();
  const withEmptyTraits = traitSystem.applyTraits(baseline, []);
  assert(withEmptyTraits.martialPower === 10, 'applyTraits([]) must not apply origin martialPower');

  // Origin ids are not trait ids; applyTraits must ignore them and leave martial stats untouched.
  const withOriginId = traitSystem.applyTraits(baseline, ['martial_family' as never]);
  assert(withOriginId.martialPower === 10, 'applyTraits(martial_family) must not apply origin martialPower');

  const traitSystemSource = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../src/core/TraitSystem.ts'),
    'utf8',
  );
  const getTraitConfigsBlock = traitSystemSource.match(
    /private getTraitConfigs\([\s\S]*?\n  \}/,
  )?.[0];
  assert(Boolean(getTraitConfigsBlock), 'TraitSystem.getTraitConfigs source block must be readable');
  assert(
    getTraitConfigsBlock!.includes('coreTalentMap') &&
      getTraitConfigsBlock!.includes('weaknessMap') &&
      getTraitConfigsBlock!.includes('temperamentMap'),
    'getTraitConfigs must continue mapping core/weakness/temperament only',
  );
  assert(
    !getTraitConfigsBlock!.includes('originMap'),
    'getTraitConfigs must not gain an originMap applicator',
  );
  assert(
    /applyTraits\([\s\S]*?getTraitConfigs\(traits\)/.test(traitSystemSource),
    'applyTraits must continue applying only getTraitConfigs results',
  );
}

testGreenConfig();
testNoOriginInitialStatsApplicator();
console.log('canonicalMartialOriginConfigPruning.test.ts: ok');
