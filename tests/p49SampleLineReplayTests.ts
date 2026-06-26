import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  P49_CHECKPOINT_AGES,
  P49_SAMPLE_LINE_MATRIX,
  summarizeSampleLineRun,
} from '../src/p49/sampleLineReplay';
import {
  deriveSampleLineCurrentGoal,
  isPlayerVisibleSampleLineText,
} from '../src/p50/sampleLineExpression';
import type { GameProcessReport, GameProcessRecord } from '../src/types/simulationRecordTypes';
import type { GameState } from '../src/types/eventTypes';
import { GameProcessSimulator } from './GameProcessSimulator';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function makeState(age: number, flags: Record<string, unknown>): GameState {
  return {
    player: {
      age,
      name: 'fixture',
      gender: 'male',
      martialPower: 20,
      externalSkill: 10,
      internalSkill: 10,
      qinggong: 10,
      chivalry: 10,
      constitution: 50,
      comprehension: 30,
      sect: null,
      title: null,
      reputation: 10,
      money: 100,
      knowledge: 15,
      charisma: 10,
      businessAcumen: 10,
      influence: 8,
      connections: 5,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      children: 0,
      spouse: null,
      alive: true,
      flags: {},
      lifeStates: createDefaultPlayerLifeStates(),
    },
    flags,
    relations: {},
    achievements: [],
    eventHistory: [],
    routeStates: {},
  } as GameState;
}

function makeRecord(age: number, eventId: string, state: GameState): GameProcessRecord {
  return {
    age,
    eventId,
    eventTitle: eventId,
    eventType: 'auto',
    gameState: state,
    timestamp: new Date('2026-06-26T00:00:00.000Z').toISOString(),
  };
}

function testMatrixSpec(): void {
  assert(P49_SAMPLE_LINE_MATRIX.length === 3, `matrix length ${P49_SAMPLE_LINE_MATRIX.length}`);
  assert(P49_SAMPLE_LINE_MATRIX[0]?.seed === 301, 'orthodox seed mismatch');
  assert(P49_SAMPLE_LINE_MATRIX[1]?.seed === 303, 'demonic seed mismatch');
  assert(P49_SAMPLE_LINE_MATRIX[2]?.seed === 804, 'merchant seed mismatch');
  assert(P49_CHECKPOINT_AGES.join(',') === '13,18,25,32,40,45,50', 'checkpoint ages mismatch');
}

function testDeterministicExport(): void {
  const orthodox = P49_SAMPLE_LINE_MATRIX[0]!;
  const buildReport = (): GameProcessReport => ({
    id: 'fixture',
    timestamp: '2026-06-26T00:00:00.000Z',
    config: {
      playerName: orthodox.personaName,
      gender: orthodox.gender,
      simulateYears: 40,
      runUntilDeath: false,
      maxEvents: 200,
      enableAutoSave: false,
      enableManualSave: false,
      autoSaveMode: 'age',
      saveAgeInterval: 5,
      saveEventInterval: 10,
      enableSaveRestore: false,
      maxRestoreCount: 0,
      verbose: false,
      choiceTendency: orthodox.choiceTendency,
    },
    randomSeed: orthodox.seed,
    runMode: 'age_range',
    ageRange: { startAge: 0, endAge: 40 },
    totalYears: 40,
    finalAge: 40,
    isAlive: true,
    deathReason: null,
    totalEvents: 5,
    totalChoices: 0,
    totalSaves: 0,
    totalLoads: 0,
    persistenceConsistency: { totalChecks: 0, passedChecks: 0, failedChecks: 0, results: [] },
    records: P49_CHECKPOINT_AGES.map((age) =>
      makeRecord(age, `event_age_${age}`, makeState(age, { route_orthodox: true })),
    ),
    statistics: {
      childhoodEvents: 1,
      youthEvents: 1,
      adultEvents: 2,
      elderlyEvents: 1,
      autoEvents: 5,
      choiceEvents: 0,
      martialPowerGrowth: 10,
      moneyGrowth: 0,
      sectJoined: null,
      lifeStates: createDefaultPlayerLifeStates(),
      growthBiasSummary: ['training'],
      flags: { route_orthodox: true },
    },
  });

  const first = summarizeSampleLineRun({ entry: orthodox, report: buildReport() });
  const second = summarizeSampleLineRun({ entry: orthodox, report: buildReport() });
  assert(first.deterministicHash === second.deterministicHash, 'checkpoint export not deterministic');
  assert(first.checkpoints.length === 7, 'expected 7 checkpoint exports');
  assert(Boolean(first.checkpoints[0]?.lifeMemoryEntry), 'life-memory entry missing');
}

