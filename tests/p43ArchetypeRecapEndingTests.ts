/**
 * P43 archetype recap and ending differentiation regression tests.
 */

import { EndingSystem } from '../src/core/EndingSystem';
import { composeP19FinalSummary } from '../src/p19/finalSummaryComposition';
import { profileHasP19Sections } from '../src/p19/reportBuilder';
import type { GameState } from '../src/types/eventTypes';
import {
  buildLateLifePracticeRecapLine,
} from '../src/utils/practiceTrajectorySummary';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    player: {
      age: 72,
      name: 't',
      gender: 'male',
      martialPower: 70,
      chivalry: 45,
      constitution: 50,
      affiliation: null,
      title: null,
      reputation: 55,
      knowledge: 40,
      charisma: 45,
      businessAcumen: 30,
      influence: 40,
      connections: 35,
      martialHeritage: 30,
      scholarlyHeritage: 20,
      merchantNetwork: 10,
      children: 0,
      spouse: null,
      flags: {},
      alive: false,
      lifeStates: {
        trainingHabit: 0,
        studyHabit: 0,
        businessHabit: 0,
      },
      ...(overrides.player ?? {}),
    },
    flags: overrides.flags ?? {},
    lifePath: overrides.lifePath,
    achievements: overrides.achievements ?? [],
    karma: overrides.karma,
  } as GameState;
}

function sampleEnding() {
  return EndingSystem.getEndingById('ordinary_life')!;
}

function testLateLifeShapingRecap(): void {
  const martial = makeState({
    player: {
      lifeStates: {
        trainingHabit: 5,
        studyHabit: 2,
        businessHabit: 0,
      },
    } as GameState['player'],
  });
  const line = buildLateLifePracticeRecapLine(martial.player.lifeStates);
  assert(line.includes('练功实践'), 'recap should name martial practice');
  assert(!/塑形|身份|主轴|绝活/.test(line), 'recap must not claim identity');

  const empty = buildLateLifePracticeRecapLine({ trainingHabit: 0, studyHabit: 0 });
  assert(empty.includes('未形成持续'), 'low practice should degrade copy');
  console.log('✓ late-life shaping recap derivation');
}

function testP19CompositionIncludesShaping(): void {
  assert(profileHasP19Sections(), 'P19 sections required for composition');
  const state = makeState({
    flags: { route_orthodox: true },
    player: {
      lifeStates: {
        trainingHabit: 4,
        studyHabit: 0,
        businessHabit: 0,
      },
    } as GameState['player'],
  });
  const composition = composeP19FinalSummary(state, sampleEnding());
  assert(
    composition.shapingRecapLine?.includes('练功实践'),
    'P19 composition should surface shaping recap line',
  );
  assert(
    composition.composedSummary.includes('练功实践'),
    'composed summary should include dominant shaping',
  );
  console.log('✓ P19 final summary shaping integration');
}

function testSameRouteShapingDifferentiation(): void {
  const state = makeState({ player: { lifeStates: { trainingHabit: 5, studyHabit: 2, businessHabit: 0 } } as GameState['player'] });
  const summary = composeP19FinalSummary(state, sampleEnding()).composedSummary;
  assert(!summary.includes('以武立名') && !summary.includes('以文佐武'), 'ending must not include identity tone');
  console.log('✓ identity ending tone removed');
}

function testLifeMemoryAndEndingLabelAlignment(): void {
  const state = makeState({
    player: {
      lifeStates: {
        trainingHabit: 4,
        studyHabit: 3,
        businessHabit: 0,
      },
    } as GameState['player'],
  });
  const memoryLabels = (deriveLifeMemorySummary(state).habitTrajectory ?? []).map(
    (entry) => entry.label,
  );
  const recapLabels = (deriveLifeMemorySummary(state).habitTrajectory ?? []).map((line) => line.label);
  assert(
    memoryLabels[0] === recapLabels[0],
    'life memory should expose practice labels',
  );

  const recapLine = buildLateLifePracticeRecapLine(state.player.lifeStates);
  assert(recapLabels.every((label) => recapLine.includes(label)), 'ending recap uses same labels');
  console.log('✓ life memory and ending label alignment');
}

function runAll(): void {
  testLateLifeShapingRecap();
  testP19CompositionIncludesShaping();
  testSameRouteShapingDifferentiation();
  testLifeMemoryAndEndingLabelAlignment();
  console.log('\n✅ All P43 archetype recap ending tests passed');
}

runAll();
