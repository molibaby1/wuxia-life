import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { PlayerSummaryDto } from '../src/contracts/sessionProgression';
import {
  EventLoader,
  collectFormalWalletAuthoringErrors,
} from '../src/core/EventLoader';
import { EventExecutor } from '../src/core/EventExecutor';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { calculatePublicStatDeltas } from '../src/core/activePlanning/periodSummaryBuilder';
import type { EffectDefinition, GameState, PlayerState } from '../src/types/eventTypes';
import type { LifeMemorySummary } from '../src/types/lifeMemory';
import { EffectType } from '../src/types/eventTypes';

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

function createMinimalState(): GameState {
  const player: PlayerState = {
    name: 'E3守卫',
    gender: 'male',
    age: 30,
    martialPower: 0,
    chivalry: 0,
    charisma: 0,
    constitution: 0,
    knowledge: 0,
    businessAcumen: 0,
    influence: 0,
    connections: 0,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    wealthCapacity: 'no_surplus',
    reputation: 0,
    affiliation: null,
    title: null,
    healthStatus: 'healthy',
    statuses: [],
    alive: true,
    items: [],
    flags: {},
    events: [],
    relationships: [],
    children: 0,
    spouse: null,
    lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
    traits: [],
  };
  return {
    player,
    flags: {},
    relations: {},
    eventHistory: [],
    actionHistory: [],
  };
}

function createPlayerSummary(): PlayerSummaryDto {
  return {
    name: 'E3守卫',
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
    schemaVersion: '3.1.0',
    derivedAtAge: 30,
  };
}

function testFormalWritesAndConditionsZero(): void {
  assert.equal(collectFormalMoneyWrites().length, 0);
  const formalErrors = collectFormalWalletAuthoringErrors(EventLoader.getInstance().getAllEvents());
  assert.deepEqual(formalErrors, []);
  assert.equal(EventLoader.getInstance().getAllEvents().length, 412);
}

function testDifficultySetbackMoneyMutationsZero(): void {
  assert.equal(read('src/data/setbackEvents.ts').includes('money:'), false);
  assert.equal(read('src/core/SetbackEventSystem.ts').includes("'money'"), false);
}

function testLivePresentationSurfacesHaveNoMoney(): void {
  const model = buildMainScreenModel(createPlayerSummary(), createLifeMemory());
  assert.equal(model.topResources.some((item) => item.key === 'money'), false);
  assert.equal(read('src/components/EndingScreen.vue').includes('银两'), false);
  assert.equal(read('src/core/activePlanning/periodSummaryBuilder.ts').includes("'money'"), false);
  assert.equal(read('src/types/progressionOverlay.ts').includes("'money'"), false);
  const dtoBlock = read('src/contracts/sessionProgression.ts').match(
    /export interface PlayerSummaryDto \{[\s\S]*?\n\}/,
  )?.[0];
  assert(dtoBlock);
  assert.equal(/\bmoney\b/.test(dtoBlock!), false);
  assert.equal('money' in createPlayerSummary(), false);

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
  assert.deepEqual(calculatePublicStatDeltas(before, { ...before, money: 99 }), {});
}

async function testEventExecutorCannotStatModifyMoney(): Promise<void> {
  assert.equal(read('src/core/EventExecutor.ts').includes("'money'"), false);
  const before = createMinimalState();
  const after = await new EventExecutor().executeEffects(
    [{ type: 'stat_modify', target: 'money', value: 50, operator: 'add' }],
    before,
  );
  assert.equal('money' in after.player, false);
}

function testConditionEvaluatorCannotReadMoney(): void {
  assert.equal(ConditionEvaluator.DIRECT_PLAYER_PROPERTIES.has('money'), false);
  const evaluator = new ConditionEvaluator();
  const state = createMinimalState();
  // Fail closed: rejected money expressions evaluate to false (never unlock gameplay).
  assert.equal(evaluator.evaluate({ type: 'expression', expression: 'player.money >= 1' }, state), false);
  assert.equal(evaluator.evaluate({ type: 'expression', expression: 'money >= 1' }, state), false);
}

