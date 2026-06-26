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

function createSampleLineSimulator(
  entry: (typeof P49_SAMPLE_LINE_MATRIX)[number],
  endAge: number,
): GameProcessSimulator {
  return new GameProcessSimulator({
    playerName: entry.personaName,
    gender: entry.gender,
    seed: entry.seed,
    choiceTendency: entry.choiceTendency,
    routeTrack: entry.routeTrack,
    p8PersonaId: entry.p8PersonaId,
    simulateYears: endAge,
    runUntilDeath: false,
    ageRange: { startAge: 0, endAge },
    maxEvents: endAge <= 40 ? 220 : 280,
    enableAutoSave: false,
    enableManualSave: false,
    enableSaveRestore: false,
    verbose: false,
    sampleId: entry.sampleId,
  });
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
      simulateYears: 50,
      runUntilDeath: false,
      maxEvents: 280,
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
    ageRange: { startAge: 0, endAge: 50 },
    totalYears: 50,
    finalAge: 50,
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
    const report = await createSampleLineSimulator(entry, 50).simulate();
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
    const report = await createSampleLineSimulator(entry, 40).simulate();
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
    const report = await createSampleLineSimulator(entry, 50).simulate();
    const summary = summarizeSampleLineRun({ entry, report });
    const cp45 = summary.checkpoints.find((cp) => cp.age === 45);
    assert(Boolean(cp45), `seed ${entry.seed}: missing age-45 checkpoint export`);
    assert(cp45!.post40PayoffDone === true, `seed ${entry.seed}: post40PayoffDone false at age 45`);
    const goal = cp45!.currentGoal ?? '';
    assert(isPlayerVisibleSampleLineText(goal), `seed ${entry.seed}: age-45 goal has raw key: ${goal}`);
    assert(
      goal.includes(expected.goalFragment),
      `seed ${entry.seed}: age-45 goal missing "${expected.goalFragment}": ${goal}`,
    );
    const rec45 = [...report.records].reverse().find((record) => record.age <= 45);
    assert(Boolean(rec45?.gameState.flags?.[expected.payoffFlag]), `seed ${entry.seed}: missing ${expected.payoffFlag}`);
  }
}

async function testLiveResidualSignalAlignment(): Promise<void> {
  const orthodox = P49_SAMPLE_LINE_MATRIX[0]!;
  const orthodoxReport = await createSampleLineSimulator(orthodox, 50).simulate();
  const orthodoxSummary = summarizeSampleLineRun({ entry: orthodox, report: orthodoxReport });
  const cp28 = orthodoxSummary.checkpoints.find((cp) => cp.age === 25)
    ?? orthodoxSummary.checkpoints.find((cp) => cp.age === 32);
  const rec28 = [...orthodoxReport.records].reverse().find((record) => record.age <= 28);
  const goal28 = rec28 ? (deriveSampleLineCurrentGoal(rec28.gameState) ?? '') : (cp28?.currentGoal ?? '');
  assert(isPlayerVisibleSampleLineText(goal28), `seed 301 residual cost goal has raw key: ${goal28}`);
  assert(
    goal28.includes('代价') || goal28.includes('义务'),
    `seed 301 residual cost goal missing at age 28: ${goal28}`,
  );
  const rec35 = [...orthodoxReport.records].reverse().find((record) => record.age <= 35);
  assert(Boolean(rec35), 'seed 301: missing age-35 checkpoint record for residual gray signal');
  const goal35 = deriveSampleLineCurrentGoal(rec35!.gameState) ?? '';
  assert(isPlayerVisibleSampleLineText(goal35), `seed 301 residual gray goal has raw key: ${goal35}`);
  assert(
    goal35.includes('灰度') || goal35.includes('代价'),
    `seed 301 residual gray goal missing by age 35: ${goal35}`,
  );

  const merchant = P49_SAMPLE_LINE_MATRIX[2]!;
  const merchantReport = await createSampleLineSimulator(merchant, 50).simulate();
  const rec35m = [...merchantReport.records].reverse().find((record) => record.age <= 35);
  assert(Boolean(rec35m?.gameState.flags?.merchant_midlife_debt), 'seed 804: merchant_midlife_debt missing by age 35');
  const goal35m = deriveSampleLineCurrentGoal(rec35m!.gameState) ?? '';
  assert(isPlayerVisibleSampleLineText(goal35m), `seed 804 residual debt goal has raw key: ${goal35m}`);
  assert(
    goal35m.includes('人情') || goal35m.includes('周转') || goal35m.includes('债'),
    `seed 804 residual debt goal missing by age 35: ${goal35m}`,
  );
  const cp40 = summarizeSampleLineRun({ entry: merchant, report: merchantReport }).checkpoints.find((cp) => cp.age === 40);
  const identity40 = cp40?.age40Identity ?? '';
  assert(isPlayerVisibleSampleLineText(identity40), `seed 804 age-40 identity has raw key: ${identity40}`);
  assert(
    identity40.includes('债') || identity40.includes('人情'),
    `seed 804 age-40 identity missing debt/favor: ${identity40}`,
  );
}

async function main(): Promise<void> {
  testMatrixSpec();
  testDeterministicExport();
  await testLiveDeterminism();
  await testLiveAge25GoalAlignment();
  await testLiveAge45PayoffAlignment();
  await testLiveResidualSignalAlignment();
  console.log('p49SampleLineReplayTests: all passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