async function testLiveDeterminism(): Promise<void> {
  const entry = P49_SAMPLE_LINE_MATRIX[0]!;
  const runOnce = async () => {
    const simulator = new GameProcessSimulator({
      playerName: entry.personaName,
      gender: entry.gender,
      seed: entry.seed,
      choiceTendency: entry.choiceTendency,
      routeTrack: entry.routeTrack,
      simulateYears: 40,
      runUntilDeath: false,
      ageRange: { startAge: 0, endAge: 40 },
      maxEvents: 220,
      enableAutoSave: false,
      enableManualSave: false,
      enableSaveRestore: false,
      verbose: false,
      sampleId: entry.sampleId,
    });
    const report = await simulator.simulate();
    return summarizeSampleLineRun({ entry, report }).deterministicHash;
  };

  const hashA = await runOnce();
  const hashB = await runOnce();
  assert(hashA === hashB, `live replay not deterministic: ${hashA} vs ${hashB}`);
}

function assertAge25GoalForLine(seed: number, goal: string): void {
  assert(isPlayerVisibleSampleLineText(goal), `seed ${seed} age-25 goal has raw key: ${goal}`);
  assert(!goal.includes('试探底线'), `seed ${seed} age-25 goal bleeds demonic: ${goal}`);
  if (seed === 301) {
    assert(
      goal.includes('行侠') || goal.includes('门派'),
      `seed 301 age-25 goal not orthodox: ${goal}`,
    );
  } else if (seed === 303) {
    assert(
      goal.includes('力量') || goal.includes('地盘') || goal.includes('邪') || goal.includes('诱惑'),
      `seed 303 age-25 goal not demonic: ${goal}`,
    );
  } else if (seed === 804) {
    assert(
      goal.includes('店铺') || goal.includes('经营') || goal.includes('周转'),
      `seed 804 age-25 goal not merchant: ${goal}`,
    );
  }
}

async function testLiveAge25GoalAlignment(): Promise<void> {
  for (const entry of P49_SAMPLE_LINE_MATRIX) {
    const simulator = new GameProcessSimulator({
      playerName: entry.personaName,
      gender: entry.gender,
      seed: entry.seed,
      choiceTendency: entry.choiceTendency,
      routeTrack: entry.routeTrack,
      p8PersonaId: entry.p8PersonaId,
      simulateYears: 40,
      runUntilDeath: false,
      ageRange: { startAge: 0, endAge: 40 },
      maxEvents: 220,
      enableAutoSave: false,
      enableManualSave: false,
      enableSaveRestore: false,
      verbose: false,
      sampleId: entry.sampleId,
    });
    const report = await simulator.simulate();
    const summary = summarizeSampleLineRun({ entry, report });
    const cp25 = summary.checkpoints.find((cp) => cp.age === 25);
    assert(Boolean(cp25), `seed ${entry.seed}: missing age-25 checkpoint export`);
    const goal = cp25!.currentGoal ?? deriveSampleLineCurrentGoal(
      report.records.find((r) => r.age <= 25)?.gameState ?? report.records.at(-1)!.gameState,
    ) ?? '';
    assertAge25GoalForLine(entry.seed, goal);
  }
}

async function testLiveAge45PayoffAlignment(): Promise<void> {
  const expectations: Array<{ seed: number; payoffFlag: string; goalFragment: string }> = [
    { seed: 301, payoffFlag: 'orthodox_age45_payoff_done', goalFragment: '传承' },
    { seed: 303, payoffFlag: 'demonic_age45_payoff_done', goalFragment: '地盘' },
    { seed: 804, payoffFlag: 'merchant_age45_payoff_done', goalFragment: '扩张' },
  ];
  for (const entry of P49_SAMPLE_LINE_MATRIX) {
    const expected = expectations.find((item) => item.seed === entry.seed)!;
    const simulator = new GameProcessSimulator({
      playerName: entry.personaName,
      gender: entry.gender,
      seed: entry.seed,
      choiceTendency: entry.choiceTendency,
      routeTrack: entry.routeTrack,
      p8PersonaId: entry.p8PersonaId,
      simulateYears: 50,
      runUntilDeath: false,
      ageRange: { startAge: 0, endAge: 50 },
      maxEvents: 280,
      enableAutoSave: false,
      enableManualSave: false,
      enableSaveRestore: false,
      verbose: false,
      sampleId: entry.sampleId,
    });
    const report = await simulator.simulate();
    const summary = summarizeSampleLineRun({ entry, report });
    const cp45 = summary.checkpoints.find((cp) => cp.age === 45);
    assert(Boolean(cp45), `seed ${entry.seed}: missing age-45 checkpoint export`);
    assert(cp45!.post40PayoffDone === true, `seed ${entry.seed}: post40PayoffDone false at age 45`);
    const goal = cp45!.currentGoal ?? '';
    assert(
      goal.includes(expected.goalFragment),
      `seed ${entry.seed}: age-45 goal missing "${expected.goalFragment}": ${goal}`,
    );
    const rec45 = [...report.records].reverse().find((record) => record.age <= 45);
    assert(Boolean(rec45?.gameState.flags?.[expected.payoffFlag]), `seed ${entry.seed}: missing ${expected.payoffFlag}`);
  }
}

async function main(): Promise<void> {
  testMatrixSpec();
  testDeterministicExport();
  await testLiveDeterminism();
  await testLiveAge25GoalAlignment();
  await testLiveAge45PayoffAlignment();
  console.log('p49SampleLineReplayTests: all passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
