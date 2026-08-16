import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { EventDefinition } from '../../src/types/eventTypes';
import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog';
import {
  HEADLESS_API_PLAYER_SURFACE_ID,
  PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
  serializeObservablePayload,
} from '../../src/evolution/playerObservableTranscript';
import { projectHeadlessApiPlayerObservablePayload } from '../../src/evolution/wuxiaPlayerObservableProjector';
import type { HeadlessApiPlayerSurfaceTrace } from '../../src/headless/playability/playerSurfaceCapture';
import {
  buildInvestigationEvidence,
  appendInvestigationEvidenceItem,
  investigationEvidenceRefs,
  type InvestigationEvidenceItem,
} from '../../scripts/evolution/hypothesisInvestigation/buildInvestigationEvidence';
import { currentProductScopeRefs } from '../../scripts/evolution/modificationWork/loadModificationWorkSource';
import type { HypothesisInvestigationSource } from '../../scripts/evolution/hypothesisInvestigation/loadHypothesisInvestigationSource';
import { canonicalJson } from '../../scripts/evolution/phase0/provenance';
import type { ExternalFeedbackSource } from '../../scripts/evolution/improvementHypothesis/loadExternalFeedbackSource';
import {
  SAME_CATEGORY_REPEAT_DIMINISHING_THRESHOLD,
  SAME_CATEGORY_REPEAT_REWARD_MULTIPLIER,
  activeActionRepeatMechanismFacts,
  resolveActiveAction,
} from '../../src/core/activePlanning/ActionResultResolver';

function catalogFromEvents(events: EventDefinition[]): RuntimeEventCatalog {
  const byId = new Map(events.map(event => [event.id, event]));
  return {
    getAllEvents: () => events,
    getEventsByAge: () => events,
    getEventById: id => byId.get(id),
    getWeightForAge: () => 1,
  };
}

function minimalEvent(input: {
  id: string;
  storyLine?: string;
  title?: string;
  text?: string;
}): EventDefinition {
  return {
    id: input.id,
    type: 'story',
    category: 'life',
    title: input.title ?? input.id,
    text: input.text ?? `${input.id} text`,
    weight: 1,
    ...(input.storyLine !== undefined ? { storyLine: input.storyLine } : {}),
  } as EventDefinition;
}

async function writeGameRun(
  root: string,
  surface: HeadlessApiPlayerSurfaceTrace,
  catalogEvents: EventDefinition[],
): Promise<string> {
  const gameRunPath = join(root, 'game-runs', 'inv-evidence-001');
  await mkdir(join(gameRunPath, 'internal'), { recursive: true });
  await mkdir(join(gameRunPath, 'inputs'), { recursive: true });
  await writeFile(
    join(gameRunPath, 'internal', 'player-surface-source.json'),
    canonicalJson(surface),
  );
  await writeFile(
    join(gameRunPath, 'inputs', 'catalog.json'),
    canonicalJson({
      schemaVersion: 'phase0-catalog-input-v1',
      events: [...catalogEvents].sort((a, b) => a.id.localeCompare(b.id)),
    }),
  );
  return gameRunPath;
}

