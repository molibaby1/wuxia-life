import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  EventLoader,
  collectFormalWalletAuthoringErrors,
} from '../src/core/EventLoader';
import type { EffectDefinition, EventCondition, EventDefinition } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const root = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf8')) as T;
}

function fixtureEvent(overrides: Partial<EventDefinition> & {
  autoEffects?: EffectDefinition[];
  conditions?: EventCondition[] | null;
}): EventDefinition {
  return {
    id: overrides.id ?? 'probe_wallet_event',
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

function testFormalCatalogHasZeroWalletAuthoring(): void {
  const loader = EventLoader.getInstance();
  const formalEvents = loader.getAllEvents();
  const eventsIndex = readJson<{ imports: string[] }>('src/data/events.json');
  assert.equal(loader.getUndeclaredImportPaths().length, 0, 'events.json imports must all be wired in EventLoader');
  assert.equal(eventsIndex.imports.length > 0, true, 'events.json must declare formal imports');

  // Authority is EventLoader/events.json, not a generated asset report.
  assert.equal(typeof formalEvents.length, 'number');
  assert.equal(formalEvents.length, 392, 'formal EventLoader catalog must remain the current 392-event source');

  const errors = collectFormalWalletAuthoringErrors(formalEvents);
  assert.deepEqual(errors, [], `formal wallet authoring must be zero; got: ${errors.join(' | ')}`);
}

function testSyntheticMoneyStatModifyFailsGuard(): void {
  const errors = collectFormalWalletAuthoringErrors([
    fixtureEvent({
      id: 'probe_stat_modify_money',
      autoEffects: [{ type: 'stat_modify', target: 'money', value: 10, operator: 'add' }],
    }),
  ]);
  assert.equal(errors.some((error) => error.includes('stat_modify targeting money')), true, errors.join(' | '));
}

function testSyntheticMoneyModifyFailsGuard(): void {
  const errors = collectFormalWalletAuthoringErrors([
    fixtureEvent({
      id: 'probe_money_modify',
      autoEffects: [{ type: 'money_modify' as EffectDefinition['type'], value: 10 }],
    }),
  ]);
  assert.equal(errors.some((error) => error.includes('money_modify')), true, errors.join(' | '));
}

function testSyntheticMoneyConditionFailsGuard(): void {
  const expressionErrors = collectFormalWalletAuthoringErrors([
    fixtureEvent({
      id: 'probe_player_money_expression',
      conditions: [{ type: 'expression', expression: 'player.money >= 100' }],
    }),
  ]);
  assert.equal(
    expressionErrors.some((error) => error.includes('wallet expression/condition')),
    true,
    expressionErrors.join(' | '),
  );

  const directErrors = collectFormalWalletAuthoringErrors([
    fixtureEvent({
      id: 'probe_direct_money_expression',
      conditions: [{ type: 'expression', expression: 'money >= 50' }],
    }),
  ]);
  assert.equal(
    directErrors.some((error) => error.includes('wallet expression/condition')),
    true,
    directErrors.join(' | '),
  );
}

function testSyntheticNumericWealthStatModifyFailsGuard(): void {
  const errors = collectFormalWalletAuthoringErrors([
    fixtureEvent({
      id: 'probe_stat_modify_wealth',
      autoEffects: [{ type: 'stat_modify', target: 'wealth', value: 10, operator: 'add' }],
    }),
  ]);
  assert.equal(
    errors.some((error) => error.includes('stat_modify targeting exact numeric wealth')),
    true,
    errors.join(' | '),
  );
}

function testSyntheticNumericWealthConditionFailsGuard(): void {
  const expressionErrors = collectFormalWalletAuthoringErrors([
    fixtureEvent({
      id: 'probe_player_wealth_expression',
      conditions: [{ type: 'expression', expression: 'player.wealth >= 100' }],
    }),
  ]);
  assert.equal(
    expressionErrors.some((error) => error.includes('numeric-wealth expression/condition')),
    true,
    expressionErrors.join(' | '),
  );

  const directErrors = collectFormalWalletAuthoringErrors([
    fixtureEvent({
      id: 'probe_direct_wealth_expression',
      conditions: [{ type: 'expression', expression: 'wealth >= 50' }],
    }),
  ]);
  assert.equal(
    directErrors.some((error) => error.includes('numeric-wealth expression/condition')),
    true,
    directErrors.join(' | '),
  );

  const capacityAllowed = collectFormalWalletAuthoringErrors([
    fixtureEvent({
      id: 'probe_wealth_capacity_ok',
      conditions: [{ type: 'wealth_capacity_at_least', minimum: 'modest_savings' }],
    }),
  ]);
  assert.deepEqual(capacityAllowed, []);
}

function testDeferredWalletBacklogNotBulkModified(): void {
  // Deferred unloaded identity-official still contains wallet writes; guard must not rewrite it.
  const eventsIndex = readJson<{ imports: string[] }>('src/data/events.json');
  assert.equal(eventsIndex.imports.includes('./lines/identity-official.json'), false);
  const deferred = readFileSync(resolve(root, 'src/data/lines/identity-official.json'), 'utf8');
  assert.equal(deferred.includes('"target": "money"') || deferred.includes('"stat": "money"'), true);
}

export function runGlobalMoneyFormalWalletAuthoringGuardTests(): void {
  testFormalCatalogHasZeroWalletAuthoring();
  testSyntheticMoneyStatModifyFailsGuard();
  testSyntheticMoneyModifyFailsGuard();
  testSyntheticMoneyConditionFailsGuard();
  testSyntheticNumericWealthStatModifyFailsGuard();
  testSyntheticNumericWealthConditionFailsGuard();
  testDeferredWalletBacklogNotBulkModified();
}

runGlobalMoneyFormalWalletAuthoringGuardTests();
console.log('globalMoneyFormalWalletAuthoringGuard.test.ts: ok');
