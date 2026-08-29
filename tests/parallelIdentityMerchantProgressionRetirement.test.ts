import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { EffectDefinition, EventDefinition } from '../src/types/eventTypes';

const RETIRED_IDENTITY_EVENTS = [
  'merchant_first_trade',
  'merchant_expand_business',
  'merchant_empire',
  'merchant_crisis',
] as const;

type Manifest = {
  events: Array<{ eventId: string; sourceFile: string; runtimeLoaded: boolean }>;
};

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.resolve(relativePath), 'utf8')) as T;
}

function getEvent(id: string): EventDefinition {
  const event = EventLoader.getInstance().getEventById(id);
  assert(event, `missing event: ${id}`);
  return event;
}

function effectTarget(effect: EffectDefinition): string | undefined {
  if (effect.type !== 'stat_modify' && effect.type !== 'random') return undefined;
  return effect.target ?? effect.stat;
}

function effectFlag(effect: EffectDefinition): string | undefined {
  if (effect.type !== 'flag_set') return undefined;
  return effect.flag ?? effect.target;
}

function isMoneyEffect(effect: EffectDefinition): boolean {
  return effectTarget(effect) === 'money';
}

function testRetiredIdentityEventsLeaveFormalCatalog(): void {
  const identityEvents = readJson<Array<{ id: string }>>('src/data/lines/identity-merchant.json');
  const identityIds = new Set(identityEvents.map(event => event.id));
  const manifest = readJson<Manifest>('src/data/event-asset-manifest.json');
  const manifestIds = new Set(manifest.events.map(event => event.eventId));
  const loader = EventLoader.getInstance();

  for (const id of RETIRED_IDENTITY_EVENTS) {
    assert.equal(identityIds.has(id), false, `${id} must be removed from identity-merchant.json`);
    assert.equal(loader.getEventById(id), undefined, `${id} must be absent from the formal EventLoader catalog`);
    assert.equal(manifestIds.has(id), false, `${id} must be removed from the event-asset manifest`);
  }
}

function testDeferredIdentityEventsRemainLoadedAndUnchanged(): void {
  const mentor = getEvent('merchant_mentor');
  const manifest = readJson<Manifest>('src/data/event-asset-manifest.json');

  const manifestEntry = manifest.events.find(event => event.eventId === 'merchant_mentor');
  assert(manifestEntry, 'merchant_mentor must remain represented in the manifest');
  assert.equal(manifestEntry.runtimeLoaded, true, 'merchant_mentor must remain formally runtime-loaded');

  assert((mentor.choices ?? []).every(choice =>
    (choice.effects ?? []).some(effect =>
      effectFlag(effect) === 'merchant_heir' && effect.value === true,
    ),
  ), 'merchant_mentor heir semantics must remain unchanged');
}

async function testCanonicalMerchantSpineRemainsFormalAndWritesCanonicalFlag(): Promise<void> {
  const canonicalEmpire = getEvent('merchant_business_empire');
  const tycoon = getEvent('merchant_ending_tycoon');
  const canonicalEffects = canonicalEmpire.autoEffects ?? [];
  const identitySource = fs.readFileSync(path.resolve('src/data/lines/identity-merchant.json'), 'utf8');
  const endingSource = fs.readFileSync(path.resolve('src/core/EndingSystem.ts'), 'utf8');

  assert.equal(canonicalEmpire.id, 'merchant_business_empire');
  assert(canonicalEffects.some(effect =>
    effect.type === 'wealth_capacity_raise_to' && effect.minimum === 'regional_magnate',
  ), 'canonical merchant_business_empire must retain its regional_magnate transition');
  assert(canonicalEffects.some(effect =>
    effectFlag(effect) === 'merchant_empire' && effect.value === true,
  ), 'canonical merchant_business_empire must retain the canonical merchant_empire flag producer');
  assert.equal(canonicalEffects.some(isMoneyEffect), false, 'canonical spine must not regain legacy money effects');
  assert(tycoon.conditions?.some(condition =>
    condition.type === 'expression' && condition.expression === 'flags.merchant_empire == true',
  ), 'merchant_ending_tycoon must retain the canonical merchant_empire consumer');
  assert.equal(identitySource.includes('merchant_crisis'), false, 'merchant_crisis must be retired from identity source');
  assert(identitySource.includes('merchant_mentor'), 'identity merchant mentor must remain in source');
  assert.equal(identitySource.includes('wealth_capacity'), false, 'retirement must not add Wealth replacement semantics');
  assert.equal(identitySource.includes('asset_'), false, 'retirement must not add Asset replacement semantics');
  assert.equal(endingSource.includes("flags: ['business_empire']"), false, 'business_empire legacy ending consumer must be absent after B2');

  const engine = new GameEngineIntegration();
  engine.startNewGame('Parallel Identity Merchant Retirement', 'male');
  const state = engine.getGameState();
  state.player.traits = [];
  state.player.wealthCapacity = 'wealthy';
  state.flags.merchant_invest_good = true;
  state.player.flags.merchant_invest_good = true;

  await engine.executeChoiceEffects(canonicalEffects, canonicalEmpire.id);
  const after = engine.getGameState();
  assert.equal('money' in after.player, false, 'canonical merchant spine must leave legacy money unchanged');
  assert.equal(after.player.wealthCapacity, 'regional_magnate');
  assert.equal(after.flags.merchant_empire, true);
}

async function run(): Promise<void> {
  testRetiredIdentityEventsLeaveFormalCatalog();
  testDeferredIdentityEventsRemainLoadedAndUnchanged();
  await testCanonicalMerchantSpineRemainsFormalAndWritesCanonicalFlag();
  console.log('parallelIdentityMerchantProgressionRetirement.test.ts: ok');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
