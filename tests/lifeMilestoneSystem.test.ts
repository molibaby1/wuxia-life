import { strict as assert } from 'node:assert';
import catalog from '../src/data/life-milestones.json';
import {
  deriveMilestoneProjection,
  evaluateMilestone,
  evaluateMilestoneCondition,
} from '../src/core/deriveMilestoneProjection';
import type { GameState, PlayerState } from '../src/types/eventTypes';
import type { MilestoneDefinition } from '../src/types/milestone';

function createState(overrides: Partial<GameState> = {}): GameState {
  const player: PlayerState = {
    name: '测试侠客', gender: 'male', age: 20, martialPower: 0, chivalry: 0,
    charisma: 0, constitution: 0, knowledge: 0,
    businessAcumen: 0, influence: 0, connections: 0, martialHeritage: 0,
    scholarlyHeritage: 0, merchantNetwork: 0, wealthCapacity: 'no_surplus', reputation: 0,
    affiliation: null, title: null, healthStatus: 'healthy', statuses: [], alive: true,
    items: [], flags: {}, events: [], relationships: [], children: 0, spouse: null,
    lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
  };
  return {
    player, flags: {}, relations: {}, eventHistory: [], actionHistory: [],
    ...overrides,
  };
}

function activeAction(category: 'study' | 'training' | 'business', age: number) {
  return {
    actionId: `${category}-${age}`, category, age, sourceKind: 'active_action' as const,
    duration: { value: 1, unit: 'year' as const }, deltas: {},
    timestamp: { year: age, month: 1, day: 1 },
  };
}

const definitions = catalog as MilestoneDefinition[];

assert.equal(definitions.length, 13, 'catalog must contain the approved thirteen milestones');
assert.equal(new Set(definitions.map(item => item.id)).size, 13, 'catalog ids must be unique');
assert(definitions.every(item => item.visibility === 'full'), 'all milestones must be fully visible');
assert(definitions.every(item => item.conditions.every((condition) =>
  ['habit_at_least', 'action_count', 'event_occurred'].includes(condition.type))), 'catalog must use only approved condition types');
const catalogText = JSON.stringify(definitions);
assert(!catalogText.includes('stat_threshold'), 'catalog must not use stat thresholds');
assert(!catalogText.includes('comprehension'), 'catalog must not use comprehension');
assert(!catalogText.includes('reward'), 'catalog must not use rewards');
assert(!definitions.some((item) => Object.keys(item).includes('script')), 'catalog must not use custom scripts');

{
  const state = createState({
    actionHistory: [
      activeAction('study', 16),
      { ...activeAction('study', 17), sourceKind: 'story_event' as const },
      activeAction('study', 18),
      activeAction('study', 19),
    ],
  });
  const result = evaluateMilestoneCondition(state, {
    type: 'action_count', category: 'study', min: 3, maxAge: 20, label: '20 岁前主动读书 3 次',
  });
  assert.equal(result.met, true, 'only active study actions should count');
  assert.equal(result.occurredAtAge, 19, 'the Nth qualifying action establishes achieved age');
}

{
  const state = createState({ player: { ...createState().player, age: 21 } });
  const result = evaluateMilestoneCondition(state, {
    type: 'action_count', category: 'study', min: 3, maxAge: 20, label: '20 岁前主动读书 3 次',
  });
  assert.equal(result.expired, true, 'unmet age-limited action condition must expire');
}

{
  const state = createState({
    player: { ...createState().player, lifeStates: { trainingHabit: 2, studyHabit: 2, businessHabit: 0 } },
    eventHistory: [{ eventId: 'synthetic-event', age: 18 }],
  });
  const habit = evaluateMilestoneCondition(state, {
    type: 'habit_at_least', habit: 'studyHabit', min: 2, label: '读书实践 2 级',
  });
  assert.equal(habit.met, true);
  assert.equal(habit.occurredAtAge, undefined, 'habit level must not invent an achieved age');
  const event = evaluateMilestoneCondition(state, {
    type: 'event_occurred', eventId: 'synthetic-event', label: '发生合成事件',
  });
  assert.equal(event.occurredAtAge, 18, 'event conditions should recover their event age');
  const combined = evaluateMilestone(state, {
    id: 'combined', label: '组合', description: '组合', category: 'mixed', priority: 1, visibility: 'full',
    conditions: [
      { type: 'habit_at_least', habit: 'studyHabit', min: 2, label: '读书实践 2 级' },
      { type: 'habit_at_least', habit: 'trainingHabit', min: 3, label: '练功实践 3 级' },
    ],
  });
  assert.equal(combined.achieved, false, 'all milestone conditions must be met');
}

