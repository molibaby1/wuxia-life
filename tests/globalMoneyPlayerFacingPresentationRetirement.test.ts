import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { PlayerSummaryDto } from '../src/contracts/sessionProgression';
import { EndingSystem } from '../src/core/EndingSystem';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { calculatePublicStatDeltas } from '../src/core/activePlanning/periodSummaryBuilder';
import { buildEndingPresentationDescription } from '../src/core/endingPresentation';
import { buildPlayerDeltaOverlayCard } from '../src/types/progressionOverlay';
import type { EffectDefinition } from '../src/types/eventTypes';
import { LIFE_MEMORY_SCHEMA_VERSION, type LifeMemorySummary } from '../src/types/lifeMemory';

process.env.WUXIA_ENGINE_QUIET = '1';

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function isMoneyEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money';
}

function collectFormalMoneyWrites(): Array<{ eventId: string }> {
  const writes: Array<{ eventId: string }> = [];
  for (const event of EventLoader.getInstance().getAllEvents()) {
    for (const effect of event.autoEffects ?? []) {
      if (isMoneyEffect(effect)) writes.push({ eventId: event.id });
    }
    for (const choice of event.choices ?? []) {
      for (const effect of choice.effects ?? []) {
        if (isMoneyEffect(effect)) writes.push({ eventId: event.id });
      }
      for (const outcome of choice.outcomes ?? []) {
        for (const effect of outcome.effects ?? []) {
          if (isMoneyEffect(effect)) writes.push({ eventId: event.id });
        }
      }
    }
  }
  return writes;
}

function createPlayerSummary(): PlayerSummaryDto {
  return {
    name: 'E2守卫',
    age: 30,
    martialPower: 20,
    chivalry: 10,
    constitution: 12,
    wealthCapacity: 'modest_savings',
    ownedAssets: [],
    reputation: 8,
    connections: 5,
    knowledge: 9,
    businessAcumen: 4,
    influence: 0,
    charisma: 3,
    affiliation: null,
    title: null,
    alive: true,
    investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
    currentYear: 30,
    currentMonth: 1,
    currentDay: 1,
  };
}

function createLifeMemory(): LifeMemorySummary {
  return {
    schemaVersion: LIFE_MEMORY_SCHEMA_VERSION,
    derivedAtAge: 30,
  };
}

function testMainScreenSurfacesHaveNoMoney(): void {
  const model = buildMainScreenModel(createPlayerSummary(), createLifeMemory());
  assert.equal(model.topResources.some((item) => item.key === 'money' || item.label === '银两'), false);
  assert.equal(model.topResources.some((item) => item.key === 'wealthCapacity'), true);
  const resourceGroup = model.fullStatGroups.find((group) => group.id === 'resource');
  assert(resourceGroup, 'resource group must exist');
  assert.equal(resourceGroup.items.some((item) => item.key === 'money' || item.label === '银两'), false);
  assert.equal(resourceGroup.items.some((item) => item.key === 'wealthCapacity'), true);

  const mainModelSource = read('src/components/mainScreenModel.ts');
  assert.equal(/\bmoney\b/.test(mainModelSource.match(/export type MainScreenPlayer[\s\S]*?;/)?.[0] ?? ''), false);
  assert.equal(read('src/components/GameScreen.vue').includes('money: p.money'), false);
}

function testEndingSurfacesHaveNoMoney(): void {
  assert.equal(read('src/components/EndingScreen.vue').includes('银两'), false);
  assert.equal(/money\??\s*:/.test(read('src/components/EndingScreen.vue')), false);
  assert.equal(read('src/App.vue').includes('money: player?.money'), false);
  assert.equal(read('src/core/EndingSystem.ts').includes('财富：${player.money}'), false);
  assert.equal(/player\.money\s*<\s*0/.test(read('src/core/endingPresentation.ts')), false);

  const engine = new GameEngineIntegration();
  engine.startNewGame('E2结局', 'male');
  const state = engine.getGameState();
  state.player.spouse = '发妻';
  state.player.children = 1;
  state.player.lifeStates = { trainingHabit: 5, studyHabit: 5, businessHabit: 5 };
  const ending = EndingSystem.getEndingById('quiet_family_life');
  assert(ending, 'quiet_family_life must exist');
  const text = buildEndingPresentationDescription(state, ending!);
  assert.equal(/银两|财富：/.test(text), false);
}

function testProgressionSurfacesHaveNoMoney(): void {
  assert.equal(read('src/core/activePlanning/periodSummaryBuilder.ts').includes("'money'"), false);
  assert.equal(read('src/core/activePlanning/periodSummaryBuilder.ts').includes('银两'), false);
  assert.equal(read('src/types/progressionOverlay.ts').includes("'money'"), false);
  assert.equal(read('src/types/progressionOverlay.ts').includes('银两'), false);

  const before = {
    martialPower: 1,
    chivalry: 0,
    constitution: 0,
    reputation: 0,
    connections: 0,
    knowledge: 0,
    businessAcumen: 0,
    influence: 0,
    charisma: 0,
  } as never;
  const after = { ...before, money: 60 };
  assert.deepEqual(calculatePublicStatDeltas(before, after), {});
  const card = buildPlayerDeltaOverlayCard('e2', 'delta', before, after);
  assert.equal((card.metaLines ?? []).some((line) => line.includes('银两')), false);
}

function testPlayerSummaryDtoHasNoMoney(): void {
  const dtoBlock = read('src/contracts/sessionProgression.ts').match(
    /export interface PlayerSummaryDto \{[\s\S]*?\n\}/,
  )?.[0];
  assert(dtoBlock, 'PlayerSummaryDto must exist');
  assert.equal(/\bmoney\b/.test(dtoBlock), false);
  assert.equal(/money:\s*player/.test(read('server/src/services/sessionProgressionMapper.ts')), false);
  assert.equal('money' in createPlayerSummary(), false);
}

function testCompatibilityBoundaryPreserved(): void {
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
  assert.equal(/\bmoney:\s*number\b/.test(read('src/contracts/gameStateSnapshot.ts')), false);

  const engine = new GameEngineIntegration();
  engine.startNewGame('E2兼容', 'male');
  const player = engine.getGameState().player as unknown as Record<string, unknown>;
  assert.equal('money' in player, false);
  assert.equal('wealth' in player, false);
  assert.equal(player.wealthCapacity, 'no_surplus');
}

function testFormalMoneyWritesRemainZero(): void {
  const writes = collectFormalMoneyWrites();
  assert.equal(writes.length, 0, `formal EventLoader money writes must remain 0, got ${JSON.stringify(writes)}`);
}

function testNormalGameplayMoneyMutationLociRemainZero(): void {
  // E2 presentation guard reasserts the E1 mutation-zero boundary without reopening E3 capability retirement.
  assert.equal(read('src/data/setbackEvents.ts').includes('money:'), false);
  const mutations = collectFormalMoneyWrites();
  assert.equal(mutations.length, 0);
}

testMainScreenSurfacesHaveNoMoney();
testEndingSurfacesHaveNoMoney();
testProgressionSurfacesHaveNoMoney();
testPlayerSummaryDtoHasNoMoney();
testCompatibilityBoundaryPreserved();
testFormalMoneyWritesRemainZero();
testNormalGameplayMoneyMutationLociRemainZero();

console.log('globalMoneyPlayerFacingPresentationRetirement.test.ts: ok');
