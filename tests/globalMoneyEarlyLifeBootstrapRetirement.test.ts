import assert from 'node:assert/strict';
import { coreTalents } from '../src/data/traits/coreTalents';
import { eventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { traitSystem } from '../src/core/TraitSystem';
import type { CoreTalentConfig, TraitId } from '../src/types/eventTypes';
import { resolveBirthBackground } from '../src/p16/canonicalBirthBackground';

const MONEY_SENTINELS = [0, 317, 9999];

function getTalent(id: 'iron_abacus' | 'heroic_heart'): CoreTalentConfig {
  const talent = coreTalents.find(item => item.id === id);
  assert(talent, `${id} must remain a canonical core talent`);
  return talent;
}

function hasWealthReplacementModifier(modifier: { stat?: unknown }): boolean {
  return String(modifier.stat ?? '').startsWith('wealth');
}

function makePlayer() {
  const engine = new GameEngineIntegration();
  engine.startNewGame('D1 semantic probe', 'male');
  const player = engine.getGameState().player;
  player.businessAcumen = 0;
  player.connections = 0;
  player.chivalry = 0;
  player.reputation = 0;
  player.charisma = 0;
  player.traits = [];
  return player;
}

async function applyMerchantOrigin() {
  const event = eventLoader.getEventById('origin_background');
  assert(event, 'origin_background must exist');

  const engine = new GameEngineIntegration();
  engine.startNewGame('D1 merchant origin probe', 'male');
  const state = engine.getGameState();
  state.player.traits = [];
  state.player.connections = 0;
  state.player.charisma = 0;
  const connectionsBefore = 0;
  const charismaBefore = 0;
  const after = resolveBirthBackground(state, { override: 'merchant_house' });
  return { before: { connections: connectionsBefore, charisma: charismaBefore }, after };
}

async function testMerchantOriginAuthoringAndRuntime(): Promise<void> {
  const event = eventLoader.getEventById('origin_background');
  assert(event, 'origin_background must exist');
  const resolver = event.autoEffects?.find(effect => effect.target === 'resolve_birth_background');
  assert(resolver?.type === 'special', 'origin background must use the canonical resolver');

  for (const _sentinel of MONEY_SENTINELS) {
    const { before, after } = await applyMerchantOrigin();
    assert.equal('money' in after.player, false, 'merchant origin must not create legacy money');
    assert.equal(after.player.wealthCapacity, 'comfortable_means');
    assert.equal(after.player.connections, before.connections + 2);
    assert.equal(after.player.charisma, before.charisma + 6);
    assert.equal(after.flags?.origin_merchant_family, true);
    assert(after.player.events?.some(record => record.eventId === 'origin_merchant_family'));
  }
}

function testCoreTalentWalletRetirement(): void {
  const iron = getTalent('iron_abacus');
  const heroic = getTalent('heroic_heart');

  for (const talent of [iron, heroic]) {
    assert.equal(talent.initialStats?.filter(item => item.stat === 'money').length, 0, `${talent.id} initial money must be retired`);
    assert.equal(talent.growthModifiers?.filter(item => item.stat === 'money').length, 0, `${talent.id} money growth must be retired`);
    assert.equal(talent.initialStats?.some(hasWealthReplacementModifier), false);
    assert.equal(talent.growthModifiers?.some(hasWealthReplacementModifier), false);
  }

  const ironPlayer = traitSystem.applyTraits(makePlayer(), ['iron_abacus'] as TraitId[]);
  assert.equal('money' in ironPlayer, false);
  assert.equal(ironPlayer.businessAcumen, 6);
  assert.equal(ironPlayer.connections, 2);
  assert.equal(ironPlayer.chivalry, -2);
  assert.equal(traitSystem.getGrowthMultiplier(ironPlayer, 'money'), 1);
  assert.equal(traitSystem.getGrowthMultiplier(ironPlayer, 'businessAcumen'), 1.3);
  assert.equal(traitSystem.getGrowthMultiplier(ironPlayer, 'connections'), 1.1);
  assert.equal(traitSystem.getGrowthMultiplier(ironPlayer, 'chivalry'), 0.9);

  const heroicPlayer = traitSystem.applyTraits(makePlayer(), ['heroic_heart'] as TraitId[]);
  assert.equal('money' in heroicPlayer, false);
  assert.equal(heroicPlayer.chivalry, 8);
  assert.equal(heroicPlayer.reputation, 2);
  assert.equal(traitSystem.getGrowthMultiplier(heroicPlayer, 'money'), 1);
  assert.equal(traitSystem.getGrowthMultiplier(heroicPlayer, 'chivalry'), 1.3);
  assert.equal(traitSystem.getGrowthMultiplier(heroicPlayer, 'reputation'), 1.15);
}

async function run(): Promise<void> {
  await testMerchantOriginAuthoringAndRuntime();
  testCoreTalentWalletRetirement();
  console.log('globalMoneyEarlyLifeBootstrapRetirement.test.ts: ok');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