function buildSource(input: {
  gameRunPath: string;
  surface: HeadlessApiPlayerSurfaceTrace;
  feedbackRefs?: string[];
  evidenceRefs?: string[];
}): HypothesisInvestigationSource {
  const projected = projectHeadlessApiPlayerObservablePayload(input.surface);
  const observablePayloadBytes = serializeObservablePayload(projected);
  const feedback = {
    overallImpression: '整体有遗憾。',
    observations: [
      { feedback: '无关观察 0。', evidenceRefs: ['entry-000001'] },
      { feedback: '无关观察 1。', evidenceRefs: ['entry-000001'] },
      { feedback: '无关观察 2。', evidenceRefs: ['entry-000001'] },
      {
        feedback: '婚姻选择留下遗憾。',
        evidenceRefs: ['entry-000026', 'entry-000037'].filter(id =>
          projected.entries.some(entry => entry.entryId === id),
        ).length > 0
          ? projected.entries
            .filter(entry => entry.kind === 'story_event')
            .slice(0, 2)
            .map(entry => entry.entryId)
          : [projected.entries[0]!.entryId],
      },
    ],
  };

  // Map evidence refs to actual projected story entry IDs for the crafted surface.
  const storyEntries = projected.entries.filter(entry => entry.kind === 'story_event');
  const evidenceRefs = input.evidenceRefs ?? [
    storyEntries[0]?.entryId ?? 'entry-000001',
    storyEntries[1]?.entryId ?? storyEntries[0]?.entryId ?? 'entry-000001',
  ];
  feedback.observations[3]!.evidenceRefs = evidenceRefs;

  const feedbackBytes = canonicalJson(feedback);
  const mefSource: ExternalFeedbackSource = {
    runRef: 'inv-evidence-001',
    feedbackInvocationRef: 'inv-evidence-001-deepseek-player-feedback-001',
    experimentRootHash: 'a'.repeat(64),
    observablePayloadHash: 'b'.repeat(64),
    feedbackHash: 'c'.repeat(64),
    observablePayloadBytes,
    feedbackBytes,
    rawFeedbackParticipantResponse: feedbackBytes,
    observablePayload: projected,
    feedback,
  };

  const selectedHypothesis = {
    hypothesisId: 'hypothesis-000002',
    hypothesis: '婚姻选择可能造成持久遗憾感。',
    observedBasis: 'participant 明确提到遗憾。',
    feedbackRefs: input.feedbackRefs ?? ['observations[3]'],
    evidenceRefs,
    unknowns: ['是否多数玩家有同样反应。'],
    productSignificance: '可能影响结局满意度。',
  };

  return {
    runRef: 'inv-evidence-001',
    hypothesisId: 'hypothesis-000002',
    feedbackInvocationRef: mefSource.feedbackInvocationRef,
    hypothesisInvocationRef: 'inv-evidence-001-deepseek-improvement-hypothesis-001',
    experimentRootHash: mefSource.experimentRootHash,
    observablePayloadHash: mefSource.observablePayloadHash,
    feedbackHash: mefSource.feedbackHash,
    hypothesesHash: 'd'.repeat(64),
    selectedHypothesisHash: 'e'.repeat(64),
    selectedHypothesis,
    sourceHypothesesBytes: '{}',
    sourceHypothesisInvocationBytes: '{}',
    mefSource,
    gameRunPath: input.gameRunPath,
  };
}

function loveSurface(extraCard = false): HeadlessApiPlayerSurfaceTrace {
  return {
    schemaVersion: 'headless-api-player-surface-source-v1',
    steps: [
      {
        sequence: 1,
        kind: 'active_action_result',
        presentationCards: [{
          title: '练功',
          body: '你练了一季。',
          metaLines: ['功力 +1'],
        }],
      },
      {
        sequence: 2,
        kind: 'story_event',
        age: 15,
        storyEvent: {
          eventId: 'love_first_meet',
          title: '初遇',
          text: '市集中你与一人擦肩而过。',
          choices: [
            { id: 'love_greet', text: '礼貌问候' },
            { id: 'love_charm', text: '展示魅力' },
          ],
        },
        selectedChoiceId: 'love_charm',
        presentationCards: extraCard
          ? [
            { title: '初遇', body: '对方眼前一亮。', metaLines: ['魅力 +5'] },
            { title: '余波', body: '这件事还在心里回荡。' },
          ]
          : [
            { title: '初遇', body: '对方眼前一亮。', metaLines: ['魅力 +5'] },
          ],
      },
      {
        sequence: 3,
        kind: 'story_event',
        age: 20,
        storyEvent: {
          eventId: 'family_marriage',
          title: '喜结良缘',
          text: '到了成家的年纪。',
          choices: [
            { id: 'marry_mingyue', text: '迎娶明月' },
            { id: 'marry_arranged', text: '接受安排' },
          ],
        },
        selectedChoiceId: 'marry_arranged',
        presentationCards: [{
          title: '喜结良缘',
          body: '你接受了安排。',
          metaLines: ['财富 +50'],
        }],
      },
    ],
  };
}

