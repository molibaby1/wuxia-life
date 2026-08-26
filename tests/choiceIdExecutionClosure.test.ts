import assert from 'node:assert/strict';
import familyLifeEvents from '../src/data/lines/family-life.json';
import relationshipEvents from '../src/data/lines/relationship.json';
import { EventLoader } from '../src/core/EventLoader';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../src/contracts/choiceExecution';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import { runStoryEventStep } from '../src/headless/playability/runnerSteps';
import { selectPersonaChoice } from '../src/headless/playability/choiceScoring';
import { getP8PersonaById } from '../src/p8/personas';

type JsonRecord = Record<string, any>;

const EXPECTED_CHOICE_IDS = {
  family_child_education: [
    'child_education_martial',
    'child_education_scholar',
    'child_education_merchant',
  ],
  family_crisis: [
    'family_crisis_full_support',
    'family_crisis_limited_support',
    'family_crisis_self_preserve',
  ],
  relationship_sworn_help: [
    'sworn_help_full',
    'sworn_help_financial',
    'sworn_help_stand_aside',
  ],
} as const;

const EXPECTED_STABLE_FIELDS: Record<string, JsonRecord> = {
  family_child_education: {
    name: '子女教育',
    description: '孩子到了学习的年龄，你需要决定他的培养方向。',
    version: '1.0.0',
    category: 'family',
    priority: 75,
    weight: 65,
    ageRange: { min: 28, max: 45 },
    type: 'family',
    eventType: 'choice',
    tags: ['family', 'education'],
    storyLine: null,
    triggers: [{ type: 'age_reach', value: 28 }],
    triggerConditions: { age: { min: 28, max: 45 }, flags: { required: ['has_child'] } },
    conditions: null,
    content: { title: '子女教育', text: '孩子到了学习的年龄，你需要决定他的培养方向。' },
    maxTriggers: null,
    metadata: null,
    difficulty: null,
    choices: [
      {
        text: '习武：传承你的武学',
        description: null,
        condition: null,
        conditions: null,
        effects: [{ type: 'flag_set', flag: 'child_martial', value: true }],
        outcomes: null,
      },
      {
        text: '读书：考取功名 (学识 +10, 人脉 +10)',
        description: null,
        condition: null,
        conditions: null,
        effects: [
          { type: 'stat_modify', target: 'knowledge', value: 10, operator: 'add' },
          { type: 'stat_modify', target: 'connections', value: 10, operator: 'add' },
          { type: 'flag_set', flag: 'child_scholar', value: true },
        ],
        outcomes: null,
      },
      {
        text: '从商：继承家业 (财富 +50)',
        description: null,
        condition: null,
        conditions: null,
        effects: [
          { type: 'stat_modify', target: 'money', value: 50, operator: 'add' },
          { type: 'flag_set', flag: 'child_merchant', value: true },
        ],
        outcomes: null,
      },
    ],
  },
  family_crisis: {
    name: '家族危机',
    description: '家族遭遇困难，需要你出面解决。',
    version: '1.0.0',
    category: 'family',
    priority: 70,
    weight: 60,
    ageRange: { min: 35, max: 50 },
    type: 'family',
    eventType: 'choice',
    tags: ['family', 'crisis'],
    storyLine: 'love_story',
    triggers: [{ type: 'age_reach', value: 35 }],
    triggerConditions: { age: { min: 35, max: 50 } },
    conditions: null,
    content: {
      title: '家族危机',
      text: '家族遭遇困难，需要你出面解决。若明月与子女已在身旁，他们也在等待你的抉择——是倾尽家财，还是量力而行？',
    },
    maxTriggers: null,
    metadata: null,
    difficulty: null,
    choices: [
      {
        text: '倾尽家财，帮助家族 (财富 -100, 声望 +20)',
        description: null,
        condition: null,
        conditions: null,
        effects: [
          { type: 'stat_modify', target: 'money', value: -100, operator: 'add' },
          { type: 'stat_modify', target: 'reputation', value: 20, operator: 'add' },
          { type: 'status_add', status: 'anxious' },
        ],
        outcomes: null,
      },
      {
        text: '尽力而为，量力而行 (财富 -30)',
        description: null,
        condition: null,
        conditions: null,
        effects: [
          { type: 'stat_modify', target: 'money', value: -30, operator: 'add' },
          { type: 'status_add', status: 'anxious' },
        ],
        outcomes: null,
      },
      {
        text: '抽身自保，先守住自家日子 (声望 -10)',
        description: null,
        condition: null,
        conditions: null,
        effects: [{ type: 'stat_modify', target: 'reputation', value: -10, operator: 'add' }],
        outcomes: null,
      },
    ],
  },
  relationship_sworn_help: {
    name: null,
    description: null,
    version: '1.0',
    category: 'relationship',
    priority: 72,
    weight: 55,
    ageRange: { min: 25, max: 55 },
    type: null,
    eventType: 'choice',
    tags: null,
    storyLine: null,
    triggers: [
      { type: 'age_reach', value: 25 },
      { type: 'random', value: 0.12 },
    ],
    triggerConditions: null,
    conditions: [{ type: 'expression', expression: 'flags.has_sworn_siblings == true' }],
    content: {
      title: '生死与共',
      text: '你的结拜兄弟/姐妹遇到了麻烦，请你帮忙。作为结义之人，你义不容辞。',
      description: '兄弟有难',
    },
    maxTriggers: null,
    metadata: null,
    difficulty: null,
    choices: [
      {
        text: '全力相助（需武力≥70，侠义 +15）',
        description: '全力相助可守住侠义，却会让你的功力、体魄与名望承受损失，这是必须付出的代价。',
        condition: null,
        conditions: [{ type: 'expression', expression: 'martialPower >= 70' }],
        effects: [
          { type: 'stat_modify', stat: 'chivalry', value: 15 },
          { type: 'stat_modify', stat: 'martialPower', value: 10 },
          { type: 'stat_modify', stat: 'reputation', value: 15 },
          { type: 'stat_modify', stat: 'constitution', value: -5 },
        ],
        outcomes: null,
      },
      {
        text: '提供资金支持（侠义 +8，魅力 +5）',
        description: null,
        condition: null,
        conditions: null,
        effects: [
          { type: 'stat_modify', stat: 'chivalry', value: 8 },
          { type: 'stat_modify', stat: 'charisma', value: 5 },
        ],
        outcomes: null,
      },
      {
        text: '袖手旁观（侠义 -20）',
        description: null,
        condition: null,
        conditions: null,
        effects: [
          { type: 'stat_modify', stat: 'chivalry', value: -20 },
          { type: 'stat_modify', stat: 'reputation', value: -10 },
        ],
        outcomes: null,
      },
    ],
  },
};