function testActivePlanningHasNoImplicitMoneyFallback(): void {
  assert.equal(read('src/core/activePlanning/ActionResultResolver.ts').includes("?? 'money'"), false);
  assert.equal(read('src/core/activePlanning/ActionResultResolver.ts').includes('?? "money"'), false);
  assert.equal(read('src/core/activePlanning/ageActionStatCaps.ts').includes('money'), false);
  assert.match(read('src/types/activeActionTypes.ts'), /export interface ActionCostChannel \{\s*stat: string;/);
}

function testCriticalChoiceHasNoDirectMoneyMutation(): void {
  assert.equal(/player\.money\s*\+=/.test(read('src/core/CriticalChoiceSystem.ts')), false);
  assert.equal(/money\s*\+=/.test(read('src/core/CriticalChoiceSystem.ts')), false);
}

function testOriginTraitAuthoringHasNoMoney(): void {
  assert.equal(/initialStats[\s\S]{0,80}\bmoney\b/.test(read('src/data/traits/origins.ts')), false);
  const traitKeyBlock = read('src/types/eventTypes.ts').match(/export type TraitStatKey\s*=([\s\S]*?);/)?.[0];
  assert(traitKeyBlock);
  assert.equal(/\bmoney\b/.test(traitKeyBlock!), false);
}

function testEffectTypeHasNoMoneyModify(): void {
  const effectEnum = read('src/types/eventTypes.ts').match(/export enum EffectType \{[\s\S]*?\n\}/)?.[0];
  assert(effectEnum);
  assert.equal(/MONEY_MODIFY|money_modify/.test(effectEnum!), false);
  assert.equal(Object.values(EffectType).includes('money_modify' as EffectType), false);
  assert.equal(/money_modify|player\.money|stat.*money/.test(read('src/data/eventExamples.ts')), false);
}

function testFormalAuthoringGuardActive(): void {
  const probe = collectFormalWalletAuthoringErrors([
    {
      id: 'e3_probe',
      name: 'probe',
      description: 'probe',
      version: '1.0.0',
      category: 'family',
      priority: 1,
      weight: 1,
      ageRange: { min: 1, max: 1 },
      type: 'family',
      eventType: 'choice',
      tags: [],
      storyLine: 'fixture',
      triggers: [],
      triggerConditions: null,
      conditions: [{ type: 'expression', expression: 'player.money >= 1' }],
      content: { title: 'probe', text: 'probe' },
      choices: [{ id: 'c', text: 'c', effects: [{ type: 'stat_modify', target: 'money', value: 1 }] }],
    },
  ]);
  assert.equal(probe.length >= 2, true, probe.join(' | '));
}

function testCompatibilityBoundaryPreserved(): void {
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
  assert.equal(/\bmoney:\s*number\b/.test(read('src/contracts/gameStateSnapshot.ts')), false);
  assert.equal(/\bmoney:\s*number\b/.test(read('src/types/eventTypes.ts')), false);
  assert.equal(/\bwealth\?:\s*number\b/.test(read('src/types/eventTypes.ts')), false);

  const engine = new GameEngineIntegration();
  engine.startNewGame('E3兼容', 'male');
  const player = engine.getGameState().player as unknown as Record<string, unknown>;
  assert.equal('money' in player, false);
  assert.equal('wealth' in player, false);
  assert.equal(player.wealthCapacity, 'no_surplus');
}

async function main(): Promise<void> {
  testFormalWritesAndConditionsZero();
  testDifficultySetbackMoneyMutationsZero();
  testLivePresentationSurfacesHaveNoMoney();
  await testEventExecutorCannotStatModifyMoney();
  testConditionEvaluatorCannotReadMoney();
  testActivePlanningHasNoImplicitMoneyFallback();
  testCriticalChoiceHasNoDirectMoneyMutation();
  testOriginTraitAuthoringHasNoMoney();
  testEffectTypeHasNoMoneyModify();
  testFormalAuthoringGuardActive();
  testCompatibilityBoundaryPreserved();
  console.log('globalMoneyCurrentRuntimeCapabilityRetirement.test.ts: ok');
}

void main();
