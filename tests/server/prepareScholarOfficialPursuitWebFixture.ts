import assert from 'node:assert/strict';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot.js';
import {
  appendScholarOfficialPursuitEntry,
  SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID,
  SCHOLAR_OFFICIAL_PURSUIT_INVITATION_EVENT_ID,
} from '../../src/core/scholarOfficialPursuit.js';
import type { GameState } from '../../src/types/eventTypes.js';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl.js';
import { closePool } from '../../server/src/db/pool.js';
import { withTransaction } from '../../server/src/db/transaction.js';
import * as progressionCheckpointRepo from '../../server/src/repositories/progressionCheckpointRepository.js';
import * as saveSlotRepo from '../../server/src/repositories/saveSlotRepository.js';
import * as snapshotRepo from '../../server/src/repositories/snapshotRepository.js';

type FixtureScenario =
  | 'invitation'
  | 'active'
  | 'too-young'
  | 'low-knowledge'
  | 'exam-cooldown'
  | 'exam-cooldown-ready'
  | 'appointment'
  | 'abandoned-appointment'
  | 'terminal-unfinished'
  | 'terminal-completed'
  | 'stale-cas';

interface FixtureSlotRow {
  id: string;
  slot_index: number;
  version: number;
  current_snapshot_id: string;
  session_id: string;
  engine_version: string;
  event_catalog_version: string;
  snapshot: GameStateSnapshot;
}

function requireIsolatedDatabase(databaseUrl: string): void {
  const url = new URL(databaseUrl);
  const databaseName = decodeURIComponent(url.pathname.slice(1));
  assert(
    ['127.0.0.1', 'localhost'].includes(url.hostname) &&
      /^wuxia_p6b_d_scholar_web_[a-z0-9_]+$/i.test(databaseName),
    'Web fixtures require a local wuxia_p6b_d_scholar_web_* database.',
  );
}

function gameStateFromSnapshot(snapshot: GameStateSnapshot): GameState {
  return structuredClone(snapshot.state) as unknown as GameState;
}

function withMarketStallObjective(state: GameState): GameState {
  const invitedAt = { year: 4, month: 5, day: 3 };
  return {
    ...state,
    flags: { ...state.flags, p138_market_stall_accepted: true },
    player: {
      ...state.player,
      flags: { ...(state.player.flags ?? {}), p138_market_stall_accepted: true },
    },
    eventHistory: [
      ...(state.eventHistory ?? []),
      { eventId: 'p138_market_stall_invitation', age: 20, timestamp: invitedAt },
    ],
  };
}

function prepareScenario(snapshot: GameStateSnapshot, scenario: FixtureScenario): GameStateSnapshot {
  if (scenario === 'stale-cas') return structuredClone(snapshot);

  const cleanSnapshot = HeadlessEngineSessionImpl.create({
    playerName: snapshot.state.player.name,
    gender: snapshot.state.player.gender,
    catalogVersion: snapshot.metadata.eventCatalogVersion,
    randomSeed: 29,
  }).serialize();
  const snapshotState = structuredClone(cleanSnapshot.state);
  delete snapshotState.pendingStoryEventId;
  let state = gameStateFromSnapshot({ ...cleanSnapshot, state: snapshotState });
  state.player.age = scenario === 'too-young' ? 17 : 20;
  state.player.knowledge = scenario === 'low-knowledge'
    ? 19
    : Math.max(20, state.player.knowledge);
  state.player.alive = true;
  state.currentTime = { year: 4, month: 5, day: 3 };
  state = withMarketStallObjective(state);

  let pendingStoryEventId: string | undefined;
  if (scenario === 'invitation') {
    pendingStoryEventId = SCHOLAR_OFFICIAL_PURSUIT_INVITATION_EVENT_ID;
  } else {
    state = appendScholarOfficialPursuitEntry(state, {
      type: 'invitation_response',
      date: { year: 4, month: 5, day: 3 },
      age: state.player.age,
      sourceEventId: SCHOLAR_OFFICIAL_PURSUIT_INVITATION_EVENT_ID,
      response: 'accepted',
    });
  }

  if (
    scenario === 'appointment' ||
    scenario === 'abandoned-appointment' ||
    scenario === 'terminal-completed'
  ) {
    state.currentTime = { year: 4, month: 7, day: 3 };
    state = appendScholarOfficialPursuitEntry(state, {
      type: 'exam_attempt',
      attemptNumber: 1,
      startedAt: { year: 4, month: 6, day: 3 },
      completedAt: { year: 4, month: 7, day: 3 },
      ageAtStart: 20,
      knowledgeAtStart: state.player.knowledge,
      rulesVersion: 'curve-a-v1',
      adoptedPassRate: 0.25,
      result: 'passed',
    });
    if (scenario === 'abandoned-appointment') {
      state = appendScholarOfficialPursuitEntry(state, {
        type: 'abandon',
        date: { year: 4, month: 7, day: 3 },
      });
    }
    if (scenario === 'terminal-completed') {
      state = appendScholarOfficialPursuitEntry(state, {
        type: 'appointment_decision',
        opportunityId: 'zhoufu-vacancy-terminal-fixture',
        offeredAt: { year: 4, month: 7, day: 3 },
        decidedAt: { year: 4, month: 7, day: 3 },
        officeId: 'zhoufu_sihu_canjun',
        authorityId: 'court_selection_authority',
        response: 'accepted',
        effectiveAt: { year: 4, month: 7, day: 3 },
      });
    }
    if (scenario !== 'terminal-completed') {
      pendingStoryEventId = SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID;
    }
  }

  if (scenario === 'exam-cooldown' || scenario === 'exam-cooldown-ready') {
    state.currentTime = { year: 4, month: 6, day: 3 };
    state = appendScholarOfficialPursuitEntry(state, {
      type: 'exam_attempt',
      attemptNumber: 1,
      startedAt: { year: 4, month: 5, day: 3 },
      completedAt: { year: 4, month: 6, day: 3 },
      ageAtStart: 20,
      knowledgeAtStart: state.player.knowledge,
      rulesVersion: 'curve-a-v1',
      adoptedPassRate: 0.25,
      result: 'failed',
    });
    state.player.age = 21;
    state.currentTime = scenario === 'exam-cooldown'
      ? { year: 5, month: 5, day: 3 }
      : { year: 5, month: 6, day: 3 };
  }

  if (scenario === 'terminal-unfinished' || scenario === 'terminal-completed') {
    state.player.alive = false;
    state.player.deathReason = '受控终局验收夹具';
  }

  return {
    ...snapshot,
    metadata: { ...snapshot.metadata, updatedAt: Date.now() },
    state: {
      ...state,
      ...(pendingStoryEventId ? { pendingStoryEventId } : {}),
    } as unknown as GameStateSnapshot['state'],
  };
}

