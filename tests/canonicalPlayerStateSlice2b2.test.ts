import { coreTalents } from '../src/data/traits/coreTalents';
import { origins } from '../src/data/traits/origins';
import { temperaments } from '../src/data/traits/temperaments';
import { weaknesses } from '../src/data/traits/weaknesses';
import {
  GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
} from '../src/contracts/gameStateSnapshot';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import { createDefaultTimeSource } from '../src/headless/adapters/timeSource';
import { gameEngine } from '../src/core/GameEngineIntegration';
import { traitSystem } from '../src/core/TraitSystem';
import { adaptHeadlessRunToGameProcessReport } from '../src/headless/playability/adaptToGameProcessReport';
import { getP8PersonaById } from '../src/p8/personas';
import { collectReplayMetrics } from '../src/p8/collectPersonaMetrics';
import type { EventDefinition, GameState, PlayerState } from '../src/types/eventTypes';
import type { GameProcessReport } from '../src/types/simulationRecordTypes';
import type { HeadlessPersonaRunResult } from '../src/headless/playability/types';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function countBy<T>(items: string[], candidates: readonly T[]): number {
  const candidateSet = new Set(candidates);
  return items.filter(item => candidateSet.has(item as T)).length;
}

export function runCanonicalPlayerStateSlice2b2Tests(): void {
  gameEngine.startNewGame('Canonical Slice 2B-2', 'male');
  const state = gameEngine.getGameState();
  const player = state.player as unknown as Record<string, unknown>;
  const traits = Array.isArray(player.traits) ? player.traits as string[] : [];

  assert(traits.length > 0, 'new game must persist canonical player.traits');
  assert(countBy(traits, coreTalents.map(item => item.id)) === 1, 'new game must include one core talent trait');
  assert(countBy(traits, weaknesses.map(item => item.id)) === 1, 'new game must include one weakness trait');
  assert(countBy(traits, temperaments.map(item => item.id)) === 1, 'new game must include one temperament trait');
  assert(countBy(traits, origins.map(item => item.id)) === 0, 'origin ids must not enter player.traits');
  assert(!('traitProfile' in player), 'player must not persist traitProfile');
  assert(!('growthBiasSummary' in player), 'player must not persist growthBiasSummary');
  assert(!('rareComboTitle' in player), 'player must not persist rareComboTitle');
  assert(!('rareComboDescription' in player), 'player must not persist rareComboDescription');

  const behaviorPlayer = traitSystem.applyTraits(
    { traits: [] } as PlayerState,
    ['keen_mind', 'frail', 'disciplined'],
  );
  assert(behaviorPlayer.comprehension === 6, 'trait initial stat modifier must be preserved');
  assert(behaviorPlayer.constitution === -8, 'weakness constitution bias must be preserved');
  assert(behaviorPlayer.traits.includes('disciplined'), 'disciplined trait must remain canonical');
  assert(
    !Object.prototype.hasOwnProperty.call(behaviorPlayer.lifeStates ?? {}, 'discipline'),
    'disciplined trait must not project a discipline life state',
  );
  assert(
    traitSystem.getGrowthMultiplier(behaviorPlayer, 'comprehension') === 1.3,
    'trait growth multiplier must read canonical traits',
  );
  const comprehensionEvent = {
    category: 'random_encounter',
    metadata: { tags: ['comprehension'] },
  } as EventDefinition;
  assert(
    traitSystem.getEventWeightMultiplier({ player: behaviorPlayer, flags: {} } as never, comprehensionEvent) > 1,
    'trait event weighting must read canonical traits',
  );

  const snapshot = defaultSnapshotConverter.toSnapshot(state, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: createDefaultTimeSource(),
  });
  assert(
    snapshot.metadata.schemaVersion === GAME_STATE_SNAPSHOT_SCHEMA_VERSION &&
      snapshot.metadata.schemaVersion === '3.13.0',
      'canonical traits snapshot must use schema 3.13.0',
  );
  assertDeepEqual(snapshot.state.player.traits, traits, 'snapshot must persist traits');
  assert(!('traitProfile' in snapshot.state.player), 'snapshot must not persist traitProfile');
  assert(!('growthBiasSummary' in snapshot.state.player), 'snapshot must not persist growthBiasSummary');

  const restored = defaultSnapshotConverter.fromSnapshot(snapshot);
  const restoredPlayer = restored.player as unknown as Record<string, unknown>;
  assertDeepEqual(restoredPlayer.traits, traits, 'snapshot round-trip must preserve traits');
  assert(!('traitProfile' in restoredPlayer), 'restore must not recreate traitProfile');

  const reportPersona = getP8PersonaById('p8-balanced-wei')!;
  const report = adaptHeadlessRunToGameProcessReport(
    { persona: reportPersona, endAge: 40, catalogVersion: '1.0.0' },
    {
      personaId: reportPersona.id,
      finalAge: 40,
      isAlive: true,
      deathReason: null,
      finalGameState: {
        ...state,
        flags: { ...state.flags, origin_id: 'merchant_house' },
      },
      records: [],
      choiceDiagnostics: [],
      activeActionSelectionReasons: [],
      totalChoices: 0,
      totalActiveActions: 0,
      randomSeed: reportPersona.seed,
      catalogVersion: '1.0.0',
      stepsExecuted: 0,
      stoppedReason: 'end_age',
    } satisfies HeadlessPersonaRunResult,
  );
  assert(report.statistics.origin === '商户之家', 'report must preserve canonical origin display');

  const makeReplayReport = (origin: string): GameProcessReport => ({
    id: `origin-${origin}`,
    timestamp: '',
    config: {} as GameProcessReport['config'],
    randomSeed: 1,
    runMode: 'age_range',
    ageRange: { startAge: 0, endAge: 40 },
    totalYears: 1,
    finalAge: 40,
    isAlive: true,
    deathReason: null,
    totalEvents: 1,
    totalChoices: 0,
    totalSaves: 0,
    totalLoads: 0,
    persistenceConsistency: { totalChecks: 0, passedChecks: 0, failedChecks: 0, results: [] },
    records: [{
      age: 40,
      eventId: 'p9_origin_hash_probe',
      eventTitle: 'probe',
      eventType: 'auto',
      gameState: {
        flags: {},
        player: { age: 40, martialPower: 20, money: 100, children: 0 },
      } as GameState,
      timestamp: '',
    }],
    statistics: {
      childhoodEvents: 0,
      youthEvents: 0,
      adultEvents: 1,
      elderlyEvents: 0,
      autoEvents: 1,
      choiceEvents: 0,
      martialPowerGrowth: 0,
      moneyGrowth: 0,
      sectJoined: null,
      children: 0,
      origin,
    },
  });
  const originA = collectReplayMetrics([
    { personaId: 'p8-cautious-han', report: makeReplayReport('寒门') },
    { personaId: 'p8-balanced-wei', report: makeReplayReport('商户之家') },
  ]);
  const originB = collectReplayMetrics([
    { personaId: 'p8-cautious-han', report: makeReplayReport('武林世家') },
    { personaId: 'p8-balanced-wei', report: makeReplayReport('边关军户') },
  ]);
  assert(
    originA.pairwiseSimilarities[0]?.score === originB.pairwiseSimilarities[0]?.score,
    'origin text must not alter replay similarity',
  );
}

function assertDeepEqual(actual: unknown, expected: unknown, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCanonicalPlayerStateSlice2b2Tests();
  console.log('canonicalPlayerStateSlice2b2.test.ts: ok');
}
