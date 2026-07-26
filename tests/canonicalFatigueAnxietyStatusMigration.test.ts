import { coreTalents } from '../src/data/traits/coreTalents';
import { weaknesses } from '../src/data/traits/weaknesses';
import { createDefaultPlayerLifeStates, lifeStates } from '../src/data/life/lifeStates';
import { traitSystem } from '../src/core/TraitSystem';
import type { PlayerState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runCanonicalFatigueAnxietyStatusMigrationTests(): void {
  const defaults = createDefaultPlayerLifeStates() as unknown as Record<string, unknown>;
  assert(!('fatigue' in defaults), 'numeric lifeStates.fatigue must not exist');
  assert(!('anxiety' in defaults), 'numeric lifeStates.anxiety must not exist');
  assert(!lifeStates.some(item => item.key === ('fatigue' as never)), 'fatigue config must not exist');
  assert(!lifeStates.some(item => item.key === ('anxiety' as never)), 'anxiety config must not exist');

  const traitPlayer = traitSystem.applyTraits(
    { traits: [] } as PlayerState,
    ['perfect_memory', 'frail', 'unstable_mood'],
  );
  assert(!traitPlayer.statuses?.includes('fatigued'), 'frail must not initialize fatigued');
  assert(!traitPlayer.statuses?.includes('anxious'), 'traits must not initialize anxious');

  assert(
    !weaknesses.some(item => item.stateBiases?.some(
      bias => bias.state === ('fatigue' as never) || bias.state === ('anxiety' as never),
    )),
    'weakness configs must not reference fatigue/anxiety',
  );
  assert(
    !coreTalents.some(item => item.stateBiases?.some(bias => bias.state === ('anxiety' as never))),
    'core talents must not reference anxiety',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCanonicalFatigueAnxietyStatusMigrationTests();
  console.log('canonicalFatigueAnxietyStatusMigration.test.ts: ok');
}
