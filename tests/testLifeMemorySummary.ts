/**
 * Life memory summary regression tests (P3 US-028).
 * Ensures player-facing history categories do not silently disappear in core scenarios.
 */

import { RouteStateManager } from '../src/core/RouteStateManager';
import {
  deriveLifeMemorySummary,
  serializeLifeMemorySummary,
} from '../src/core/deriveLifeMemorySummary';
import type { GameState, PlayerState } from '../src/types/eventTypes';
import {
  LIFE_MEMORY_SCHEMA_VERSION,
  type LifeMemorySummary,
  type LifeMemoryVisibility,
} from '../src/types/lifeMemory';

function createBaseState(overrides: Partial<GameState> = {}): GameState {
  const player: PlayerState = {
    name: '测试侠客',
    gender: 'male',
    age: 20,
    martialPower: 50,
    externalSkill: 40,
    internalSkill: 40,
    qinggong: 30,
    chivalry: 10,
    charisma: 50,
    constitution: 50,
    comprehension: 50,
    knowledge: 20,
    businessAcumen: 10,
    influence: 10,
    connections: 20,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    money: 1000,
    reputation: 30,
    sect: null,
    title: null,
    health: 100,
    energy: 100,
    alive: true,
    items: [],
    flags: {},
    events: [],
    relationships: [],
    children: 0,
    spouse: null,
  };

  return {
    saveVersion: '1.0.0',
    lastSavedAt: Date.now(),
    gameTimestamp: 0,
    player,
    currentTime: { year: 20, month: 1, day: 1 },
    flags: {},
    relations: {},
    eventHistory: [],
    statistics: { totalEvents: 0, totalChoices: 0, totalYears: 0 },
    achievements: [],
    ...overrides,
  };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function filterPlayerVisible<T extends { visibility: LifeMemoryVisibility }>(
  entries?: T[],
): T[] {
  return (entries ?? []).filter((entry) => entry.visibility === 'player');
}

function collectPlayerFacingStrings(summary: LifeMemorySummary): string {
  const parts: string[] = [];
  if (summary.routeStatus) {
    parts.push(
      summary.routeStatus.primary.name,
      summary.routeStatus.primary.phase,
      summary.routeStatus.factionLabel ?? '',
      summary.routeStatus.lastTransition?.label ?? '',
    );
    if (summary.routeStatus.secondary) {
      parts.push(summary.routeStatus.secondary.name, summary.routeStatus.secondary.phase);
    }
  }
  for (const entry of summary.keyChoices ?? []) {
    parts.push(entry.label, entry.consequence ?? '');
  }
  for (const entry of summary.relationships ?? []) {
    parts.push(entry.name, entry.roleLabel, entry.statusLabel);
  }
  for (const entry of summary.unresolvedDebts ?? []) {
    parts.push(entry.label);
  }
  for (const entry of summary.risks ?? []) {
    parts.push(entry.label);
  }
  for (const entry of summary.achievements ?? []) {
    parts.push(entry.label);
  }
  return parts.join('\n');
}

function assertNoRawEventIds(summary: LifeMemorySummary): void {
  const spineIds = [
    'childhood_preference',
    'sect_path_choice',
    'demonic_encounter',
    'hero_first_case',
    'sect_midlife_gray_mission',
  ];
  const playerFacing = collectPlayerFacingStrings(summary);
  for (const eventId of spineIds) {
    assert(
      !playerFacing.includes(eventId),
      `player-facing fields must not contain raw event id: ${eventId}`,
    );
  }
}

/** US-028: all required player-facing categories must be present when state has data. */
function assertCoreScenarioCoverage(summary: LifeMemorySummary): void {
  assert(summary.routeStatus !== undefined, 'route status must not silently disappear');
  assert(
    summary.routeStatus!.primary.name.length > 0,
    'route primary name must be player-facing',
  );
  assert(
    (summary.keyChoices?.length ?? 0) >= 1,
    'key choices must not silently disappear when event history has spine choices',
  );
  assert(
    (summary.relationships?.length ?? 0) >= 1,
    'relationships must not silently disappear when salient relations exist',
  );
  const hasDebt = (summary.unresolvedDebts?.length ?? 0) >= 1;
  const hasRisk = (summary.risks?.length ?? 0) >= 1;
  assert(
    hasDebt || hasRisk,
    'unresolved debt or risk must surface when present in game state',
  );
  assertNoRawEventIds(summary);
}

function createCoreMidlifeOrthodoxState(): GameState {
  let state = createBaseState({
    player: {
      ...createBaseState().player,
      age: 42,
      spouse: '林婉儿',
      health: 30,
      constitution: 45,
      relationships: [
        { id: 'master_wudang', role: 'master', name: '张真人', affinity: 65, status: 'close' },
      ],
    },
    flags: {
      route_orthodox: true,
      join_orthodox: true,
      sect_faction: 'orthodox',
      has_life_debt: true,
      sect_midlife_faction_pressure_done: true,
      sect_midlife_gray_executed: true,
      sect_midlife_judgment_pending: true,
    },
    eventHistory: [
      { eventId: 'childhood_preference', age: 4, selectedChoice: 'focus_on_study' },
      { eventId: 'sect_path_choice', age: 14, selectedChoice: 'join_orthodox' },
      { eventId: 'sect_midlife_gray_mission', age: 38, selectedChoice: 'execute_gray' },
    ],
    routeHistory: [
      { routeId: 'sect', from: 'inactive', to: 'active', age: 14 },
    ],
    achievements: ['save_village'],
  });

  state = RouteStateManager.writeRouteState(state, {
    routeId: 'sect',
    lifecycle: 'locked_in',
    category: 'main',
    lockedIn: true,
  });

  return state;
}

console.log('=== Life Memory Summary Regression Tests (US-028) ===\n');

// Route state in memory summary
{
  let state = createBaseState();
  state = RouteStateManager.writeRouteState(state, {
    routeId: 'sect',
    lifecycle: 'active',
    category: 'main',
    lockedIn: false,
  });
  state.flags = { ...state.flags, route_orthodox: true, sect_faction: 'orthodox' };

  const summary = deriveLifeMemorySummary(state);
  assert(summary.schemaVersion === LIFE_MEMORY_SCHEMA_VERSION, 'schema version should be 1.0.0');
  assert(summary.routeStatus?.primary.name === '正道门派', 'primary route name should be player-facing');
  assert(summary.routeStatus?.factionLabel === '传统门派', 'faction label should be mapped');
  assert(summary.derivedAtAge === 20, 'derivedAtAge should match player age');
  assert(
    summary.routeStatus?.diagnostic.routeStates.sect?.lifecycle === 'active',
    'routeStates diagnostic must reflect written route state',
  );
  assert(
    summary.routeStatus?.diagnostic.activeRouteFlags.includes('route_orthodox'),
    'active route flags must be captured in diagnostic',
  );
  console.log('✓ route state in memory summary');
}

// Key choices
{
  const state = createBaseState({
    flags: { route_orthodox: true, join_orthodox: true },
    eventHistory: [
      {
        eventId: 'sect_path_choice',
        age: 14,
        selectedChoice: 'join_orthodox',
      },
      {
        eventId: 'childhood_preference',
        age: 4,
        selectedChoice: 'focus_on_study',
      },
    ],
  });

  const summary = deriveLifeMemorySummary(state);
  assert((summary.keyChoices?.length ?? 0) >= 1, 'key choices should include recorded spine choices');
  assert(
    summary.keyChoices?.some((entry) => entry.label.includes('正道') || entry.label.includes('向学')),
    'key choice labels should be player-facing',
  );
  assert(
    filterPlayerVisible(summary.keyChoices).length >= 1,
    'key choices must remain player-visible for UI consumption',
  );
  assertNoRawEventIds(summary);
  console.log('✓ key choice in memory summary');
}

// Relationships
{
  const state = createBaseState({
    player: {
      ...createBaseState().player,
      spouse: '林婉儿',
      relationships: [
        { id: 'master_wudang', role: 'master', name: '张真人', affinity: 65, status: 'close' },
      ],
    },
  });

  const summary = deriveLifeMemorySummary(state);
  assert((summary.relationships?.length ?? 0) >= 2, 'relationships should include spouse and master');
  assert(
    summary.relationships?.some((entry) => entry.roleLabel === '师长'),
    'relationship role labels should be mapped',
  );
  assert(
    filterPlayerVisible(summary.relationships).length >= 1,
    'relationships must remain player-visible for UI consumption',
  );
  console.log('✓ relationship in memory summary');
}

// Unresolved debt when present
{
  const state = createBaseState({
    flags: { has_life_debt: true },
  });

  const summary = deriveLifeMemorySummary(state);
  assert(
    summary.unresolvedDebts?.some((entry) => entry.label.includes('救命')),
    'unresolved debts should surface life debt',
  );
  assert(
    filterPlayerVisible(summary.unresolvedDebts).length >= 1,
    'debts must remain player-visible for UI consumption',
  );
  console.log('✓ unresolved debt when present');
}

// Unresolved risk when present
{
  const state = createBaseState({
    player: {
      ...createBaseState().player,
      health: 25,
      constitution: 35,
      lifeStates: { anxiety: 80, fatigue: 0 },
    },
  });

  const summary = deriveLifeMemorySummary(state);
  assert((summary.risks?.length ?? 0) >= 1, 'risks should include low health signal');
  assert(
    summary.risks?.some((entry) => entry.warningLevel === 'L0'),
    'risk entries should include L0 warning level',
  );
  assert(
    filterPlayerVisible(summary.risks).length >= 1,
    'risks must remain player-visible for UI consumption',
  );
  console.log('✓ unresolved risk when present');
}

// Achievements
{
  const state = createBaseState({
    achievements: ['save_village'],
    flags: { sect_midlife_outcome: 'upright_guardian' },
  });

  const summary = deriveLifeMemorySummary(state);
  assert(
    summary.achievements?.some((entry) => entry.label.includes('守正')),
    'achievements should map midlife outcome labels',
  );
  assert(
    summary.achievements?.some((entry) => entry.label === '拯救村庄'),
    'achievements should map generic achievement ids',
  );
  console.log('✓ achievements derivation');
}

// Serializability
{
  const state = createBaseState({
    flags: { route_wanderer: true, has_life_debt: true },
    eventHistory: [{ eventId: 'sect_path_choice', age: 14, selectedChoice: 'stay_wanderer' }],
  });
  const summary = deriveLifeMemorySummary(state);
  const roundTrip = serializeLifeMemorySummary(summary);
  assert(JSON.stringify(roundTrip) === JSON.stringify(summary), 'summary should round-trip via JSON');
  console.log('✓ serializability');
}

// Core midlife scenario regression — all categories present together
{
  const state = createCoreMidlifeOrthodoxState();
  const summary = deriveLifeMemorySummary(state);

  assertCoreScenarioCoverage(summary);

  assert(
    summary.routeStatus?.primary.phase === '已承诺',
    'locked-in route phase should be player-facing',
  );
  assert(
    summary.routeStatus?.lastTransition !== undefined,
    'route transition history must not silently disappear',
  );
  assert(
    summary.unresolvedDebts?.some((entry) => entry.label.includes('师门')),
    'midlife sect debt should surface in core scenario',
  );
  assert(
    summary.risks?.some((entry) => entry.warningLevel === 'L1'),
    'midlife judgment pending should surface as L1 risk',
  );

  const playerVisibleChoices = filterPlayerVisible(summary.keyChoices);
  const playerVisibleRelationships = filterPlayerVisible(summary.relationships);
  assert(playerVisibleChoices.length >= 2, 'core scenario should expose multiple key choices to UI');
  assert(playerVisibleRelationships.length >= 2, 'core scenario should expose multiple relationships to UI');

  console.log('✓ core midlife scenario regression (all categories)');
}

// Idempotent derivation — repeated derive must not drop categories
{
  const state = createCoreMidlifeOrthodoxState();
  const first = deriveLifeMemorySummary(state);
  const second = deriveLifeMemorySummary(state);
  assert(
    JSON.stringify(first) === JSON.stringify(second),
    'repeated derivation must be stable and not drop history',
  );
  console.log('✓ idempotent derivation regression');
}

console.log('\n✅ All life memory summary regression tests passed');
