/**
 * Life memory summary regression tests (P3 US-028).
 * Ensures player-facing history categories do not silently disappear in core scenarios.
 */

import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
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
    chivalry: 10,
    charisma: 50,
    constitution: 50,
    knowledge: 20,
    businessAcumen: 10,
    influence: 10,
    connections: 20,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    wealthCapacity: 'no_surplus',
    reputation: 30,
    affiliation: null,
    title: null,
    healthStatus: 'healthy',
    statuses: [],
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
  if (summary.currentGoalLabel) parts.push(summary.currentGoalLabel);
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
  for (const entry of summary.habitTrajectory ?? []) {
    parts.push(entry.label, entry.tierLabel);
  }
  return parts.join('\n');
}

function assertNoRawEventIds(summary: LifeMemorySummary): void {
  const spineIds = [
    'childhood_preference',
    'sect_choice',
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
      healthStatus: 'seriously_injured',
      constitution: 45,
      relationships: [
        { id: 'master_wudang', role: 'master', name: '张真人', affinity: 65, status: 'close' },
      ],
    },
    flags: {
      route_orthodox: true,
      join_orthodox: true,
      sect_faction: 'orthodox',
      sect_midlife_faction_pressure_done: true,
      sect_midlife_gray_executed: true,
      sect_midlife_judgment_pending: true,
    },
    eventHistory: [
      { eventId: 'childhood_preference', age: 4, selectedChoice: 'focus_on_study' },
      { eventId: 'sect_choice', age: 14, selectedChoice: 'join_shaolin' },
      { eventId: 'sect_midlife_gray_mission', age: 38, selectedChoice: 'execute_gray' },
    ],
    achievements: ['save_village'],
  });

  return state;
}

console.log('=== Life Memory Summary Regression Tests (US-028) ===\n');

// Route flags remain content inputs, while lifecycle containers are absent.
{
  let state = createBaseState();
  state.flags = { ...state.flags, route_orthodox: true, sect_faction: 'orthodox', orthodox_childhood_seed_done: true };

  const summary = deriveLifeMemorySummary(state);
  assert(summary.schemaVersion === LIFE_MEMORY_SCHEMA_VERSION, 'schema version should match the Life Memory contract');
  assert(!('routeStatus' in summary), 'route status must not be canonical Life Memory');
  assert(summary.currentGoalLabel === '门派倾向已显，尚未立誓入门', 'current goal should come from explicit origin facts');
  assert(summary.derivedAtAge === 20, 'derivedAtAge should match player age');
  console.log('✓ route flags stay outside lifecycle presentation');
}