const SOURCE_LOVE_EVENTS: EventDefinition[] = [
  minimalEvent({ id: 'love_first_meet', storyLine: 'love_story', title: '初遇' }),
  minimalEvent({ id: 'family_marriage', storyLine: 'love_story', title: '喜结良缘' }),
  minimalEvent({ id: 'love_separation', storyLine: 'love_story', title: '分离' }),
  minimalEvent({
    id: 'merchant_unrelated',
    storyLine: 'merchant_path',
    title: '商路',
    text: '提到婚姻与真爱只是文本巧合。',
  }),
];

export async function runHypothesisInvestigationEvidenceTests(): Promise<void> {
  await testSelectedSourceNarrowing();
  await testSourceStepMappingWithExtraCard();
  await testSourceStoryLineSlice();
  await testCurrentProductComparison();
  await testNoOpenEndedAccess();
  await testActiveActionMechanismEvidence();
  await testActiveActionExplicitActionId();
  await testActiveActionDoesNotDumpUnrelatedActions();
  await testActiveActionAmbiguousTitleFailsClosed();
  await testActiveActionModificationWorkScopeCompatibility();
  await testLongitudinalEvidenceExpansion();
  await testLongitudinalEvidenceRunBoundary();
  testEvidenceIdConflictFailsClosed();
}

async function testSelectedSourceNarrowing(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-inv-ev-narrow-'));
  const surface = loveSurface(false);
  const gameRunPath = await writeGameRun(root, surface, SOURCE_LOVE_EVENTS);
  const source = buildSource({ gameRunPath, surface });
  const pack = await buildInvestigationEvidence({ source });

  const feedbackItems = pack.items.filter(item => item.kind === 'feedback');
  assert.equal(feedbackItems.length, 1);
  assert.equal(feedbackItems[0]?.evidenceId, 'feedback:observations[3]');
  assert.equal(
    (feedbackItems[0]?.payload as { text: string }).text,
    '婚姻选择留下遗憾。',
  );
  assert.equal(
    pack.items.some(item => item.evidenceId === 'feedback:overallImpression'),
    false,
  );
  assert.equal(
    pack.items.some(item => item.evidenceId === 'feedback:observations[0]'),
    false,
  );

  const observableIds = pack.items
    .filter(item => item.kind === 'observable_entry')
    .map(item => item.evidenceId)
    .sort();
  assert.deepEqual(observableIds, [
    `observable:${source.selectedHypothesis.evidenceRefs[0]}`,
    `observable:${source.selectedHypothesis.evidenceRefs[1]}`,
  ]);
  assert.equal(
    pack.items.some(item => item.evidenceId === 'observable:entry-000001'),
    false,
  );
}

async function testSourceStepMappingWithExtraCard(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-inv-ev-map-'));
  const surface = loveSurface(true);
  const gameRunPath = await writeGameRun(root, surface, SOURCE_LOVE_EVENTS);
  const projected = projectHeadlessApiPlayerObservablePayload(surface);

  // entry-000001 = active action
  // entry-000002 = love_first_meet primary story
  // entry-000003 = love_first_meet extra card
  // entry-000004 = family_marriage
  assert.equal(projected.entries[1]?.entryId, 'entry-000002');
  assert.equal(projected.entries[1]?.kind, 'story_event');
  assert.equal(projected.entries[2]?.entryId, 'entry-000003');
  assert.equal(projected.entries[2]?.kind, 'other');
  assert.equal(projected.entries[3]?.entryId, 'entry-000004');
  assert.equal(projected.entries[3]?.kind, 'story_event');

  const source = buildSource({
    gameRunPath,
    surface,
    evidenceRefs: ['entry-000002', 'entry-000004'],
  });
  const pack = await buildInvestigationEvidence({ source });

  const stepIds = pack.items
    .filter(item => item.kind === 'source_step')
    .map(item => item.evidenceId)
    .sort();
  assert.deepEqual(stepIds, [
    'source-step:entry-000002',
    'source-step:entry-000004',
  ]);

  const meet = pack.items.find(item => item.evidenceId === 'source-step:entry-000002');
  const marriage = pack.items.find(item => item.evidenceId === 'source-step:entry-000004');
  assert.equal((meet?.payload as { eventId: string }).eventId, 'love_first_meet');
  assert.equal((meet?.payload as { selectedChoiceId: string }).selectedChoiceId, 'love_charm');
  assert.equal((marriage?.payload as { eventId: string }).eventId, 'family_marriage');
  assert.equal(
    (marriage?.payload as { selectedChoiceId: string }).selectedChoiceId,
    'marry_arranged',
  );
}

