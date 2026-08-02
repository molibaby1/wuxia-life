import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { generateChoiceFeedback } from '../src/core/ChoiceFeedbackGenerator';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import type { PlayerState } from '../src/types/eventTypes';
import { derivePracticeTrajectoryLines } from '../src/utils/practiceTrajectorySummary';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function baseLifeStates(): PlayerState['lifeStates'] {
  return {
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
  };
}

console.log('=== P41 Habit Feedback Regression ===\n');

{
  const summary = derivePracticeTrajectoryLines({
    ...baseLifeStates(),
    studyHabit: 3,
    businessHabit: 2,
  });
  assert(summary.map(line => line.label).join(' / ') === '读书实践 / 营生实践', 'practice summary uses readable labels');
  console.log('✓ player-facing shaping summary output');
}

{
  const model = buildMainScreenModel(
    {
      martialPower: 20,
      constitution: 10,
      chivalry: 10,
      comprehension: 10,
      reputation: 10,
      money: 50,
      sect: '少林',
      lifeStates: { ...baseLifeStates(), trainingHabit: 3 },
    },
    {
      schemaVersion: '1.0.0',
      derivedAtAge: 22,
      routeStatus: {
        primary: { routeId: 'sect', name: '正道门派', phase: '路线进行中' },
        diagnostic: { activeRouteFlags: [] },
      },
    },
  );
  assert(!('shapingSummary' in model), 'main screen model must not expose shaping summary');
  console.log('✓ main screen shaping integration');
}

{
  const player = (lifeStates: Partial<PlayerState['lifeStates']>): PlayerState => ({
    name: '测试',
    age: 20,
    gender: 'male',
    martialPower: 10,
    chivalry: 10,
    constitution: 10,
    comprehension: 10,
    reputation: 10,
    money: 100,
    knowledge: 10,
    charisma: 10,
    businessAcumen: 0,
    influence: 0,
    connections: 0,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    sect: null,
    title: null,
    flags: {},
      children: 0,
      spouse: null,
      alive: true,
      lifeStates: { ...baseLifeStates(), ...lifeStates },
  });

  const feedback = generateChoiceFeedback({
    narrativeResult: '测试',
    effects: [],
    beforePlayer: player({ businessHabit: 1 }),
    afterPlayer: player({ businessHabit: 2 }),
  });
  assert(!feedback.player.longTermFlags.some((item) => item.flag === 'shaping_businessHabit_up'), 'business habit must not use shaping feedback');
  console.log('✓ choice feedback shaping hints');
}

{
  const state = {
    saveVersion: '1.0.0',
    lastSavedAt: Date.now(),
    gameTimestamp: 0,
    player: {
      name: '测试',
      gender: 'male' as const,
      age: 40,
      martialPower: 50,
      chivalry: 10,
      charisma: 50,
      constitution: 50,
      comprehension: 50,
      knowledge: 20,
      businessAcumen: 10,
      influence: 10,
      connections: 20,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      money: 1000,
      reputation: 30,
      sect: null,
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
      lifeStates: { ...baseLifeStates(), studyHabit: 2 },
    },
    currentTime: { year: 40, month: 1, day: 1 },
    flags: {},
    relations: {},
    eventHistory: [],
    statistics: { totalEvents: 0, totalChoices: 0, totalYears: 0 },
    achievements: [],
  };
  const memory = deriveLifeMemorySummary(state);
  const lines = (memory.habitTrajectory ?? []).map((entry) => `${entry.label} · ${entry.tierLabel}`).join(', ');
  assert(lines.includes('读书实践'), 'life memory recap includes study practice');
  assert(!lines.includes('亲族牵绊'), 'life memory practice trajectory excludes family shaping');
  console.log('✓ life memory habit trajectory recap');
}

console.log('\n=== P41 Habit Feedback Regression Passed ===');
