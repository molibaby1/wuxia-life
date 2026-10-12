import assert from 'node:assert/strict';
import { mapSessionProgression } from '../../server/src/services/sessionProgressionMapper';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { defaultSnapshotConverter } from '../../src/headless/snapshot/SnapshotConverter';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog';
import {
  EventCategory,
  EventPriority,
  EffectType,
  type EventChoice,
  type EventDefinition,
} from '../../src/types/eventTypes';
import { ITEM_DEFINITIONS, type ItemId } from '../../src/types/item';
import { buildChoiceFeedbackOverlayCard } from '../../src/types/progressionOverlay';
import { buildMainScreenModel } from '../../src/components/mainScreenModel';
import { createDefaultTimeSource } from '../../src/headless/adapters/timeSource';

const catalogVersion = 'sl-gap-11-test-only';
const time = createDefaultTimeSource();

function makeEvent(
  id: string,
  title: string,
  choice: EventChoice,
): EventDefinition {
  return {
    id,
    version: '1.0.0',
    category: EventCategory.SIDE_QUEST,
    priority: EventPriority.NORMAL,
    weight: 100,
    ageRange: { min: 1, max: 100 },
    triggers: [],
    storyLine: 'sl_gap_11_test_only',
    content: { title, text: `受控验证事件：${title}` },
    eventType: 'choice',
    choices: [choice],
  };
}

function makeDomainEvents(itemId: ItemId, domain: string): EventDefinition[] {
  return [
    makeEvent(`sl_gap_11_${domain}_acquire`, `${domain}物品取得（测试）`, {
      id: `take_${domain}_item`,
      text: '接过物品',
      condition: { type: 'item_not_owned', item: itemId },
      effects: [{ type: EffectType.ITEM_ADD, item: itemId }],
    }),
    makeEvent(`sl_gap_11_${domain}_followup`, `${domain}物品后续（测试）`, {
      id: `use_${domain}_item`,
      text: '处理这件物品',
      condition: { type: 'item_owned', item: itemId },
      effects: [{ type: EffectType.ITEM_REMOVE, item: itemId }],
    }),
  ];
}

const testEvents = [
  ...makeDomainEvents(ITEM_DEFINITIONS[0]!.id, 'martial'),
  ...makeDomainEvents(ITEM_DEFINITIONS[1]!.id, 'family'),
  makeEvent('sl_gap_11_invalid_item', '非法物品 ID（测试）', {
    id: 'attempt_invalid_item',
    text: '尝试取得',
    effects: [{
      type: EffectType.ITEM_ADD,
      item: 'unregistered_item',
    } as unknown as EventChoice['effects'][number]],
  }),
];

const runtimeCatalog: RuntimeEventCatalog = {
  getAllEvents: () => testEvents,
  getEventsByAge: age => testEvents.filter(event =>
    age >= event.ageRange.min && (event.ageRange.max === undefined || age <= event.ageRange.max),
  ),
  getEventById: id => testEvents.find(event => event.id === id),
  getWeightForAge: event => event.weight,
};

function makeSnapshot(
  state: ReturnType<HeadlessEngineSessionImpl['getRuntimeState']>,
  pendingEventId: string,
) {
  return defaultSnapshotConverter.toSnapshot(
    { ...state, pendingStoryEventId: pendingEventId },
    {
      eventCatalogVersion: catalogVersion,
      sourcePlatform: 'node-headless',
      time,
    },
  );
}

function makeSession(snapshot: ReturnType<typeof makeSnapshot>): HeadlessEngineSessionImpl {
  return HeadlessEngineSessionImpl.create({ snapshot }, { runtimeCatalog });
}

async function execute(session: HeadlessEngineSessionImpl, eventId: string, choiceId: string) {
  return session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: session.serialize() },
    action: { eventId, choiceId },
  });
}

