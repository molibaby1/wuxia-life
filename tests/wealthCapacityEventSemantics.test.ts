import nodeAssert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventExecutor, StatModifyHandler } from '../src/core/EventExecutor';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { explainChoiceRequirement } from '../src/core/activePlanning/ChoiceRequirementExplanation';
import { WEALTH_CAPACITY_LABELS } from '../src/types/wealthCapacity';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeState(): GameState {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Wealth Capacity Semantics', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'no_surplus';
  return state;
}

async function assertRejects(
  action: () => Promise<unknown>,
  expected: RegExp,
  message: string,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    assert(expected.test(text), `${message} (got: ${text})`);
    return;
  }

  throw new Error(message);
}

async function testWealthCapacityConditionSemantics(): Promise<void> {
  const evaluator = new ConditionEvaluator();
  const condition = {
    type: 'wealth_capacity_at_least' as never,
    minimum: 'modest_savings',
  } as never;
  const state = makeState();

  state.player.wealthCapacity = 'no_surplus';
  assert(
    evaluator.evaluate(condition, state) === false,
    'wealth_capacity_at_least must reject no_surplus below modest_savings',
  );

  state.player.wealthCapacity = 'comfortable_means';
  assert(
    evaluator.evaluate(condition, state) === true,
    'wealth_capacity_at_least must accept comfortable_means at modest_savings threshold',
  );

  assert(
    evaluator.evaluate({ type: 'expression', expression: 'wealthCapacity >= 1' }, state) === false,
    'wealthCapacity numeric expressions must be rejected',
  );
}

async function testWealthCapacitySetEffect(): Promise<void> {
  const executor = new EventExecutor();
  const state = makeState();
  state.player.wealthCapacity = 'comfortable_means';
  const before = JSON.parse(JSON.stringify(state)) as GameState;

  await assertRejects(
    () => executor.executeEffects([
      {
        type: 'wealth_capacity_set' as never,
        value: 'broken_value',
      },
    ] as never, state),
    /invalid wealth capacity/i,
    'invalid wealth capacity effect must throw',
  );
  assert(
    JSON.stringify(state) === JSON.stringify(before),
    'invalid wealth capacity effect must leave the original state unchanged',
  );

  const next = await executor.executeEffects([
    {
      type: 'wealth_capacity_set' as never,
      value: 'regional_magnate',
    },
  ] as never, state);

  assert(next.player.wealthCapacity === 'regional_magnate', 'wealth_capacity_set must update player.wealthCapacity');
  nodeAssert.equal('money' in next.player, false, 'wealth_capacity_set must not create money');
  nodeAssert.equal('wealth' in next.player, false, 'wealth_capacity_set must not create numeric wealth');
}

function testWealthCapacityChoiceExplanation(): void {
  const evaluator = new ConditionEvaluator();
  const state = makeState();
  const condition = {
    type: 'wealth_capacity_at_least' as never,
    minimum: 'modest_savings',
  } as never;

  state.player.wealthCapacity = 'no_surplus';
  const unmet = explainChoiceRequirement('wealth_capacity_gate', condition, state, evaluator);
  assert(unmet.available === false, 'wealth_capacity_at_least must stay unavailable below the threshold');
  assert(
    unmet.explanations[0]?.playerMessage === `财力需达到「${WEALTH_CAPACITY_LABELS.modest_savings}」`,
    `wealth requirement explanation must be player-readable when unmet, got: ${unmet.explanations[0]?.playerMessage}`,
  );
  assert(
    unmet.summary === `财力需达到「${WEALTH_CAPACITY_LABELS.modest_savings}」`,
    'wealth requirement summary must match the unmet player message',
  );

  state.player.wealthCapacity = 'comfortable_means';
  const met = explainChoiceRequirement('wealth_capacity_gate', condition, state, evaluator);
  assert(met.available === true, 'wealth_capacity_at_least must be available at or above the threshold');
  assert(
    met.explanations[0]?.playerMessage === `财力已达「${WEALTH_CAPACITY_LABELS.modest_savings}」`,
    `wealth requirement explanation must be player-readable when met, got: ${met.explanations[0]?.playerMessage}`,
  );
  assert(
    met.summary === `财力已达「${WEALTH_CAPACITY_LABELS.modest_savings}」`,
    'wealth requirement summary must match the met player message',
  );
}

