/**
 * 0–50 replay log fixture (P4 US-012).
 *
 * Includes multiple choice entries and route/relationship changes.
 */

import { REPLAY_LOG_VERSION, type ReplayLog } from '../replayLog';

const CREATED_AT = 1717200000000;

export const replayLogAge50: ReplayLog = {
  metadata: {
    replayVersion: REPLAY_LOG_VERSION,
    engineVersion: '0.0.0',
    eventCatalogVersion: '1.0.0',
    initialSeed: 'golden-line-seed-001',
    startSnapshotHash: 'sha256:replay_start_age0',
    platform: 'node-headless',
    createdAt: CREATED_AT,
    lifeId: 'fixture_life_age50',
  },
  entries: [
    {
      sequence: 1,
      actionType: 'choice',
      age: 0,
      timestamp: { year: 0, month: 1, day: 1 },
      eventId: 'origin_martial_family_01',
      choiceId: 'accept_heritage',
      snapshotHashBefore: 'sha256:replay_start_age0',
      snapshotHashAfter: 'sha256:replay_after_origin',
      randomDrawIndex: 1,
    },
    {
      sequence: 2,
      actionType: 'choice',
      age: 16,
      timestamp: { year: 16, month: 3, day: 10 },
      eventId: 'youth_sect_choice_01',
      choiceId: 'join_wudang',
      outcomeId: 'orthodox_path',
      snapshotHashBefore: 'sha256:replay_after_origin',
      snapshotHashAfter: 'sha256:replay_after_sect_choice',
      randomDrawIndex: 2,
    },
    {
      sequence: 3,
      actionType: 'auto_event',
      age: 18,
      timestamp: { year: 18, month: 6, day: 1 },
      eventId: 'route_merchant_declined_01',
      snapshotHashBefore: 'sha256:replay_after_sect_choice',
      snapshotHashAfter: 'sha256:replay_after_merchant_decline',
    },
    {
      sequence: 4,
      actionType: 'choice',
      age: 28,
      timestamp: { year: 28, month: 6, day: 1 },
      eventId: 'hero_origin_01',
      choiceId: 'accept_hero_path',
      snapshotHashBefore: 'sha256:replay_after_merchant_decline',
      snapshotHashAfter: 'sha256:replay_after_hero_route',
      randomDrawIndex: 3,
    },
    {
      sequence: 5,
      actionType: 'choice',
      age: 32,
      timestamp: { year: 32, month: 9, day: 20 },
      eventId: 'marriage_lin_waner_01',
      choiceId: 'marry_for_love',
      snapshotHashBefore: 'sha256:replay_after_hero_route',
      snapshotHashAfter: 'sha256:replay_after_marriage',
      randomDrawIndex: 4,
    },
    {
      sequence: 6,
      actionType: 'save_load',
      age: 42,
      timestamp: { year: 42, month: 1, day: 5 },
      saveSlotId: 'slot_1',
      saveLabel: 'midlife_checkpoint',
      snapshotHashBefore: 'sha256:replay_after_marriage',
      snapshotHashAfter: 'sha256:replay_after_marriage',
    },
    {
      sequence: 7,
      actionType: 'choice',
      age: 50,
      timestamp: { year: 50, month: 3, day: 15 },
      eventId: 'age50_reflection_01',
      choiceId: 'reflect_on_legacy',
      snapshotHashBefore: 'sha256:replay_after_marriage',
      snapshotHashAfter: 'sha256:replay_after_reflection',
      randomDrawIndex: 5,
    },
    {
      sequence: 8,
      actionType: 'terminal',
      age: 50,
      timestamp: { year: 50, month: 3, day: 16 },
      terminalReason: 'manual_stop',
      eventId: 'age50_reflection_01',
      snapshotHashBefore: 'sha256:replay_after_reflection',
      snapshotHashAfter: 'sha256:replay_after_reflection',
    },
  ],
};

export function serializeReplayLogAge50Fixture(): string {
  return JSON.stringify(replayLogAge50);
}