async function testSourceStoryLineSlice(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-inv-ev-slice-'));
  const surface = loveSurface(false);
  const gameRunPath = await writeGameRun(root, surface, SOURCE_LOVE_EVENTS);
  const source = buildSource({ gameRunPath, surface });
  const pack = await buildInvestigationEvidence({ source });

  assert.deepEqual(pack.storyLines, ['love_story']);
  const sourceCatalogIds = pack.items
    .filter(item => item.kind === 'catalog_event' && item.authority === 'source_run')
    .map(item => item.evidenceId)
    .sort();
  assert.deepEqual(sourceCatalogIds, [
    'source-catalog:family_marriage',
    'source-catalog:love_first_meet',
    'source-catalog:love_separation',
  ]);
  assert.equal(
    pack.items.some(item => item.evidenceId === 'source-catalog:merchant_unrelated'),
    false,
  );
}

async function testCurrentProductComparison(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-inv-ev-cmp-'));
  const surface = loveSurface(false);
  const gameRunPath = await writeGameRun(root, surface, SOURCE_LOVE_EVENTS);
  const source = buildSource({ gameRunPath, surface });

  const currentEvents: EventDefinition[] = [
    minimalEvent({ id: 'love_first_meet', storyLine: 'love_story', title: '初遇（现行）' }),
    minimalEvent({ id: 'family_marriage', storyLine: 'love_story', title: '喜结良缘' }),
    minimalEvent({ id: 'love_new_branch', storyLine: 'love_story', title: '新分支' }),
    // love_separation removed from current
  ];

  const pack = await buildInvestigationEvidence({
    source,
    currentRuntimeCatalog: catalogFromEvents(currentEvents),
  });

  const currentIds = pack.items
    .filter(item => item.kind === 'catalog_event' && item.authority === 'current_product')
    .map(item => item.evidenceId)
    .sort();
  assert.deepEqual(currentIds, [
    'current-catalog:family_marriage',
    'current-catalog:love_first_meet',
    'current-catalog:love_new_branch',
  ]);

  const comparison = pack.items.find(
    item => item.evidenceId === 'catalog-comparison:love_story',
  );
  assert.ok(comparison);
  assert.deepEqual(comparison?.payload, {
    storyLine: 'love_story',
    addedEventIds: ['love_new_branch'],
    removedEventIds: ['love_separation'],
    changedEventIds: ['love_first_meet'],
  });
}