async function verifyDomain(itemId: ItemId, domain: string): Promise<void> {
  const acquireEventId = `sl_gap_11_${domain}_acquire`;
  const followupEventId = `sl_gap_11_${domain}_followup`;
  const initial = HeadlessEngineSessionImpl.create({
    playerName: `测试侠客-${domain}`,
    gender: 'male',
    randomSeed: 101,
    catalogVersion,
  }, { runtimeCatalog });

  const acquireSession = makeSession(makeSnapshot(initial.getRuntimeState(), acquireEventId));
  const acquireEvent = await acquireSession.getNextEvent();
  assert.equal(acquireEvent?.eventId, acquireEventId);
  assert.equal(acquireEvent?.event.choices?.[0]?.available, true);
  const acquireResponse = await execute(
    acquireSession,
    acquireEventId,
    `take_${domain}_item`,
  );
  assert.equal(acquireResponse.status, 'success');
  assert.deepEqual(acquireResponse.feedback.player.itemChanges, [{
    itemId,
    displayName: ITEM_DEFINITIONS.find(item => item.id === itemId)!.displayName,
    change: 'acquired',
  }]);
  assert.equal(acquireResponse.feedback.player.narrativeResult, null);
  assert.equal(acquireResponse.nextSnapshot.state.eventHistory.some(
    entry => entry.eventId === acquireEventId,
  ), true, 'successful acquisition records the actual event');

  const card = buildChoiceFeedbackOverlayCard(
    `choice-${acquireEventId}`,
    acquireEvent!.event.title,
    '接过物品',
    acquireResponse.feedback,
  );
  assert.equal(card?.body, undefined, 'Item feedback must not become narrativeResult');
  assert.deepEqual(card?.metaLines, ['选择：接过物品', `获得物品：${ITEM_DEFINITIONS.find(item => item.id === itemId)!.displayName}`]);

  const progression = mapSessionProgression(
    acquireSession,
    1,
    `snapshot-${domain}`,
    null,
    acquireSession.getLifeMemory(),
  );
  assert.deepEqual(progression.player.ownedItems, [{
    id: itemId,
    displayName: ITEM_DEFINITIONS.find(item => item.id === itemId)!.displayName,
  }]);
  const screenModel = buildMainScreenModel(progression.player, acquireSession.getLifeMemory());
  assert.equal(screenModel.itemSummary, ITEM_DEFINITIONS.find(item => item.id === itemId)!.displayName);
  assert.deepEqual(progression.player.ownedAssets, [], 'Item must stay separate from ownedAssets');

  const followupSnapshot = acquireResponse.nextSnapshot;
  followupSnapshot.state.pendingStoryEventId = followupEventId;
  const followupSession = makeSession(followupSnapshot);
  const followupEvent = await followupSession.getNextEvent();
  assert.equal(followupEvent?.eventId, followupEventId);
  assert.equal(followupEvent?.event.choices?.[0]?.available, true, 'ownership enables the later Item condition');
  const removeResponse = await execute(
    followupSession,
    followupEventId,
    `use_${domain}_item`,
  );
  assert.equal(removeResponse.status, 'success');
  assert.deepEqual(removeResponse.feedback.player.itemChanges, [{
    itemId,
    displayName: ITEM_DEFINITIONS.find(item => item.id === itemId)!.displayName,
    change: 'lost',
  }]);
  assert.equal(removeResponse.feedback.player.narrativeResult, null);
  assert.equal(removeResponse.nextSnapshot.state.eventHistory.some(
    entry => entry.eventId === followupEventId,
  ), true, 'successful removal records the actual event');

  const unavailableSnapshot = removeResponse.nextSnapshot;
  unavailableSnapshot.state.pendingStoryEventId = followupEventId;
  const unavailableSession = makeSession(unavailableSnapshot);
  const unavailableEvent = await unavailableSession.getNextEvent();
  assert.equal(unavailableEvent?.event.choices?.[0]?.available, false, 'loss disables the later Item condition');
  assert.deepEqual(unavailableSession.getRuntimeState().inventory, []);
}

export async function runSharedItemVerticalTests(): Promise<void> {
  await verifyDomain(ITEM_DEFINITIONS[0]!.id, 'martial');
  await verifyDomain(ITEM_DEFINITIONS[1]!.id, 'family');

  const invalidStart = HeadlessEngineSessionImpl.create({
    playerName: '非法物品验证',
    gender: 'female',
    randomSeed: 202,
    catalogVersion,
  }, { runtimeCatalog });
  const invalidSession = makeSession(
    makeSnapshot(invalidStart.getRuntimeState(), 'sl_gap_11_invalid_item'),
  );
  const before = invalidSession.getRuntimeState();
  await assert.rejects(
    execute(invalidSession, 'sl_gap_11_invalid_item', 'attempt_invalid_item'),
    /Invalid Item effect value/,
  );
  assert.deepEqual(invalidSession.getRuntimeState().inventory, before.inventory);
  assert.equal(invalidSession.getRuntimeState().eventHistory.some(
    entry => entry.eventId === 'sl_gap_11_invalid_item',
  ), false, 'invalid Item effects must not record successful event history');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSharedItemVerticalTests().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
