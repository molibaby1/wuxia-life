import assert from 'node:assert/strict';
import { coreTalents } from '../src/data/traits/coreTalents';
import { eventLoader } from '../src/core/EventLoader';
import { EventExecutor } from '../src/core/EventExecutor';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { traitSystem } from '../src/core/TraitSystem';
import type { CoreTalentConfig, EffectDefinition, TraitId } from '../src/types/eventTypes';

const MONEY_SENTINELS = [0, 317, 9999];

function getTalent(id: 'iron_abacus' | 'heroic_heart'): CoreTalentConfig {
  const talent = coreTalents.find(item => item.id === id);
  assert(talent, `${id} must remain a canonical core talent`);
  return talent;
}

function isMoneyEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money';
}

function hasWealthReplacementModifier(modifier: { stat?: unknown }): boolean {
  return String(modifier.stat ?? '').startsWith('wealth');
}

function makePlayer(money: number) {
  const engine = new GameEngineIntegration();
  engine.startNewGame('D1 semantic probe', 'male');
  const player = engine.getGameState().player;
  player.money = money;
  player.businessAcumen = 0;
  player.connections = 0;
  player.chivalry = 0;
  player.reputation = 0;
  player.charisma = 0;
  player.traits = [];
  return player;
}

async function applyMerchantOrigin(money: number) {
  const event = eventLoader.getEventById('origin_background');
  assert(event, 'origin_background must exist');
  const choice = event.choices?.find(item => item.id === 'origin_merchant_family');
  assert(choice, 'origin_merchant_family must exist');

  const engine = new GameEngineIntegration();
  engine.startNewGame('D1 merchant origin probe', 'male');
  const state = engine.getGameState();
  state.player.money = money;
  state.player.traits = [];
  const before = state.player;
  const after = await new EventExecutor().executeEffects(choice.effects ?? [], state);
  return { choice, before, after };
}

async function testMerchantOriginAuthoringAndRuntime(): Promise<void> {
  const event = eventLoader.getEventById('origin_background');
  assert(event, 'origin_background must exist');
  const choice = event.choices?.find(item => item.id === 'origin_merchant_family');
  assert(choice, 'origin_merchant_family must exist');

  assert.equal(choice.effects?.filter(isMoneyEffect).length, 0, 'merchant origin must not write money');
  assert.deepEqual(
    choice.effects
      ?.filter(effect => effect.type.startsWith('wealth_'))
      .map(effect => [effect.type, effect.value]),
    [['wealth_capacity_set', 'comfortable_means']],
    'merchant origin must retain only its existing canonical Wealth Capacity seed',
  );
  assert(choice.effects?.some(effect => effect.type === 'flag_set' && effect.target === 'origin_merchant_family'));
  assert(choice.effects?.some(effect => effect.type === 'stat_modify' && effect.target === 'connections' && effect.value === 2));
  assert(choice.effects?.some(effect => effect.type === 'stat_modify' && effect.target === 'charisma' && effect.value === 6));
  assert(choice.effects?.some(effect => effect.type === 'event_record' && effect.target === 'origin_merchant_family'));

  for (const money of MONEY_SENTINELS) {
    const { before, after } = await applyMerchantOrigin(money);
    assert.equal(after.player.money, money, `merchant origin must preserve money sentinel ${money}`);
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

  const ironPlayer = traitSystem.applyTraits(makePlayer(317), ['iron_abacus'] as TraitId[]);
  assert.equal(ironPlayer.money, 317);
  assert.equal(ironPlayer.businessAcumen, 6);
  assert.equal(ironPlayer.connections, 2);
  assert.equal(ironPlayer.chivalry, -2);
  assert.equal(traitSystem.getGrowthMultiplier(ironPlayer, 'money'), 1);
  assert.equal(traitSystem.getGrowthMultiplier(ironPlayer, 'businessAcumen'), 1.3);
  assert.equal(traitSystem.getGrowthMultiplier(ironPlayer, 'connections'), 1.1);
  assert.equal(traitSystem.getGrowthMultiplier(ironPlayer, 'chivalry'), 0.9);

  const heroicPlayer = traitSystem.applyTraits(makePlayer(317), ['heroic_heart'] as TraitId[]);
  assert.equal(heroicPlayer.money, 317);
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