async function testWealthCapacityRaiseToEffect(): Promise<void> {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Wealth Capacity Semantics', 'male');
  const noSurplus = engine.getGameState();
  noSurplus.player.wealthCapacity = 'no_surplus';
  const factsBefore = JSON.parse(JSON.stringify(noSurplus.facts ?? {}));

  const raised = await engine.executeChoiceEffects([
    { type: 'wealth_capacity_raise_to', minimum: 'modest_savings' } as never,
  ], 'wealth_raise_probe', 'raise');
  nodeAssert.equal(raised.gameState.player.wealthCapacity, 'modest_savings');

  engine.startNewGame('Wealth Capacity Semantics', 'male');
  const comfortable = engine.getGameState();
  comfortable.player.wealthCapacity = 'comfortable_means';
  const comfortableFactsBefore = JSON.parse(JSON.stringify(comfortable.facts ?? {}));

  const unchanged = await engine.executeChoiceEffects([
    { type: 'wealth_capacity_raise_to', minimum: 'modest_savings' } as never,
  ], 'wealth_raise_probe', 'raise');
  nodeAssert.equal(unchanged.gameState.player.wealthCapacity, 'comfortable_means');
  nodeAssert.equal('money' in unchanged.gameState.player, false);
  nodeAssert.equal('wealth' in unchanged.gameState.player, false);
  nodeAssert.deepEqual(unchanged.gameState.facts ?? {}, comfortableFactsBefore);

  nodeAssert.equal('money' in raised.gameState.player, false);
  nodeAssert.equal('wealth' in raised.gameState.player, false);
  nodeAssert.deepEqual(raised.gameState.facts ?? {}, factsBefore);

  const executor = new EventExecutor();
  const state = makeState();
  await assertRejects(
    () => executor.executeEffects([
      { type: 'wealth_capacity_raise_to' as never, minimum: 'mythic' as never },
    ] as never, state),
    /invalid wealth capacity minimum/i,
    'invalid wealth_capacity_raise_to minimum must throw',
  );
}

async function testStatModifyCannotTouchWealthCapacity(): Promise<void> {
  const handler = new StatModifyHandler();
  const state = makeState();

  const next = await handler.execute({
    type: 'stat_modify',
    target: 'wealthCapacity',
    value: 'regional_magnate',
    operator: 'set',
  } as never, state);

  assert(
    next.player.wealthCapacity === state.player.wealthCapacity,
    'stat_modify must not mutate wealthCapacity',
  );
}

async function runCase(name: string, fn: () => void | Promise<void>, failures: string[]): Promise<void> {
  try {
    await fn();
    console.log(`${name}: ok`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name}: ${message}`);
    console.error(`${name}: fail`);
    console.error(message);
  }
}

async function run(): Promise<void> {
  const failures: string[] = [];

  await runCase('wealth capacity condition semantics', testWealthCapacityConditionSemantics, failures);
  await runCase('wealth capacity set effect', testWealthCapacitySetEffect, failures);
  await runCase('wealth capacity choice explanation', testWealthCapacityChoiceExplanation, failures);
  await runCase('wealth capacity raise to effect', testWealthCapacityRaiseToEffect, failures);
  await runCase('stat modify cannot touch wealthCapacity', testStatModifyCannotTouchWealthCapacity, failures);

  if (failures.length > 0) {
    throw new Error(failures.join('\n'));
  }

  console.log('wealthCapacityEventSemantics.test.ts: ok');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