async function testNoOpenEndedAccess(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-inv-ev-bound-'));
  const surface = loveSurface(false);
  const gameRunPath = await writeGameRun(root, surface, SOURCE_LOVE_EVENTS);
  const source = buildSource({ gameRunPath, surface });
  source.sourceHypothesesBytes = JSON.stringify({
    hypotheses: [
      source.selectedHypothesis,
      {
        hypothesisId: 'hypothesis-000001',
        hypothesis: '无关假说',
        observedBasis: '无关',
        feedbackRefs: ['overallImpression'],
        evidenceRefs: [],
        unknowns: ['未知'],
        productSignificance: '无关',
      },
    ],
  });

  const pack = await buildInvestigationEvidence({ source });
  const blob = canonicalJson(pack);
  assert.equal(blob.includes('hypothesis-000001'), false);
  assert.equal(blob.includes('无关假说'), false);
  assert.equal(blob.includes('persona'), false);
  assert.equal(blob.includes('sourceFingerprint'), false);
  assert.equal(blob.includes('merchant_unrelated'), false);
  assert.equal(pack.selectedHypothesis.hypothesisId, 'hypothesis-000002');

  const refs = investigationEvidenceRefs(pack);
  assert.ok(refs.has('feedback:observations[3]'));
  assert.ok(refs.has('source-catalog:family_marriage'));
  assert.ok(refs.has('catalog-comparison:love_story') || refs.size > 0);
}

function trainingSurface(input?: {
  actionId?: string;
  title?: string;
  includeStudy?: boolean;
}): HeadlessApiPlayerSurfaceTrace {
  const title = input?.title ?? '练功';
  const trainingStep: HeadlessApiPlayerSurfaceTrace['steps'][number] = {
    sequence: 1,
    kind: 'active_action_result',
    age: 42,
    ...(input?.actionId !== undefined ? { actionId: input.actionId } : {}),
    presentationCards: [{
      title,
      body: '你反复苦练，银两又见见底。',
      metaLines: ['功力 +1', '银两 -10', '重复投入，收益递减'],
    }],
  };
  const steps: HeadlessApiPlayerSurfaceTrace['steps'] = [trainingStep];
  if (input?.includeStudy) {
    steps.push({
      sequence: 2,
      kind: 'active_action_result',
      age: 42,
      actionId: 'action_study_basic',
      presentationCards: [{
        title: '读书',
        body: '你读了一季。',
        metaLines: ['学识 +2'],
      }],
    });
  }
  return {
    schemaVersion: 'headless-api-player-surface-source-v1',
    steps,
  };
}

async function testActiveActionMechanismEvidence(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-inv-ev-aa-'));
  // Historical sealed shape: title only, no actionId — unique formal name join.
  const surface = trainingSurface();
  const gameRunPath = await writeGameRun(root, surface, SOURCE_LOVE_EVENTS);
  const source = buildSource({
    gameRunPath,
    surface,
    evidenceRefs: ['entry-000001'],
    feedbackRefs: ['overallImpression'],
  });
  source.selectedHypothesis = {
    ...source.selectedHypothesis,
    hypothesisId: 'hypothesis-000001',
    hypothesis: '高频练功可能造成银两透支与收益递减。',
  };

  const pack = await buildInvestigationEvidence({ source });
  const refs = investigationEvidenceRefs(pack);

  assert.ok(refs.has('observable:entry-000001'));
  assert.ok(refs.has('source-step:entry-000001'));
  assert.ok(refs.has('current-action:action_training_basic'));
  assert.ok(refs.has('current-action-mechanism:action_training_basic'));

  const step = pack.items.find(item => item.evidenceId === 'source-step:entry-000001');
  assert.equal((step?.payload as { actionId: string }).actionId, 'action_training_basic');

  const definition = pack.items.find(
    item => item.evidenceId === 'current-action:action_training_basic',
  );
  assert.equal(definition?.authority, 'current_product');
  assert.equal(definition?.kind, 'action_definition');
  const defPayload = definition?.payload as {
    id: string;
    category: string;
    costs: Array<{ stat?: string; amount: number }>;
    rewards: Array<{ stat: string; min: number; max: number }>;
  };
  assert.equal(defPayload.id, 'action_training_basic');
  assert.equal(defPayload.category, 'training');
  assert.ok(defPayload.costs.some(cost => cost.stat === 'money' && cost.amount === 10));
  assert.ok(defPayload.rewards.some(reward => reward.stat === 'martialPower'));

  const mechanism = pack.items.find(
    item => item.evidenceId === 'current-action-mechanism:action_training_basic',
  );
  assert.equal(mechanism?.authority, 'current_product');
  assert.equal(mechanism?.kind, 'action_mechanism');

  // Authority must be shared with ActionResultResolver — not a second literal copy.
  const sharedFacts = activeActionRepeatMechanismFacts();
  assert.equal(
    sharedFacts.sameCategoryRepeatThreshold,
    SAME_CATEGORY_REPEAT_DIMINISHING_THRESHOLD,
  );
  assert.equal(
    sharedFacts.rewardMultiplierWhenRepeated,
    SAME_CATEGORY_REPEAT_REWARD_MULTIPLIER,
  );
  assert.deepEqual(mechanism?.payload, {
    actionId: 'action_training_basic',
    owner: 'ActionResultResolver.resolveActiveAction',
    ...sharedFacts,
    ageClampOwner: 'clampActionDeltasForAge',
  });

  // Prove resolveActiveAction actually consumes those same constants.
  const below = resolveActiveAction({
    state: { player: { age: 30 } } as never,
    actionId: 'action_training_basic',
    focusStreak: {
      category: 'training',
      count: SAME_CATEGORY_REPEAT_DIMINISHING_THRESHOLD - 2,
    },
    random: () => 0,
  });
  const atThreshold = resolveActiveAction({
    state: { player: { age: 30 } } as never,
    actionId: 'action_training_basic',
    focusStreak: {
      category: 'training',
      count: SAME_CATEGORY_REPEAT_DIMINISHING_THRESHOLD - 1,
    },
    random: () => 0,
  });
  assert.equal(below?.metadata.diminishingReturn, false);
  assert.equal(atThreshold?.metadata.diminishingReturn, true);
}