const SOURCE_EVENTS: Record<string, JsonRecord[]> = {
  family_child_education: familyLifeEvents as JsonRecord[],
  family_crisis: familyLifeEvents as JsonRecord[],
  relationship_sworn_help: relationshipEvents as JsonRecord[],
};

function findSourceEvent(eventId: string): JsonRecord {
  const event = SOURCE_EVENTS[eventId]?.find(candidate => candidate.id === eventId);
  assert(event, `source event must exist: ${eventId}`);
  return event;
}

function projectStableFields(event: JsonRecord): JsonRecord {
  return {
    name: event.name ?? null,
    description: event.description ?? null,
    version: event.version ?? null,
    category: event.category ?? null,
    priority: event.priority ?? null,
    weight: event.weight ?? null,
    ageRange: event.ageRange ?? null,
    type: event.type ?? null,
    eventType: event.eventType ?? null,
    tags: event.tags ?? null,
    storyLine: event.storyLine ?? null,
    triggers: event.triggers ?? null,
    triggerConditions: event.triggerConditions ?? null,
    conditions: event.conditions ?? null,
    content: event.content ?? null,
    maxTriggers: event.maxTriggers ?? null,
    metadata: event.metadata ?? null,
    difficulty: event.difficulty ?? null,
    choices: (event.choices ?? []).map((choice: JsonRecord) => ({
      text: choice.text ?? null,
      description: choice.description ?? null,
      condition: choice.condition ?? null,
      conditions: choice.conditions ?? null,
      effects: choice.effects ?? null,
      outcomes: choice.outcomes ?? null,
    })),
  };
}

