import assert from 'node:assert/strict';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { GameEngineIntegration } from '../../src/core/GameEngineIntegration';
import {
  appendScholarOfficialPursuitEntry,
  SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY,
} from '../../src/core/scholarOfficialPursuit';
import { InMemoryEventCatalogAdapter } from '../../src/headless/catalog/InMemoryEventCatalogAdapter';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog';
import { EffectType, EventCategory, EventPriority, type EventDefinition } from '../../src/types/eventTypes';

const EVENT_ID = 'test_unrelated_flag_after_scholar_ledger_restore';
const CHOICE_ID = 'set_unrelated_flag';

function createTestEvent(): EventDefinition {
  return {
    id: EVENT_ID,
    version: '1.0.0',
    category: EventCategory.RANDOM_ENCOUNTER,
    priority: EventPriority.NORMAL,
    weight: 1,
    ageRange: { min: 0 },
    triggers: [{ type: 'age_reach', value: 0 }],
    content: { title: 'Persistence check', text: 'Continue.' },
    eventType: 'choice',
    choices: [{
      id: CHOICE_ID,
      text: 'Continue',
      effects: [
        { type: EffectType.FLAG_SET, flag: 'unrelated_after_restore', value: true },
        { type: EffectType.FLAG_UNSET, flag: 'unrelated_remove_after_restore' },
      ],
    }],
    metadata: { createdAt: 0, updatedAt: 0, enabled: true },
  };
}

function makeCatalog(event: EventDefinition): RuntimeEventCatalog {
  return {
    getAllEvents: () => [event],
    getEventsByAge: () => [event],
    getEventById: id => id === event.id ? event : undefined,
    getWeightForAge: () => 1,
  };
}

export async function runScholarOfficialPursuitHeadlessPersistenceTests(): Promise<void> {
  const state = new GameEngineIntegration().getGameState();
  state.currentTime = { year: 1, month: 1, day: 1 };
  state.player.age = 18;
  state.player.flags.unrelated_remove_after_restore = true;
  const withLedger = appendScholarOfficialPursuitEntry(state, {
    type: 'invitation_response',
    date: { year: 1, month: 1, day: 1 },
    age: 18,
    sourceEventId: 'p138_scholar_official_invitation',
    response: 'accepted',
  });
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: 'Headless ledger persistence',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 31,
  });
  const snapshot = bootstrap.dependencies.snapshot.toSnapshot(withLedger, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: bootstrap.dependencies.time,
  });
  snapshot.state.pendingStoryEventId = EVENT_ID;

  const event = createTestEvent();
  const runtimeCatalog = makeCatalog(event);
  const session = HeadlessEngineSessionImpl.create(
    { snapshot },
    {
      runtimeCatalog,
      catalog: new InMemoryEventCatalogAdapter(runtimeCatalog),
    },
  );
  assert.equal(session.getCurrentEvent()?.id, EVENT_ID, 'headless restore must reattach the pending test event');

  const response = await session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: session.serialize() },
    action: { eventId: EVENT_ID, choiceId: CHOICE_ID },
  });
  assert.equal(response.status, 'success');
  assert.equal(response.nextSnapshot.state.flags.unrelated_after_restore, true);
  assert.equal(Object.hasOwn(response.nextSnapshot.state.flags, 'unrelated_remove_after_restore'), false);
  assert.deepEqual(
    response.nextSnapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY],
    response.nextSnapshot.state.player.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY],
    'ordinary Headless flag effects must preserve the authoritative ledger mirror',
  );
  assert.equal(
    (response.nextSnapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as { entries: unknown[] }).entries.length,
    1,
  );
  assert.equal(session.getRuntimeState().flags.unrelated_after_restore, true);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runScholarOfficialPursuitHeadlessPersistenceTests();
  console.log('scholarOfficialPursuitPersistence headless test: ok');
}