async function main(): Promise<void> {
  const [rawScenario, playerName] = process.argv.slice(2);
  const scenarios: FixtureScenario[] = [
    'invitation',
    'active',
    'too-young',
    'low-knowledge',
    'exam-cooldown',
    'exam-cooldown-ready',
    'appointment',
    'abandoned-appointment',
    'terminal-unfinished',
    'terminal-completed',
    'stale-cas',
  ];
  assert(scenarios.includes(rawScenario as FixtureScenario), `Usage: tsx tests/server/prepareScholarOfficialPursuitWebFixture.ts <${scenarios.join('|')}> <player-name>`);
  assert(playerName?.trim(), 'A unique player name created in the Web app is required.');
  const databaseUrl = process.env.DATABASE_URL;
  assert(databaseUrl, 'DATABASE_URL is required.');
  requireIsolatedDatabase(databaseUrl);

  const scenario = rawScenario as FixtureScenario;
  try {
    const result = await withTransaction(databaseUrl, async client => {
      const rows = await client.query<FixtureSlotRow>(
        `SELECT slot.id, slot.slot_index, slot.version, snapshot.id AS current_snapshot_id,
                snapshot.session_id, snapshot.engine_version, snapshot.event_catalog_version,
                snapshot.snapshot
           FROM save_slots AS slot
           JOIN game_snapshots AS snapshot ON snapshot.id = slot.current_snapshot_id
          WHERE snapshot.snapshot #>> '{state,player,name}' = $1
          FOR UPDATE OF slot`,
        [playerName.trim()],
      );
      assert.equal(rows.rowCount, 1, `Expected exactly one saved character named "${playerName.trim()}".`);
      const slot = rows.rows[0]!;
      const preparedSnapshot = prepareScenario(slot.snapshot, scenario);
      const inserted = await snapshotRepo.insertSnapshot(client, {
        saveSlotId: slot.id,
        sessionId: slot.session_id,
        slotVersion: slot.version + 1,
        snapshot: preparedSnapshot,
        engineVersion: slot.engine_version,
        eventCatalogVersion: slot.event_catalog_version,
      });
      const updatedSlot = await saveSlotRepo.updateSlotPointer(
        client,
        slot.id,
        slot.version,
        inserted.id,
      );
      assert.ok(updatedSlot, 'The fixture must advance the selected save slot with CAS.');
      await progressionCheckpointRepo.saveCheckpoint(client, slot.id, inserted.id, {
        protocolVersion: 1,
        state: 'clear',
      });
      return {
        scenario,
        playerName: playerName.trim(),
        slotIndex: slot.slot_index,
        slotVersion: updatedSlot.version,
        snapshotId: inserted.id,
        pendingStoryEventId: preparedSnapshot.state.pendingStoryEventId ?? null,
      };
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await closePool();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
