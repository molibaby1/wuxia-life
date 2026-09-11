import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import {
  EventLoader,
  collectFormalWalletAuthoringErrors,
} from '../src/core/EventLoader';
import { EventExecutor } from '../src/core/EventExecutor';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { explainChoiceRequirement } from '../src/core/activePlanning/ChoiceRequirementExplanation';
import type { EffectDefinition, EventDefinition, GameState, PlayerState } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function isExactNumericWealthEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'wealth';
}

function isExactNumericWealthCondition(condition: { type?: string; expression?: string } | null | undefined): boolean {
  if (!condition || condition.type !== 'expression' || typeof condition.expression !== 'string') {
    return false;
  }
  return /(?:player\s*\.\s*wealth\b|\bwealth\b)/i.test(condition.expression);
}

function collectFormalNumericWealthWrites(): Array<{ eventId: string }> {
  const writes: Array<{ eventId: string }> = [];
  for (const event of EventLoader.getInstance().getAllEvents()) {
    for (const effect of event.autoEffects ?? []) {
      if (isExactNumericWealthEffect(effect)) writes.push({ eventId: event.id });
    }
    for (const choice of event.choices ?? []) {
      for (const effect of choice.effects ?? []) {
        if (isExactNumericWealthEffect(effect)) writes.push({ eventId: event.id });
      }
      for (const outcome of choice.outcomes ?? []) {
        for (const effect of outcome.effects ?? []) {
          if (isExactNumericWealthEffect(effect)) writes.push({ eventId: event.id });
        }
      }
    }
  }
  return writes;
}

function collectFormalNumericWealthConditions(): Array<{ eventId: string }> {
  const hits: Array<{ eventId: string }> = [];
  for (const event of EventLoader.getInstance().getAllEvents()) {
    const conditions = [
      ...(Array.isArray(event.conditions) ? event.conditions : event.conditions ? [event.conditions] : []),
      ...((event as { triggerConditions?: unknown }).triggerConditions
        ? Array.isArray((event as { triggerConditions?: unknown[] }).triggerConditions)
          ? (event as { triggerConditions: unknown[] }).triggerConditions
          : [(event as { triggerConditions: unknown }).triggerConditions]
        : []),
    ];
    for (const condition of conditions) {
      if (isExactNumericWealthCondition(condition as { type?: string; expression?: string })) {
        hits.push({ eventId: event.id });
      }
    }
    for (const choice of event.choices ?? []) {
      if (isExactNumericWealthCondition(choice.condition as { type?: string; expression?: string } | undefined)) {
        hits.push({ eventId: event.id });
      }
      for (const outcome of choice.outcomes ?? []) {
        if (isExactNumericWealthCondition(
          (outcome as { condition?: { type?: string; expression?: string } }).condition,
        )) {
          hits.push({ eventId: event.id });
        }
      }
    }
  }
  return hits;
}

function createMinimalState(): GameState {
  const player: PlayerState = {
    name: 'E4-US001',
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
    investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
  };
  return {
    player,
    flags: {},
    relations: {},
    eventHistory: [],
    actionHistory: [],
  };
}

function fixtureEvent(overrides: Partial<EventDefinition>): EventDefinition {
  return {
    id: overrides.id ?? 'probe_numeric_wealth',
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
    conditions: overrides.conditions ?? null,
    content: { title: 'probe', text: 'probe' },
    autoEffects: overrides.autoEffects,
    choices: overrides.choices ?? [
      {
        id: 'probe_choice',
        text: 'probe',
        effects: overrides.autoEffects ? [] : [{ type: 'status_add', status: 'anxious' }],
      },
    ],
    ...overrides,
  };
}

function testPlayerStatsHasNoNumericWealth(): void {
  const playerStatsBlock = read('src/types/eventTypes.ts').match(
    /export interface PlayerStats \{[\s\S]*?\n\}/,
  )?.[0];
  assert(playerStatsBlock);
  assert.equal(/\bwealth\s*\?:/.test(playerStatsBlock!), false);
  assert.equal(/\bmoney\s*\?:/.test(playerStatsBlock!), false);
  assert.equal(/\bwealth\?:\s*number\b/.test(read('src/types/eventTypes.ts')), false);
  assert.equal(/\bwealth\?:\s*number\b/.test(read('src/contracts/gameStateSnapshot.ts')), false);
}

