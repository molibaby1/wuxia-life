import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  P49_CHECKPOINT_AGES,
  P49_SAMPLE_LINE_MATRIX,
  summarizeSampleLineRun,
} from '../src/p49/sampleLineReplay';
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
  assert(P49_CHECKPOINT_AGES.join(',') === '13,18,25,32,40', 'checkpoint ages mismatch');
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
  assert(first.checkpoints.length === 5, 'expected 5 checkpoint exports');
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

async function main(): Promise<void> {
  testMatrixSpec();
  testDeterministicExport();
  await testLiveDeterminism();
  console.log('p49SampleLineReplayTests: all passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