function collectContractFailures(loader: EventLoader): string[] {
  const failures: string[] = [];
  for (const [eventId, expectedIds] of Object.entries(EXPECTED_CHOICE_IDS)) {
    const event = findSourceEvent(eventId);
    const actualIds = (event.choices ?? []).map((choice: JsonRecord) => choice.id ?? null);
    try {
      assert.deepEqual(actualIds, expectedIds);
    } catch {
      failures.push(`${eventId} choice IDs: expected ${expectedIds.join(',')}, got ${actualIds.join(',')}`);
    }
    if (actualIds.some(id => typeof id !== 'string' || id.length === 0)) {
      failures.push(`${eventId} contains an empty choice.id`);
    }
    if (new Set(actualIds).size !== actualIds.length) {
      failures.push(`${eventId} choice IDs are not unique`);
    }
    try {
      assert.deepEqual(projectStableFields(event), EXPECTED_STABLE_FIELDS[eventId]);
    } catch (error) {
      failures.push(`${eventId} stable event/choice fields changed: ${error}`);
    }
  }

  const targetErrors = loader
    .validateEvents()
    .errors.filter(
      error =>
        error.includes('family_child_education') ||
        error.includes('family_crisis') ||
        error.includes('relationship_sworn_help'),
    );
  if (targetErrors.length > 0) {
    failures.push(`target EventLoader validation errors remain:\n${targetErrors.join('\n')}`);
  }
  return failures;
}

function createTargetSnapshot(eventId: string, flags: Record<string, boolean>) {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: `Instance 007 ${eventId}`,
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 7007,
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 35;
  snapshot.state.player.martialPower = 100;
  snapshot.state.player.money = 500;
  snapshot.state.player.alive = true;
  snapshot.state.flags = { ...snapshot.state.flags, ...flags };
  snapshot.state.player.flags = { ...snapshot.state.player.flags, ...flags };
  snapshot.state.eventHistory = [];
  snapshot.state.pendingStoryEventId = eventId;
  return snapshot;
}

async function assertHeadlessChoiceExecution(eventId: string, flags: Record<string, boolean>): Promise<void> {
  const session = HeadlessEngineSessionImpl.create({ snapshot: createTargetSnapshot(eventId, flags) });
  const event = session.getCurrentEvent();
  assert(event?.id === eventId, `headless must hydrate ${eventId} as the current event`);

  const persona = getP8PersonaById('p8-martial-lin');
  assert(persona, 'the deterministic martial persona must exist');
  const selection = selectPersonaChoice(session, event, persona);
  assert(selection?.choice.id, `${eventId} persona selection must return a non-empty choice.id`);

  const records: any[] = [];
  await runStoryEventStep({
    session,
    persona,
    records,
    choiceDiagnostics: [],
    activeActionSelectionReasons: [],
  });

  const selectedRecord = records.find(record => record.eventId === eventId);
  assert(selectedRecord, `${eventId} Headless runner must record the selected choice event`);
  assert(selectedRecord.selectedChoice?.id, `${eventId} selectedChoice must retain a choice.id`);
  assert(
    session.getRuntimeState().eventHistory.some(record => record.eventId === eventId),
    `${eventId} formal eventHistory must contain the executed event`,
  );
}

async function main(): Promise<void> {
  process.env.WUXIA_ENGINE_QUIET = '1';
  const loader = EventLoader.getInstance();
  const failures = collectContractFailures(loader);
  if (failures.length > 0) {
    throw new Error(`Instance 007 choice-id regression:\n${failures.join('\n')}`);
  }

  await assertHeadlessChoiceExecution('family_child_education', { has_child: true });
  await assertHeadlessChoiceExecution('family_crisis', {});
  await assertHeadlessChoiceExecution('relationship_sworn_help', { has_sworn_siblings: true });

  // Keep the request contract explicit at the same boundary used by production execution.
  assert.equal(CHOICE_EXECUTION_REQUEST_VERSION, '1.0.0');
  console.log('choiceIdExecutionClosure.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