async function testEventExecutorCannotMutateNumericWealth(): Promise<void> {
  assert.equal(read('src/core/EventExecutor.ts').includes("'wealth'"), false);
  const before = createMinimalState();
  const after = await new EventExecutor().executeEffects(
    [{ type: 'stat_modify', target: 'wealth', value: 50, operator: 'add' }],
    before,
  );
  assert.equal('wealth' in after.player, false);
}

function testConditionEvaluatorFailsClosedForNumericWealth(): void {
  assert.equal(ConditionEvaluator.DIRECT_PLAYER_PROPERTIES.has('wealth'), false);
  assert.equal(ConditionEvaluator.DIRECT_PLAYER_PROPERTIES.has('money'), false);
  const evaluator = new ConditionEvaluator();
  const state = createMinimalState();
  assert.equal(evaluator.evaluate({ type: 'expression', expression: 'player.wealth >= 1' }, state), false);
  assert.equal(evaluator.evaluate({ type: 'expression', expression: 'wealth >= 1' }, state), false);
  assert.equal(
    evaluator.evaluate({ type: 'wealth_capacity_at_least', minimum: 'no_surplus' }, state),
    true,
  );
}

function testChoiceRequirementExplanationDoesNotExposeNumericWealth(): void {
  const source = read('src/core/activePlanning/ChoiceRequirementExplanation.ts');
  assert.equal(/\bwealth\s*:\s*'财富'/.test(source), false);
  const state = createMinimalState();
  const evaluator = new ConditionEvaluator();
  const result = explainChoiceRequirement(
    'wealth_gate',
    { type: 'expression', expression: 'player.wealth >= 100' },
    state,
    evaluator,
  );
  assert.equal(result.available, false);
  assert.equal(/财富/.test(result.summary), false, `must not expose numeric wealth as 财富: ${result.summary}`);
  assert.equal(result.explanations.every((item) => item.gapKind === 'unsupported'), true);
}

function testFormalCatalogNumericWealthZeroAndGuardRejects(): void {
  assert.equal(EventLoader.getInstance().getAllEvents().length, 391);
  assert.equal(collectFormalNumericWealthWrites().length, 0);
  assert.equal(collectFormalNumericWealthConditions().length, 0);
  assert.deepEqual(collectFormalWalletAuthoringErrors(EventLoader.getInstance().getAllEvents()), []);

  const writeErrors = collectFormalWalletAuthoringErrors([
    fixtureEvent({
      id: 'probe_stat_modify_wealth',
      autoEffects: [{ type: 'stat_modify', target: 'wealth', value: 10, operator: 'add' }],
    }),
  ]);
  assert.equal(
    writeErrors.some((error) => error.includes('stat_modify targeting exact numeric wealth')),
    true,
    writeErrors.join(' | '),
  );

  const conditionErrors = collectFormalWalletAuthoringErrors([
    fixtureEvent({
      id: 'probe_player_wealth_expression',
      conditions: [{ type: 'expression', expression: 'player.wealth >= 100' }],
    }),
  ]);
  assert.equal(
    conditionErrors.some((error) => error.includes('numeric-wealth expression/condition')),
    true,
    conditionErrors.join(' | '),
  );

  const capacityAllowed = collectFormalWalletAuthoringErrors([
    fixtureEvent({
      id: 'probe_wealth_capacity_ok',
      conditions: [{ type: 'wealth_capacity_at_least', minimum: 'modest_savings' }],
      autoEffects: [{ type: 'wealth_capacity_raise_to', capacity: 'comfortable' }],
    }),
  ]);
  assert.deepEqual(capacityAllowed, []);
}

function testCompatibilityBoundaryPreserved(): void {
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
  assert.equal(/\bmoney:\s*number\b/.test(read('src/types/eventTypes.ts')), false);
  assert.equal(/\bwealth\?:\s*number\b/.test(read('src/types/eventTypes.ts')), false);
  assert.equal(/\bmoney:\s*number\b/.test(read('src/contracts/gameStateSnapshot.ts')), false);
  assert.equal(/\bwealth\?:\s*number\b/.test(read('src/contracts/gameStateSnapshot.ts')), false);
}

async function main(): Promise<void> {
  testPlayerStatsHasNoNumericWealth();
  await testEventExecutorCannotMutateNumericWealth();
  testConditionEvaluatorFailsClosedForNumericWealth();
  testChoiceRequirementExplanationDoesNotExposeNumericWealth();
  testFormalCatalogNumericWealthZeroAndGuardRejects();
  testCompatibilityBoundaryPreserved();
  console.log('globalMoneyNumericWealthRuntimeRetirement.test.ts: ok');
}

void main();
