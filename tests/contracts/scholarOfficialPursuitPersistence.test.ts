import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../../src/core/GameEngineIntegration';
import {
  appendScholarOfficialPursuitEntry,
  SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY,
} from '../../src/core/scholarOfficialPursuit';
import { defaultSnapshotConverter } from '../../src/headless/snapshot/SnapshotConverter';
import { createDefaultTimeSource } from '../../src/headless/adapters/timeSource';
import { cloneCanonicalGameState } from '../../src/contracts/validation/canonicalGameStateValidation';

const time = createDefaultTimeSource();

function acceptedState() {
  const state = new GameEngineIntegration().getGameState();
  state.currentTime = { year: 1, month: 1, day: 1 };
  state.player.age = 18;
  return appendScholarOfficialPursuitEntry(state, {
    type: 'invitation_response',
    date: { year: 1, month: 1, day: 1 },
    age: 18,
    sourceEventId: 'p138_scholar_official_invitation',
    response: 'accepted',
  });
}

function toSnapshot(state: ReturnType<typeof acceptedState>) {
  return defaultSnapshotConverter.toSnapshot(state, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time,
  });
}

function testSnapshotJsonRoundTripAndLoadMirrorSync(): void {
  const accepted = acceptedState();
  const examState = cloneCanonicalGameState(accepted);
  examState.currentTime = { year: 1, month: 3, day: 1 };
  const state = appendScholarOfficialPursuitEntry(examState, {
    type: 'exam_attempt',
    attemptNumber: 1,
    startedAt: { year: 1, month: 2, day: 1 },
    completedAt: { year: 1, month: 3, day: 1 },
    ageAtStart: 18,
    knowledgeAtStart: 20,
    rulesVersion: 'curve-a-v1',
    adoptedPassRate: 0.6,
    result: 'failed',
  });
  const snapshot = JSON.parse(JSON.stringify(toSnapshot(state))) as ReturnType<typeof toSnapshot>;
  assert.equal(snapshot.metadata.schemaVersion, '3.16.0');

  const hydrated = defaultSnapshotConverter.fromSnapshot(snapshot);
  assert.deepEqual(hydrated.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY], state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY]);
  assert.deepEqual(hydrated.player.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY], state.player.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY]);

  const topLevelOnly = cloneCanonicalGameState(state);
  delete topLevelOnly.player.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY];
  const topLevelOnlyHydrated = defaultSnapshotConverter.fromSnapshot(
    JSON.parse(JSON.stringify(toSnapshot(topLevelOnly))) as ReturnType<typeof toSnapshot>,
  );
  assert.equal(Object.hasOwn(topLevelOnlyHydrated.player.flags, SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY), false);

  const engine = new GameEngineIntegration();
  engine.loadGameState(topLevelOnlyHydrated);
  assert.deepEqual(
    engine.getGameState().player.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY],
    engine.getGameState().flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY],
    'runtime loading validates top-level authority and restores its compatibility mirror',
  );

  const isolated = defaultSnapshotConverter.fromSnapshot(snapshot);
  const snapshotLedger = snapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
    entries: Array<{ date: { day: number } }>;
  };
  const isolatedLedger = isolated.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
    entries: Array<{ date: { day: number } }>;
  };
  isolatedLedger.entries[0].date.day = 2;
  assert.equal(snapshotLedger.entries[0].date.day, 1, 'snapshot and hydrated ledger copies remain isolated');
}

function testBusinessInvalidLedgerPassesGenericSnapshotShapeButFailsCaseLoad(): void {
  const invalid = cloneCanonicalGameState(acceptedState());
  const ledger = invalid.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
    entries: Array<Record<string, unknown>>;
  };
  ledger.entries.push({ ...ledger.entries[0], sequence: 1 });
  invalid.player.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] = structuredClone(ledger);

  const snapshot = JSON.parse(JSON.stringify(toSnapshot(invalid))) as ReturnType<typeof toSnapshot>;
  const hydrated = defaultSnapshotConverter.fromSnapshot(snapshot);
  assert.throws(
    () => new GameEngineIntegration().loadGameState(hydrated),
    /sequence/i,
    'business-history errors are reported by the case load boundary, not the generic Snapshot schema',
  );
}

testSnapshotJsonRoundTripAndLoadMirrorSync();
testBusinessInvalidLedgerPassesGenericSnapshotShapeButFailsCaseLoad();
console.log('scholarOfficialPursuitPersistence.test.ts: ok');
