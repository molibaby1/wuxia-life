/**
 * P43 archetype recap and ending differentiation regression tests.
 */

import { EndingSystem } from '../src/core/EndingSystem';
import { composeP19FinalSummary } from '../src/p19/finalSummaryComposition';
import { profileHasP19Sections } from '../src/p19/reportBuilder';
import type { GameState } from '../src/types/eventTypes';
import {
  buildLateLifeShapingRecapLine,
  buildShapingPatternEndingTone,
  deriveDominantShapingLines,
} from '../src/utils/habitShapingSummary';
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
      externalSkill: 65,
      internalSkill: 60,
      qinggong: 55,
      chivalry: 45,
      constitution: 50,
      comprehension: 55,
      sect: null,
      title: null,
      reputation: 55,
      money: 800,
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
        fatigue: 0,
        discipline: 0,
        indulgence: 0,
        anxiety: 0,
        trainingHabit: 0,
        studyHabit: 0,
        businessHabit: 0,
        socialMomentum: 0,
        familyBond: 0,
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
        fatigue: 0,
        discipline: 0,
        indulgence: 0,
        anxiety: 0,
        trainingHabit: 5,
        studyHabit: 2,
        businessHabit: 0,
        socialMomentum: 0,
        familyBond: 0,
      },
    } as GameState['player'],
  });
  const line = buildLateLifeShapingRecapLine(martial.player.lifeStates);
  assert(line.includes('习武塑形'), 'recap should name martial shaping in player language');
  assert(line.includes('名望与战意'), 'recap should connect martial shaping to identity');
  assert(!line.includes('trainingHabit'), 'recap must not expose raw keys');

  const empty = buildLateLifeShapingRecapLine({ trainingHabit: 0, studyHabit: 1 });
  assert(empty.includes('长期塑形尚未凝成'), 'low shaping should degrade copy');
  console.log('✓ late-life shaping recap derivation');
}

function testP19CompositionIncludesShaping(): void {
  assert(profileHasP19Sections(), 'P19 sections required for composition');
  const state = makeState({
    flags: { route_orthodox: true },
    player: {
      lifeStates: {
        fatigue: 0,
        discipline: 0,
        indulgence: 0,
        anxiety: 0,
        trainingHabit: 4,
        studyHabit: 0,
        businessHabit: 0,
        socialMomentum: 0,
        familyBond: 0,
      },
    } as GameState['player'],
  });
  const composition = composeP19FinalSummary(state, sampleEnding());
  assert(
    composition.shapingRecapLine?.includes('习武塑形'),
    'P19 composition should surface shaping recap line',
  );
  assert(
    composition.composedSummary.includes('习武塑形'),
    'composed summary should include dominant shaping',
  );
  console.log('✓ P19 final summary shaping integration');
}

function testSameRouteShapingDifferentiation(): void {
  const baseFlags = { route_orthodox: true };
  const martialDominant = makeState({
    flags: baseFlags,
    player: {
      lifeStates: {
        fatigue: 0,
        discipline: 0,
        indulgence: 0,
        anxiety: 0,
        trainingHabit: 5,
        studyHabit: 2,
        businessHabit: 0,
        socialMomentum: 0,
        familyBond: 0,
      },
    } as GameState['player'],
  });
  const scholarDominant = makeState({
    flags: baseFlags,
    player: {
      lifeStates: {
        fatigue: 0,
        discipline: 0,
        indulgence: 0,
        anxiety: 0,
        trainingHabit: 2,
        studyHabit: 5,
        businessHabit: 0,
        socialMomentum: 0,
        familyBond: 0,
      },
    } as GameState['player'],
  });

  const martialTone = buildShapingPatternEndingTone(
    martialDominant.player.lifeStates,
    martialDominant.flags,
  );
  const scholarTone = buildShapingPatternEndingTone(
    scholarDominant.player.lifeStates,
    scholarDominant.flags,
  );
  assert(martialTone.includes('以武立名'), 'martial-route + training pattern tone');
  assert(scholarTone.includes('以文佐武'), 'martial-route + study pattern tone');
  assert(martialTone !== scholarTone, 'same route family should differ by shaping pattern');

  const martialSummary = composeP19FinalSummary(martialDominant, sampleEnding()).composedSummary;
  const scholarSummary = composeP19FinalSummary(scholarDominant, sampleEnding()).composedSummary;
  assert(martialSummary !== scholarSummary, 'full composed summaries must differ');

  const merchantFlags = { route_merchant: true };
  const businessDominant = makeState({
    flags: merchantFlags,
    player: {
      lifeStates: {
        fatigue: 0,
        discipline: 0,
        indulgence: 0,
        anxiety: 0,
        trainingHabit: 0,
        studyHabit: 0,
        businessHabit: 4,
        socialMomentum: 2,
        familyBond: 0,
      },
    } as GameState['player'],
  });
  const socialDominant = makeState({
    flags: merchantFlags,
    player: {
      lifeStates: {
        fatigue: 0,
        discipline: 0,
        indulgence: 0,
        anxiety: 0,
        trainingHabit: 0,
        studyHabit: 0,
        businessHabit: 2,
        socialMomentum: 4,
        familyBond: 0,
      },
    } as GameState['player'],
  });
  const businessTone = buildShapingPatternEndingTone(
    businessDominant.player.lifeStates,
    businessDominant.flags,
  );
  const socialTone = buildShapingPatternEndingTone(
    socialDominant.player.lifeStates,
    socialDominant.flags,
  );
  assert(businessTone.includes('算账'), 'livelihood route business pattern');
  assert(socialTone.includes('人脉'), 'livelihood route social pattern');
  assert(businessTone !== socialTone, 'livelihood family patterns must differ');
  console.log('✓ same-route shaping pattern ending differentiation');
}

function testLifeMemoryAndEndingLabelAlignment(): void {
  const state = makeState({
    player: {
      lifeStates: {
        fatigue: 0,
        discipline: 0,
        indulgence: 0,
        anxiety: 0,
        trainingHabit: 4,
        studyHabit: 3,
        businessHabit: 0,
        socialMomentum: 0,
        familyBond: 0,
      },
    } as GameState['player'],
  });
  const memoryLabels = (deriveLifeMemorySummary(state).habitTrajectory ?? []).map(
    (entry) => entry.label,
  );
  const recapLabels = deriveDominantShapingLines(state.player.lifeStates, 2).map(
    (line) => line.label,
  );
  assert(
    memoryLabels[0] === recapLabels[0],
    'life memory and recap derivation should share shortLabel vocabulary',
  );

  const recapLine = buildLateLifeShapingRecapLine(state.player.lifeStates);
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