// Key choices
{
  const state = createBaseState({
    flags: { route_orthodox: true, join_orthodox: true },
    eventHistory: [
      {
        eventId: 'sect_choice',
        age: 14,
        selectedChoice: 'join_shaolin',
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
    summary.keyChoices?.some((entry) => entry.label.includes('申请拜入少林') || entry.label.includes('向学')),
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

// Parenthood is a fact entry, not a synthetic relationship-quality signal.
{
  const state = createBaseState({
    player: {
      ...createBaseState().player,
      children: 2,
    },
  });

  const summary = deriveLifeMemorySummary(state);
  const childEntry = summary.relationships?.find(
    (entry) => entry.diagnostic.relationId === 'children',
  );
  assert(childEntry !== undefined, 'children fact entry should exist when children > 0');
  assert(childEntry!.name === '2位子嗣', 'children entry should keep the fact count in its name');
  assert(childEntry!.roleLabel === '子嗣', 'children entry role should be factual');
  assert(childEntry!.statusLabel === '有子女', 'children entry status should be factual');
  assert(!('affinityBand' in childEntry!), 'children entry must not expose affinityBand');
  assert(!('affinity' in childEntry!.diagnostic), 'children diagnostic must not expose affinity');
  console.log('✓ children remain a fact-only relationship entry');
}

// A life favor owed to the player is not player debt.
{
  const state = createBaseState({
    flags: { life_debt_owed_to_player: true },
  });

  const summary = deriveLifeMemorySummary(state);
  assert(
    !summary.unresolvedDebts?.some((entry) => entry.label.includes('救命')),
    'a life favor owed to the player must not surface as player debt',
  );
  assert(
    filterPlayerVisible(summary.unresolvedDebts).every(entry => !entry.label.includes('救命')),
    'Life Memory must not present the favor as player-visible debt',
  );
  console.log('✓ life favor direction is excluded from unresolved debt');
}

// Unresolved risk when present
{
  const state = createBaseState({
    player: {
      ...createBaseState().player,
      healthStatus: 'seriously_ill',
      constitution: 35,
      lifeStates: createDefaultPlayerLifeStates(),
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

// Canonical stable health must not create the severe health risk entry.
{
  const state = createBaseState({
    player: {
      ...createBaseState().player,
      constitution: 90,
      healthStatus: 'unwell',
    },
  });
  const summary = deriveLifeMemorySummary(state);
  assert(!summary.risks?.some((entry) => entry.id === 'risk-health'), 'healthy/unwell must not create severe health risk');
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

// P41 habit trajectory recap
{
  const state = createBaseState({
    player: {
      ...createBaseState().player,
      lifeStates: {
        trainingHabit: 4,
        studyHabit: 2,
        businessHabit: 0,
      },
    },
  });
  const summary = deriveLifeMemorySummary(state);
  const visible = filterPlayerVisible(summary.habitTrajectory);
  assert(visible.length === 2, 'habit trajectory should include only practice axes');
  assert(visible[0]?.label === '练功实践', 'dominant training practice should rank first');
  assert(visible.some((entry) => entry.label === '读书实践'), 'study practice should surface');
  assertNoRawEventIds(summary);
  const playerFacing = collectPlayerFacingStrings(summary);
  assert(!playerFacing.includes('trainingHabit'), 'habit trajectory must not expose raw state keys');
  console.log('✓ habit trajectory recap');
}

// Serializability
{
  const state = createBaseState({
    flags: { route_wanderer: true, life_debt_owed_to_player: true },
    eventHistory: [{ eventId: 'sect_choice', age: 14, selectedChoice: 'stay_home' }],
  });
  const summary = deriveLifeMemorySummary(state);
  const roundTrip = serializeLifeMemorySummary(summary);
  assert(JSON.stringify(roundTrip) === JSON.stringify(summary), 'summary should round-trip via JSON');
  console.log('✓ serializability');
}

// Life Milestone projection remains separate from formal achievements.
{
  const state = createBaseState({
    player: {
      ...createBaseState().player,
      lifeStates: { trainingHabit: 0, studyHabit: 2, businessHabit: 0 },
    },
    actionHistory: [{
      actionId: 'study-1', category: 'study', age: 18, sourceKind: 'active_action',
      duration: { value: 1, unit: 'year' }, deltas: {}, timestamp: { year: 18, month: 1, day: 1 },
    }],
  });
  const summary = deriveLifeMemorySummary(state);
  assert(summary.schemaVersion === '3.1.0', 'Life Memory schema should advance to 3.1.0');
  assert(summary.achievedMilestones?.some((entry) => entry.label === '初涉书卷'));
  assert(summary.achievedMilestones?.some((entry) => entry.label === '读书成习'));
  assert(summary.milestoneProspects?.[0]?.label === '少年勤学');
  assert(!summary.achievements?.some((entry) => entry.label === '初涉书卷'), 'milestones must not enter achievements');
  assert(JSON.stringify(serializeLifeMemorySummary(summary)) === JSON.stringify(summary));
  console.log('✓ derives serializable milestones independently from achievements');
}

// Life Memory keeps the complete achieved Milestone projection; display limits belong to the Main Screen.
{
  const state = createBaseState({
    player: {
      ...createBaseState().player,
      lifeStates: { trainingHabit: 4, studyHabit: 2, businessHabit: 2 },
    },
    eventHistory: [
      { eventId: 'setback_cultivation_deviation', age: 21 },
      { eventId: 'p26_study_habit_midlife_callback', age: 26 },
      { eventId: 'p42_training_habit_scholar_body_echo', age: 22 },
      { eventId: 'p42_business_habit_youth_stall', age: 18 },
    ],
    actionHistory: [
      {
        actionId: 'study-1', category: 'study', age: 18, sourceKind: 'active_action',
        duration: { value: 1, unit: 'year' }, deltas: {}, timestamp: { year: 18, month: 1, day: 1 },
      },
      {
        actionId: 'study-2', category: 'study', age: 19, sourceKind: 'active_action',
        duration: { value: 1, unit: 'year' }, deltas: {}, timestamp: { year: 19, month: 1, day: 1 },
      },
      {
        actionId: 'study-3', category: 'study', age: 20, sourceKind: 'active_action',
        duration: { value: 1, unit: 'year' }, deltas: {}, timestamp: { year: 20, month: 1, day: 1 },
      },
      {
        actionId: 'training-1', category: 'training', age: 20, sourceKind: 'active_action',
        duration: { value: 1, unit: 'year' }, deltas: {}, timestamp: { year: 20, month: 1, day: 1 },
      },
      {
        actionId: 'business-1', category: 'business', age: 20, sourceKind: 'active_action',
        duration: { value: 1, unit: 'year' }, deltas: {}, timestamp: { year: 20, month: 1, day: 1 },
      },
    ],
  });
  const stateBeforeDerivation = structuredClone(state);
  const summary = deriveLifeMemorySummary(state);
  const milestoneIds = summary.achievedMilestones?.map((entry) => entry.diagnostic.milestoneId) ?? [];
  const expectedMilestoneIds = [
    'study-training-balanced',
    'business-first-stall',
    'mixed-scholar-training-body-echo',
    'study-old-scroll-echo',
    'training-cultivation-deviation',
    'study-young-diligent',
    'training-practice-deepened',
    'business-habit-formed',
    'study-habit-formed',
    'training-habit-formed',
    'business-first-step',
    'study-first-step',
    'training-first-step',
  ];
  assert(summary.achievedMilestones !== undefined, 'complete state should produce achieved milestones');
  assert(milestoneIds.length === 13, `Life Memory should keep all 13 achieved milestones, got ${milestoneIds.length}`);
  assert(new Set(milestoneIds).size === 13, 'achieved milestones must not contain duplicates');
  assert(JSON.stringify(milestoneIds) === JSON.stringify(expectedMilestoneIds), 'achieved milestones keep priority and ID order');
  assert(
    !summary.achievements?.some((entry) => milestoneIds.includes(entry.diagnostic.achievementId ?? '')),
    'milestones must not enter formal achievements',
  );
  assert(JSON.stringify(serializeLifeMemorySummary(summary)) === JSON.stringify(summary), 'complete milestones should round-trip');
  assert(JSON.stringify(state) === JSON.stringify(stateBeforeDerivation), 'Life Memory derivation must not mutate GameState');
  console.log('✓ keeps the complete achieved milestone projection');
}

// Core midlife scenario regression — all categories present together
{
  const state = createCoreMidlifeOrthodoxState();
  const summary = deriveLifeMemorySummary(state);

  assertCoreScenarioCoverage(summary);

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
