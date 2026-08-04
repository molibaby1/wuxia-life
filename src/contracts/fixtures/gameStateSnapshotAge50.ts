/**
 * Representative 0–50 game state snapshot fixture (P4 US-005).
 *
 * JSON-serializable contract sample for route state, relationships, event/choice
 * history, save metadata, and life-memory derivation inputs. No runtime loader.
 *
 * @see docs/contracts/game-state-snapshot-contract.md
 */

import { LIFE_MEMORY_SCHEMA_VERSION } from '../../types/lifeMemory';
import { EffectType } from '../../types/eventTypes';
import { createDefaultPlayerLifeStates } from '../../data/life/lifeStates';
import {
  GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
  type GameStateSnapshot,
} from '../gameStateSnapshot';

/** Fixed Unix ms timestamps for deterministic fixture content (no local paths). */
const FIXTURE_CREATED_AT = 1717200000000;
const FIXTURE_UPDATED_AT = 1717203600000;
const FIXTURE_GAME_TIMESTAMP = 1717203600123;

/**
 * Valid midlife snapshot at player age 50 — spans origin through achievement phase.
 * Satisfies `GameStateSnapshot`; round-trips via JSON.stringify/parse.
 */
export const gameStateSnapshotAge50 = {
  metadata: {
    schemaVersion: GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
    engineVersion: '0.0.0',
    eventCatalogVersion: '1.0.0',
    createdAt: FIXTURE_CREATED_AT,
    updatedAt: FIXTURE_UPDATED_AT,
    sourcePlatform: 'web-browser',
    snapshotId: 'fixture_age50_1717203600000',
    lifeMemorySchemaVersion: LIFE_MEMORY_SCHEMA_VERSION,
  },
  state: {
    saveVersion: '2.0.0-p2',
    lastSavedAt: FIXTURE_UPDATED_AT,
    gameTimestamp: FIXTURE_GAME_TIMESTAMP,
    currentTime: { year: 50, month: 3, day: 15 },
    facts: {},
    player: {
      name: '沈无名',
      age: 50,
      gender: 'male',
      alive: true,
      martialPower: 78,
      chivalry: 85,
      constitution: 70,
      comprehension: 55,
      affiliation: 'wudang',
      title: '武当长老',
      reputation: 420,
      money: 3200,
      knowledge: 48,
      charisma: 62,
      businessAcumen: 25,
      influence: 180,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      investments: {
        martial: 1.5,
        statecraft: 3,
        official: 0,
        hermit: 8.25,
      },
      connections: 95,
      spouse: '林婉儿',
      children: 2,
      timeUnit: 'month',
      monthProgress: 3,
      traits: ['heroic_heart', 'grand_dreams_poor_followthrough', 'disciplined'],
      healthStatus: 'healthy',
      statuses: [],
      lifeStates: createDefaultPlayerLifeStates({
        trainingHabit: 4,
        studyHabit: 3,
        businessHabit: 2,
      }),
      flags: {},
      relationships: [
        {
          id: 'spouse_lin',
          role: 'lover',
          name: '林婉儿',
          affinity: 88,
          status: 'married',
        },
        {
          id: 'master_wudang',
          role: 'master',
          name: '清虚道长',
          affinity: 72,
          status: 'active',
        },
        {
          id: 'rival_mo',
          role: 'rival',
          name: '莫无忌',
          affinity: -45,
          status: 'sworn_enemy',
        },
        {
          id: 'friend_xiao',
          role: 'friend',
          name: '萧峰',
          affinity: 65,
        },
        {
          id: 'disciple_chen',
          role: 'family',
          name: '陈小宝',
          affinity: 58,
          status: 'disciple',
        },
      ],
    },
    flags: {
      route_hero_active: true,
      route_hero_locked_in: true,
      route_merchant_completed: false,
      married: true,
      wudang_member: true,
      golden_line_payoff_seen: true,
      debt_honor_master: true,
      risk_internal_injury: false,
      achievement_sword_master: true,
    },
    relations: {
      spouse_lin: 88,
      master_wudang: 72,
      rival_mo: -45,
      friend_xiao: 65,
      disciple_chen: 58,
      patron_emperor: 40,
    },
    eventHistory: [
      {
        eventId: 'origin_martial_family_01',
        age: 0,
        timestamp: { year: 0, month: 1, day: 1 },
        selectedChoice: 'accept_heritage',
        appliedEffects: [
          {
            type: EffectType.FLAG_SET,
            flag: 'martial_family_origin',
            target: 'player',
            value: true,
          },
        ],
      },
      {
        eventId: 'childhood_training_01',
        age: 8,
        timestamp: { year: 8, month: 6, day: 1 },
        selectedChoice: 'train_diligently',
        appliedEffects: [
          {
            type: EffectType.STAT_MODIFY,
            stat: 'martialPower',
            target: 'player',
            value: 5,
            operator: 'add',
          },
        ],
      },
      {
        eventId: 'youth_sect_choice_01',
        age: 16,
        timestamp: { year: 16, month: 3, day: 10 },
        selectedChoice: 'join_wudang',
        appliedEffects: [
          {
            type: EffectType.SET_FACTION,
            target: 'lifePath',
            value: 'orthodox',
          },
          {
            type: EffectType.FLAG_SET,
            flag: 'wudang_member',
            target: 'player',
            value: true,
          },
        ],
      },
      {
        eventId: 'hero_origin_01',
        age: 28,
        timestamp: { year: 28, month: 6, day: 1 },
        selectedChoice: 'accept_hero_path',
        appliedEffects: [
          {
            type: EffectType.FLAG_SET,
            flag: 'route_hero_active',
            target: 'player',
            value: true,
          },
        ],
      },
      {
        eventId: 'marriage_lin_waner_01',
        age: 32,
        timestamp: { year: 32, month: 9, day: 20 },
        selectedChoice: 'marry_for_love',
        appliedEffects: [
          {
            type: EffectType.FLAG_SET,
            flag: 'married',
            target: 'player',
            value: true,
          },
          {
            type: EffectType.RELATION_CHANGE,
            target: 'spouse_lin',
            value: 75,
            operator: 'set',
          },
        ],
      },
      {
        eventId: 'midlife_sect_leader_fork_01',
        age: 42,
        timestamp: { year: 42, month: 1, day: 5 },
        selectedChoice: 'remain_elder_not_leader',
        stateSnapshot: {
          player: {
            name: '沈无名',
            age: 42,
            gender: 'male',
            alive: true,
            reputation: 320,
            investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
            traits: [],
            healthStatus: 'healthy',
            statuses: [],
            lifeStates: createDefaultPlayerLifeStates(),
          },
          flags: { route_hero_locked_in: true },
        },
      },
      {
        eventId: 'achievement_sword_tournament_01',
        age: 48,
        timestamp: { year: 48, month: 11, day: 8 },
        selectedChoice: 'win_honorably',
        appliedEffects: [
          {
            type: EffectType.LIFEPATH_RECORD_ACHIEVEMENT,
            target: 'lifePath',
            value: 'achievement_sword_master',
          },
        ],
      },
      {
        eventId: 'age50_reflection_01',
        age: 50,
        timestamp: { year: 50, month: 3, day: 15 },
        selectedChoice: 'reflect_on_legacy',
        gameTime: FIXTURE_GAME_TIMESTAMP,
        realTime: FIXTURE_UPDATED_AT,
      },
    ],
    lifePath: {
      faction: 'orthodox',
      lifeStage: 'achievement',
      achievements: ['achievement_sword_master', 'wudang_elder_title'],
      relationships: {
        allies: ['friend_xiao', 'master_wudang'],
        enemies: ['rival_mo'],
        mentors: ['master_wudang'],
        disciples: ['disciple_chen'],
      },
      commitments: {
        cannotJoin: ['unconventional_shadow_sect'],
        mustProtect: ['spouse_lin', 'disciple_chen'],
        swornEnemies: ['rival_mo'],
      },
    },
    karma: {
      good_karma: 120,
      evil_karma: 15,
      history: [
        {
          amount: 20,
          reason: 'rescued_villagers_from_bandits',
          timestamp: 30,
        },
        {
          amount: -5,
          reason: 'harsh_punishment_of_thief',
          timestamp: 38,
        },
        {
          amount: 15,
          reason: 'donated_to_temple',
          timestamp: 46,
        },
      ],
    },
    criticalChoices: {
      sect_choice: 'orthodox',
      life_goal: 'hero',
      marriage_choice: 'love',
      midlife_choice: 'sect_leader',
      war_choice: 'traditional',
    },
    achievements: ['achievement_sword_master', 'wudang_elder_title', 'golden_line_payoff_seen'],
    inventory: [
      { id: 'item_jade_pendant', name: '家传玉佩', quantity: 1 },
      { id: 'item_healing_pill', name: '疗伤丹', quantity: 3 },
      { id: 'item_silver', name: '银两', quantity: 3200 },
    ],
    actionHistory: [],
    actionFocusStreak: { category: null, count: 0 },
  },
} satisfies GameStateSnapshot;

/** JSON round-trip helper for contract tests (US-006). */
export function serializeGameStateSnapshotAge50Fixture(): string {
  return JSON.stringify(gameStateSnapshotAge50);
}
