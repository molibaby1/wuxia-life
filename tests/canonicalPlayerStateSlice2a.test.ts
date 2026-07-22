import { StatModifyHandler } from '../src/core/EventExecutor';
import { WUXIA_PROFILE_RESOURCES } from '../src/narrative/profile/wuxiaResources';
import { EffectType, type EffectDefinition } from '../src/types/eventTypes';
import { gameEngine } from '../src/core/GameEngineIntegration';

type CanonicalNonNegativeStat =
  | 'martialPower'
  | 'constitution'
  | 'knowledge'
  | 'connections'
  | 'reputation';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const statEffect = (target: string, value: number, operator: 'add' | 'set'): EffectDefinition => ({
  type: EffectType.STAT_MODIFY,
  target,
  value,
  operator,
});

export async function runCanonicalPlayerStateSlice2aTests(): Promise<void> {
  gameEngine.startNewGame('Canonical Slice 2A', 'male');
  const handler = new StatModifyHandler();
  let state = gameEngine.getGameState();

  for (const stat of [
    'martialPower',
    'constitution',
    'knowledge',
    'connections',
    'reputation',
  ] as CanonicalNonNegativeStat[]) {
    state.player[stat] = 5;
    state = await handler.execute(statEffect(stat, -10, 'add'), state);
    assert(state.player[stat] === 0, `${stat} must not become negative`);
  }

  for (const stat of [
    'martialPower',
    'constitution',
    'knowledge',
    'connections',
    'reputation',
    'chivalry',
  ]) {
    state.player[stat] = 0;
    state = await handler.execute(statEffect(stat, 120, 'set'), state);
    assert(state.player[stat] === 120, `${stat} must not have a fixed 100 upper cap`);
  }

  state.player.chivalry = 5;
  state = await handler.execute(statEffect('chivalry', -10, 'add'), state);
  assert(state.player.chivalry === -5, 'chivalry must allow signed values');

  const resourceIds = WUXIA_PROFILE_RESOURCES.map(resource => resource.id);
  assert(resourceIds.length === 1 && resourceIds[0] === 'money', 'money is the only Wuxia resource');
  assert(!resourceIds.includes('energy'), 'energy is not a canonical resource');
  assert(!resourceIds.includes('connections'), 'connections is not a canonical resource');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCanonicalPlayerStateSlice2aTests()
    .then(() => console.log('canonicalPlayerStateSlice2a.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
