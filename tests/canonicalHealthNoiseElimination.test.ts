import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { coreTalents } from '../src/data/traits/coreTalents';
import { origins } from '../src/data/traits/origins';
import { weaknesses } from '../src/data/traits/weaknesses';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function loadLines(file: string): unknown {
  return JSON.parse(readFileSync(resolve('src/data/lines', file), 'utf8'));
}

function findById(value: unknown, id: string): Record<string, unknown> | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findById(item, id);
      if (found) return found;
    }
  } else if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (record.id === id) return record;
    for (const child of Object.values(record)) {
      const found = findById(child, id);
      if (found) return found;
    }
  }
  return undefined;
}

function hasHealthWrite(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasHealthWrite);
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record.target === 'health' || record.stat === 'health') return true;
  return Object.values(record).some(hasHealthWrite);
}

function hasCanonicalHealthWrite(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasCanonicalHealthWrite);
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record.type === 'health_status_set' || record.type === 'status_add' || record.type === 'status_remove') return true;
  return Object.values(record).some(hasCanonicalHealthWrite);
}

function statIds(config: { initialStats?: Array<{ stat: string }>; growthModifiers?: Array<{ stat: string }> }): string[] {
  return [...(config.initialStats ?? []), ...(config.growthModifiers ?? [])].map(item => item.stat);
}

function run(): void {
  const removedHealthNoise: Array<[string, string]> = [
    ['daily.json', 'daily_family_time'],
    ['daily.json', 'daily_cooking'],
    ['daily.json', 'daily_tea_tasting'],
    ['daily.json', 'daily_rest'],
    ['daily.json', 'daily_garden_cleanup'],
    ['daily.json', 'daily_fishing'],
    ['inheritance.json', 'inheritance_retirement'],
    ['love-mature.json', 'love_elderly_memories'],
    ['dynasty-change.json', 'dynasty_retreat'],
    ['training-events.json', 'training_rest'],
  ];
  for (const [file, id] of removedHealthNoise) {
    const event = findById(loadLines(file), id);
    assert(event !== undefined && !hasHealthWrite(event), `${id} must not write health`);
  }

  const eliminatedHealthEffects: Array<[string, string]> = [
    ['identity-demon.json', 'demonic_betrayal_purge'],
    ['identity-demon.json', 'demonic_fork_escalate'],
    ['identity-hero.json', 'hero_peril_fight'],
    ['identity-hero.json', 'ally_pay_ransom'],
    ['sect-marginal.json', 'demonic_purge_fight'],
    ['jianghu-crisis.json', 'crisis_suffering'],
    ['jianghu-crisis.json', 'crisis_survival'],
    ['shop.json', 'shop_first_visit'],
    ['shop.json', 'shop_herb_shop'],
    ['shop.json', 'shop_legendary_merchant'],
    ['shop.json', 'shop_grateful_vendor'],
  ];
  for (const [file, id] of eliminatedHealthEffects) {
    const event = findById(loadLines(file), id);
    assert(event !== undefined && !hasHealthWrite(event), `${id} must not write health`);
  }

  const canonicalHealthSemantics: Array<[string, string]> = [
    ['daily.json', 'daily_injury_recovery'],
    ['daily.json', 'daily_cultivation_setback'],
    ['adventure.json', 'adventure_rebirth_chance'],
  ];
  for (const [file, id] of canonicalHealthSemantics) {
    const event = findById(loadLines(file), id);
    assert(event !== undefined && hasCanonicalHealthWrite(event), `${id} must retain canonical health semantics`);
  }

  const frail = weaknesses.find(item => item.id === 'frail')!;
  const unstableMood = weaknesses.find(item => item.id === 'unstable_mood')!;
  const unyielding = coreTalents.find(item => item.id === 'unyielding')!;
  const frontierMilitary = origins.find(item => item.id === 'frontier_military')!;
  assert(!statIds(frail).includes('health'), 'frail must not duplicate health');
  assert(!statIds(unstableMood).includes('health'), 'unstable_mood must not write health');
  assert(!statIds(unyielding).includes('health'), 'unyielding must not duplicate health or growth');
  assert(!statIds(frontierMilitary).includes('health'), 'frontier_military must not duplicate health');

  const infantPassives = loadLines('origin-infant-passives.json');
  const infantJson = JSON.stringify(infantPassives);
  assert(!infantJson.includes('"health"'), 'infant passive stat deltas must not write health');
  assert(infantJson.includes('"constitution":1'), 'infant passive constitution delta must remain');

  console.log('canonicalHealthNoiseElimination.test.ts: ok');
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