async function testActiveActionExplicitActionId(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-inv-ev-aa-id-'));
  const surface = trainingSurface({ actionId: 'action_training_basic', title: '练功' });
  const gameRunPath = await writeGameRun(root, surface, SOURCE_LOVE_EVENTS);
  const source = buildSource({
    gameRunPath,
    surface,
    evidenceRefs: ['entry-000001'],
  });
  const pack = await buildInvestigationEvidence({ source });
  const step = pack.items.find(item => item.evidenceId === 'source-step:entry-000001');
  assert.equal((step?.payload as { actionId: string }).actionId, 'action_training_basic');
  assert.ok(
    investigationEvidenceRefs(pack).has('current-action-mechanism:action_training_basic'),
  );
}

async function testActiveActionDoesNotDumpUnrelatedActions(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-inv-ev-aa-narrow-'));
  const surface = trainingSurface({ includeStudy: true });
  const gameRunPath = await writeGameRun(root, surface, SOURCE_LOVE_EVENTS);
  const source = buildSource({
    gameRunPath,
    surface,
    evidenceRefs: ['entry-000001'],
  });
  const pack = await buildInvestigationEvidence({ source });
  const blob = canonicalJson(pack);

  assert.ok(blob.includes('action_training_basic'));
  assert.equal(blob.includes('action_study_basic'), false);
  assert.equal(blob.includes('action_business_basic'), false);
  assert.equal(blob.includes('action_socializing_basic'), false);
  assert.equal(blob.includes('action_travel_basic'), false);
  assert.equal(
    pack.items.some(item => item.evidenceId.startsWith('current-catalog:')),
    false,
  );
}

async function testActiveActionAmbiguousTitleFailsClosed(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-inv-ev-aa-amb-'));
  const surface = trainingSurface({ title: '不存在的动作名' });
  const gameRunPath = await writeGameRun(root, surface, SOURCE_LOVE_EVENTS);
  const source = buildSource({
    gameRunPath,
    surface,
    evidenceRefs: ['entry-000001'],
  });
  await assert.rejects(
    () => buildInvestigationEvidence({ source }),
    /cannot resolve active action identity/,
  );
}

