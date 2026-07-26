import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { StatModifyHandler } from '../src/core/EventExecutor';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { activeActionCatalog } from '../src/data/activeActionCatalog';
import { childhoodActionCatalog } from '../src/data/childhoodActionCatalog';
import { resolveActiveAction } from '../src/core/activePlanning/ActionResultResolver';
import { FixedTimeSource } from '../src/headless/adapters/timeSource';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import { validateGameStateSnapshot } from '../src/contracts/validation/contractValidation';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function hasEnergy(value: unknown): boolean {
  return JSON.stringify(value).includes('"energy"');
}

async function run(): Promise<void> {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Energy Elimination', 'male');
  const state = engine.getGameState();

  assert(!Object.prototype.hasOwnProperty.call(state.player, 'energy'), 'new player must not contain energy');

  const snapshot = defaultSnapshotConverter.toSnapshot(state, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: new FixedTimeSource(1717200000000),
  });
  assert(!hasEnergy(snapshot), 'snapshot must not contain energy');
  const restored = defaultSnapshotConverter.fromSnapshot(JSON.parse(JSON.stringify(snapshot)));
  assert(!Object.prototype.hasOwnProperty.call(restored.player, 'energy'), 'round-trip must not restore energy');

  const oldSnapshot = JSON.parse(JSON.stringify(snapshot)) as Record<string, any>;
  oldSnapshot.state.player.energy = 100;
  const validation = validateGameStateSnapshot(oldSnapshot);
  assert(!validation.ok && validation.errors.some(error => error.includes('energy')), 'contract must reject snapshot energy');
  let rejected = false;
  try {
    defaultSnapshotConverter.fromSnapshot(oldSnapshot as never);
  } catch {
    rejected = true;
  }
  assert(rejected, 'converter must reject old snapshot energy instead of restoring it');

  const allActions = [...activeActionCatalog, ...childhoodActionCatalog];
  const actionIds = allActions.map(action => action.id);
  for (const actionId of actionIds) {
    const action = allActions.find(item => item.id === actionId)!;
    assert(!action.costs.some(cost => cost.stat === 'energy'), `${actionId} must not cost energy`);
  }
  const actionResult = resolveActiveAction({ state, actionId: 'action_training_basic', random: () => 0 });
  assert(actionResult !== null && !('energy' in actionResult.deltas), 'active action must not produce energy delta');

  const handler = new StatModifyHandler();
  const before = JSON.stringify(state.player);
  const originalWarn = console.warn;
  let after = state;
  try {
    console.warn = () => undefined;
    after = await handler.execute({
      type: 'stat_modify',
      target: 'energy',
      value: -5,
      operator: 'add',
    } as never, state);
  } finally {
    console.warn = originalWarn;
  }
  assert(JSON.stringify(after.player) === before, 'energy effect must be rejected without changing player state');
  assert(!new ConditionEvaluator().evaluate({ type: 'expression', expression: 'energy >= 1' }, state), 'energy condition must be rejected');

  console.log('canonicalEnergyElimination.test.ts: ok');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
