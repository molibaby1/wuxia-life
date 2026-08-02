import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  P45_REPLAY_MATRIX,
  formatP45TrajectoryMarkdown,
  summarizeTrajectoryRun,
} from '../src/p45/trajectoryReplay';
import type { GameProcessReport, GameProcessRecord } from '../src/types/simulationRecordTypes';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function makeState(
  age: number,
  overrides: Partial<GameState['player']> = {},
  flags: Record<string, unknown> = {},
): GameState {
  return {
    player: {
      age,
      name: 'p45-fixture',
      gender: 'female',
      martialPower: 20,
      chivalry: 20,
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
      ...overrides,
      lifeStates: createDefaultPlayerLifeStates(overrides.lifeStates),
    },
    flags,
    relations: {},
    achievements: [],
    eventHistory: [],
  } as GameState;
}

function makeRecord(
  age: number,
  eventId: string,
  eventTitle: string,
  state: GameState,
  outcomeText?: string,
): GameProcessRecord {
  return {
    age,
    eventId,
    eventTitle,
    eventType: 'auto',
    gameState: state,
    outcomeText,
    timestamp: new Date(`2026-01-${String(Math.min(age + 1, 28)).padStart(2, '0')}T00:00:00.000Z`).toISOString(),
  };
}

function buildFixtureReport(): GameProcessReport {
  const age10 = makeState(10, {
    lifeStates: { trainingHabit: 2 },
    martialPower: 28,
  });
  const age20 = makeState(20, {
    lifeStates: { trainingHabit: 3 },
    martialPower: 40,
  }, { joined_sect: true, route_orthodox: true });
  const age30 = makeState(30, {
    lifeStates: { trainingHabit: 4, studyHabit: 1 },
    martialPower: 55,
    reputation: 30,
  }, { joined_sect: true, route_orthodox: true });
  const age40 = makeState(40, {
    lifeStates: { trainingHabit: 5, studyHabit: 1 },
    martialPower: 70,
    reputation: 50,
  }, { joined_sect: true, route_orthodox: true, sectMember: true });

  age40.eventHistory = [
    { eventId: 'p26_training_habit_midlife_callback', eventTitle: '中年功业回响' } as GameState['eventHistory'][0],
  ];

  const records = [
    makeRecord(10, 'childhood_training', '幼年习武', age10, '练功日久'),
    makeRecord(20, 'p21_martial_route_reinforcement', '武路强化', age20, '你更坚定地走向武路'),
    makeRecord(30, 'p26_training_habit_midlife_callback', '中年功业回响', age30, '早年练功习惯开始回响'),
    makeRecord(40, 'age40_summary', '四十回看', age40, '江湖身份已经成形'),
  ];

  return {
    id: 'p45-fixture',
    timestamp: new Date('2026-06-25T00:00:00.000Z').toISOString(),
    config: {
      playerName: 'p45-fixture',
      gender: 'female',
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
      choiceTendency: 'martial',
      p8PersonaId: 'p8-martial-lin',
    },
    randomSeed: 801,
    runMode: 'age_range',
    ageRange: { startAge: 0, endAge: 40 },
    totalYears: 40,
    finalAge: 40,
    isAlive: true,
    deathReason: null,
    totalEvents: records.length,
    totalChoices: 0,
    totalSaves: 0,
    totalLoads: 0,
    persistenceConsistency: {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      results: [],
    },
    records,
    statistics: {
      childhoodEvents: 1,
      youthEvents: 1,
      adultEvents: 2,
      elderlyEvents: 0,
      autoEvents: 4,
      choiceEvents: 0,
      martialPowerGrowth: 50,
      moneyGrowth: 0,
      sectJoined: '少林派',
      lifeStates: { ...age40.player.lifeStates },
      growthBiasSummary: ['training'],
      flags: { joined_sect: true, route_orthodox: true, sectMember: true },
    },
  };
}

function testMatrixCoverage(): void {
  assert(P45_REPLAY_MATRIX.length === 4, `expected 4 baseline personas, got ${P45_REPLAY_MATRIX.length}`);
  const ids = P45_REPLAY_MATRIX.map(entry => entry.personaId);
  assert(
    ids.join(',') === 'p8-martial-lin,p8-scholar-su,p8-wealth-shen,p8-balanced-wei',
    `unexpected matrix ids: ${ids.join(',')}`,
  );
}

function testTrajectorySummaryShape(): void {
  const report = buildFixtureReport();
  const summary = summarizeTrajectoryRun({
    personaLabel: 'Martial / training-leaning',
    personaId: 'p8-martial-lin',
    seed: 801,
    report,
  });

  assert(summary.checkpoints.length === 4, `expected 4 checkpoints, got ${summary.checkpoints.length}`);
  assert(summary.checkpoints[0]?.age === 10, 'checkpoint age 10 missing');
  assert(summary.checkpoints[1]?.dominantAxes.some(axis => axis.includes('练功实践')), 'age20 dominant axis should include training practice');
  assert(summary.checkpoints[2]?.consequenceSignals.some(signal => signal.includes('p26_training_habit_midlife_callback')), 'age30 consequence signal should capture callback');

  const lifeMemory = deriveLifeMemorySummary(report.records.at(-1)!.gameState);
  assert(lifeMemory.habitTrajectory?.length, 'fixture life memory should expose habit trajectory');
  assert(summary.finalSummary.lifeMemoryEntryPoints.length > 0, 'final summary should include life-memory entry points');
  assert(summary.finalSummary.routeSignal.length > 0, 'final summary should include route signal');
}

function testMarkdownFormatting(): void {
  const report = buildFixtureReport();
  const summary = summarizeTrajectoryRun({
    personaLabel: 'Martial / training-leaning',
    personaId: 'p8-martial-lin',
    seed: 801,
    report,
  });
  const markdown = formatP45TrajectoryMarkdown({
    generatedAt: '2026-06-25T00:00:00.000Z',
    ageWindow: { startAge: 0, endAge: 40 },
    checkpointAges: [10, 20, 30, 40],
    summaries: [summary],
  });

  assert(markdown.includes('# P45 Trajectory Replay Report'), 'missing report heading');
  assert(markdown.includes('p8-martial-lin'), 'missing persona id');
  assert(markdown.includes('| 20 |'), 'missing checkpoint row');
  assert(markdown.includes('Life-memory entry'), 'missing final summary section');
}

function testMerchantRouteSignal(): void {
  const age20 = makeState(20, {
    lifeStates: {
      trainingHabit: 1,
      studyHabit: 0,
      businessHabit: 3,
    },
    money: 260,
    businessAcumen: 18,
  }, { p8_persona_id: 'p8-wealth-shen', route_wealth_committed: true, p22_wealth_route_forked: true });

  const report = buildFixtureReport();
  report.records[1] = makeRecord(20, 'p22_early_wealth_route_fork', '商路初分', age20, '商路已经成形');
  report.statistics.sectJoined = null;
  report.statistics.growthBiasSummary = ['business'];
  report.config.p8PersonaId = 'p8-wealth-shen';

  const summary = summarizeTrajectoryRun({
    personaLabel: 'Business / livelihood-leaning',
    personaId: 'p8-wealth-shen',
    seed: 804,
    report,
  });

  assert(summary.checkpoints[1]?.routeSignal.includes('route_wealth_committed'), `P45 route signal must report explicit flags: ${summary.checkpoints[1]?.routeSignal}`);
}

function main(): void {
  testMatrixCoverage();
  testTrajectorySummaryShape();
  testMarkdownFormatting();
  testMerchantRouteSignal();
  console.log('p45TrajectoryReplayTests: all passed');
}

main();