async function testActiveActionModificationWorkScopeCompatibility(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-inv-ev-aa-mw-'));
  const surface = trainingSurface({ actionId: 'action_training_basic' });
  const gameRunPath = await writeGameRun(root, surface, SOURCE_LOVE_EVENTS);
  const source = buildSource({
    gameRunPath,
    surface,
    evidenceRefs: ['entry-000001'],
  });
  const pack = await buildInvestigationEvidence({ source });
  const scope = currentProductScopeRefs(pack);

  assert.ok(scope.size >= 2);
  assert.ok(scope.has('current-action:action_training_basic'));
  assert.ok(scope.has('current-action-mechanism:action_training_basic'));
  for (const ref of scope) {
    assert.match(ref, /^current-(catalog|action)/);
  }
  assert.equal(scope.has('source-step:entry-000001'), false);
  assert.equal(scope.has('observable:entry-000001'), false);
}

function longitudinalSurface(): HeadlessApiPlayerSurfaceTrace {
  return {
    schemaVersion: 'headless-api-player-surface-source-v1',
    steps: [
      {
        sequence: 1,
        kind: 'active_action_result',
        age: 36,
        actionId: 'action_study_basic',
        presentationCards: [{ title: '读书', body: '你读了一季。', metaLines: ['学识 +2'] }],
      },
      {
        sequence: 2,
        kind: 'story_event',
        age: 37,
        storyEvent: { eventId: 'unrelated_story', title: '无关事件', text: '不应进入 longitudinal pack。' },
        presentationCards: [{ title: '无关事件', body: '仅用于边界测试。' }],
      },
      {
        sequence: 3,
        kind: 'active_action_result',
        age: 37,
        actionId: 'action_study_basic',
        presentationCards: [{ title: '读书', body: '你又读了一季。', metaLines: ['学识 +1'] }],
      },
      {
        sequence: 4,
        kind: 'active_action_result',
        age: 45,
        actionId: 'action_socializing_basic',
        presentationCards: [{ title: '交游', body: '你结交了朋友。', metaLines: ['人脉 +2'] }],
      },
      {
        sequence: 5,
        kind: 'active_action_result',
        age: 7,
        actionId: 'action_study_lite',
        presentationCards: [{ title: '听先生讲课', body: '启蒙学习。', metaLines: ['学识 +1'] }],
      },
      {
        sequence: 6,
        kind: 'active_action_result',
        age: 79,
        actionId: 'action_study_basic',
        presentationCards: [{ title: '读书', body: '你在晚年仍坚持读书。', metaLines: ['学识 +2'] }],
      },
    ],
  };
}