{
  const state = createState({ actionHistory: [activeAction('study', 18)] });
  const before = JSON.stringify(state);
  const projection = deriveMilestoneProjection(state, definitions);
  assert(projection.achieved.some(item => item.definition.id === 'study-first-step'));
  assert(projection.prospects.some(item => item.definition.id === 'study-young-diligent'));
  assert(!projection.prospects.some(item => item.achieved || item.expired), 'prospects must only be partial, active progress');
  assert.equal(JSON.stringify(state), before, 'projection must not mutate GameState');
  assert.equal(state.achievements, undefined, 'projection must not write achievements');
  assert.equal(state.lifePath?.achievements, undefined, 'projection must not write LifePath achievements');
}

{
  const definition = definitions.find((item) => item.id === 'training-practice-deepened')!;
  const prospectState = createState({
    player: { ...createState().player, lifeStates: { trainingHabit: 3, studyHabit: 0, businessHabit: 0 } },
  });
  const prospect = evaluateMilestone(prospectState, definition);
  assert.equal(prospect.achieved, false, 'training habit 3 must not achieve deepened practice');
  assert.equal(prospect.progressRatio, 3 / 4, 'training habit 3 must show partial deepened progress');
  assert(deriveMilestoneProjection(prospectState, definitions).prospects.some((item) => item.definition.id === definition.id));

  const achievedState = createState({
    player: { ...createState().player, lifeStates: { trainingHabit: 4, studyHabit: 0, businessHabit: 0 } },
  });
  assert.equal(evaluateMilestone(achievedState, definition).achieved, true, 'training habit 4 must achieve deepened practice');
}

{
  const eventIds = [
    'setback_cultivation_deviation',
    'p26_study_habit_midlife_callback',
    'p42_training_habit_scholar_body_echo',
    'p42_business_habit_youth_stall',
  ];
  const eventDefinitions = definitions.filter((item) => item.conditions[0]?.type === 'event_occurred');
  assert.equal(eventDefinitions.length, 4, 'catalog must contain four event-derived milestones');

  for (const definition of eventDefinitions) {
    const eventCondition = definition.conditions[0];
    assert.equal(eventCondition.type, 'event_occurred');
    const before = evaluateMilestone(createState(), definition);
    assert.equal(before.progressRatio, 0, `${definition.id} must have zero progress before its event`);
    assert(!deriveMilestoneProjection(createState(), definitions).prospects.some((item) => item.definition.id === definition.id));

    const eventId = eventCondition.eventId;
    assert(eventIds.includes(eventId), `${definition.id} must use an approved event id`);
    const after = evaluateMilestone(createState({ eventHistory: [{ eventId, age: 37 }] }), definition);
    assert.equal(after.achieved, true, `${definition.id} must be achieved by its event history`);
    assert.equal(after.occurredAtAge, 37, `${definition.id} must use event history age`);
  }
}

{
  const allEventHistory = [
    'setback_cultivation_deviation',
    'p26_study_habit_midlife_callback',
    'p42_training_habit_scholar_body_echo',
    'p42_business_habit_youth_stall',
  ].map((eventId, index) => ({ eventId, age: 18 + index }));
  const projection = deriveMilestoneProjection(createState({ eventHistory: allEventHistory }), definitions);
  assert.equal(
    projection.achieved.filter((item) => item.definition.conditions[0]?.type === 'event_occurred').length,
    4,
    'all four event milestones must use the generic evaluator',
  );
}

{
  const stateWithoutEventHistory = { ...createState(), eventHistory: undefined } as unknown as GameState;
  const result = evaluateMilestoneCondition(stateWithoutEventHistory, {
    type: 'event_occurred',
    eventId: 'setback_cultivation_deviation',
    label: '经历走火入魔之险',
  });
  assert.equal(result.met, false, 'missing event history must evaluate event milestone as unmet');
  assert.equal(result.ratio, 0, 'missing event history must have zero progress');
}

console.log('✓ Life Milestone System');