async function testLongitudinalEvidenceExpansion(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-inv-ev-longitudinal-'));
  const surface = longitudinalSurface();
  const gameRunPath = await writeGameRun(root, surface, SOURCE_LOVE_EVENTS);
  const source = buildSource({
    gameRunPath,
    surface,
    evidenceRefs: ['entry-000001'],
    feedbackRefs: ['overallImpression'],
  });

  const direct = await buildInvestigationEvidence({ source });
  const explicitDirect = await buildInvestigationEvidence({ source, evidenceMode: 'direct-v1' });
  assert.equal(canonicalJson(direct), canonicalJson(explicitDirect));
  assert.equal(direct.items.some(item => item.kind === 'longitudinal_action'), false);
  assert.equal(direct.items.some(item => item.kind === 'longitudinal_resource'), false);

  const longitudinal = await buildInvestigationEvidence({
    source,
    evidenceMode: 'longitudinal-v1',
  });
  assert.equal(longitudinal.schemaVersion, 'hypothesis-investigation-evidence-v2');
  assert.equal(longitudinal.evidenceMode, 'longitudinal-v1');

  const action = longitudinal.items.find(
    item => item.evidenceId === 'longitudinal-action:action_study_basic',
  );
  assert.ok(action);
  assert.equal(action?.kind, 'longitudinal_action');
  assert.deepEqual(action?.payload, {
    actionId: 'action_study_basic',
    occurrenceCount: 3,
    firstAge: 36,
    lastAge: 79,
    occurrences: [
      { sequence: 1, age: 36, observableEntryIds: ['entry-000001'] },
      { sequence: 3, age: 37, observableEntryIds: ['entry-000003'] },
      { sequence: 6, age: 79, observableEntryIds: ['entry-000006'] },
    ],
  });

  const resource = longitudinal.items.find(
    item => item.evidenceId === 'longitudinal-resource:money',
  );
  assert.ok(resource);
  assert.equal(resource?.authority, 'comparison');
  assert.equal(resource?.kind, 'longitudinal_resource');
  assert.deepEqual(resource?.payload, {
    resourceStat: 'money',
    relation: 'formal_active_action_cost',
    seedActionIds: ['action_study_basic'],
    relatedActionIds: ['action_socializing_basic', 'action_study_basic'],
    occurrences: [
      { sequence: 1, age: 36, actionId: 'action_study_basic', observableEntryIds: ['entry-000001'] },
      { sequence: 3, age: 37, actionId: 'action_study_basic', observableEntryIds: ['entry-000003'] },
      { sequence: 4, age: 45, actionId: 'action_socializing_basic', observableEntryIds: ['entry-000004'] },
      { sequence: 6, age: 79, actionId: 'action_study_basic', observableEntryIds: ['entry-000006'] },
    ],
  });

  assert.ok(longitudinal.items.some(item => item.evidenceId === 'current-action:action_socializing_basic'));
  assert.equal(
    longitudinal.items.some(item => item.evidenceId === 'current-action-mechanism:action_socializing_basic'),
    false,
  );
  assert.equal(longitudinal.items.some(item => item.evidenceId.includes('action_study_lite')), false);
  assert.equal(longitudinal.items.some(item => item.evidenceId === 'observable:entry-000002'), false);
  assert.equal(canonicalJson(longitudinal), canonicalJson(await buildInvestigationEvidence({
    source,
    evidenceMode: 'longitudinal-v1',
  })));
}

async function testLongitudinalEvidenceRunBoundary(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-inv-ev-longitudinal-boundary-'));
  const sourceSurface = longitudinalSurface();
  const gameRunPath = await writeGameRun(root, sourceSurface, SOURCE_LOVE_EVENTS);
  const otherRunPath = join(root, 'game-runs', 'other-run');
  await mkdir(join(otherRunPath, 'internal'), { recursive: true });
  await writeFile(
    join(otherRunPath, 'internal', 'player-surface-source.json'),
    canonicalJson({
      schemaVersion: 'headless-api-player-surface-source-v1',
      steps: [{
        sequence: 999,
        kind: 'active_action_result',
        age: 99,
        actionId: 'action_business_basic',
        presentationCards: [{ title: '营商', body: '另一 run。' }],
      }],
    }),
  );
  const source = buildSource({
    gameRunPath,
    surface: sourceSurface,
    evidenceRefs: ['entry-000001'],
    feedbackRefs: ['overallImpression'],
  });
  const pack = await buildInvestigationEvidence({ source, evidenceMode: 'longitudinal-v1' });
  assert.equal(canonicalJson(pack).includes('action_business_basic'), false);
}

function testEvidenceIdConflictFailsClosed(): void {
  const items: InvestigationEvidenceItem[] = [];
  appendInvestigationEvidenceItem(items, {
    evidenceId: 'conflict:test',
    authority: 'source_run',
    kind: 'source_step',
    payload: { sequence: 1 },
  });
  appendInvestigationEvidenceItem(items, {
    evidenceId: 'conflict:test',
    authority: 'source_run',
    kind: 'source_step',
    payload: { sequence: 1 },
  });
  assert.equal(items.length, 1);
  assert.throws(
    () => appendInvestigationEvidenceItem(items, {
      evidenceId: 'conflict:test',
      authority: 'comparison',
      kind: 'source_step',
      payload: { sequence: 2 },
    }),
    /evidence ID conflict/i,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHypothesisInvestigationEvidenceTests()
    .then(() => console.log('hypothesisInvestigationEvidence.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
