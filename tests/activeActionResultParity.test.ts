import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mapSessionProgression } from '../server/src/services/sessionProgressionMapper';
import {
  applyStatDeltas,
  executeActiveActionOnState,
} from '../src/core/activePlanning/ActivePlanningService';
import { buildActiveActionSummaryDisplay } from '../src/core/activePlanning/activeActionSummaryBuilder';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { createDefaultRuntimeEventCatalog } from '../src/core/EventLoaderRuntimeCatalog';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import { calculatePublicStatDeltas } from '../src/core/activePlanning/periodSummaryBuilder';
import type { ActiveActionSummaryDisplay } from '../src/types/activeActionTypes';
import type { ChoiceFeedbackModel } from '../src/types/choiceFeedback';
import * as progressionOverlay from '../src/types/progressionOverlay';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertDeltasMatch(
  actual: Record<string, number>,
  expected: Record<string, number>,
  message: string,
): void {
  const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
  for (const key of keys) {
    assert((actual[key] ?? 0) === (expected[key] ?? 0), `${message}: ${key}`);
  }
}

function makeSummary(): ActiveActionSummaryDisplay {
  return buildActiveActionSummaryDisplay(
    {
      actionId: 'action_business_basic',
      deltas: { businessAcumen: 2, reputation: 1 },
      duration: { value: 1, unit: 'quarter' },
      metadata: {
        actionId: 'action_business_basic',
        category: 'business',
        duration: { value: 1, unit: 'quarter' },
        risk: 'medium',
        sourceKind: 'active_action',
        rewardSummary: '经营+2，名望+1',
        costSummary: '时间投入',
        riskSummary: '偶有变数',
      },
    },
    { publicDelta: { businessAcumen: 2, reputation: 1 } },
  );
}

function testApiMapperPreservesSharedSemantics(): void {
  const summary = makeSummary();
  const fakeSession = {
    getSessionPhase: () => 'action_summary',
    getNextEvent: async () => null,
    getPlanningOptions: () => [],
    getProgressionVolatileState: () => ({
      pendingActionSummary: summary,
      pendingDisturbanceNarrative: null,
      pendingPeriodSummary: null,
      passiveNarrative: null,
      annualPassiveMemory: null,
      pendingStoryEventId: null,
      pendingEphemeralStoryEvent: null,
    }),
    getRuntimeState: () => ({ player: { name: 'parity', age: 45, alive: true }, facts: {} }),
  };
  const payload = mapSessionProgression(
    fakeSession as never,
    1,
    'snapshot-1',
    null,
    {} as never,
  );
  assert(payload.activeActionSummary === summary, 'API mapper must preserve the shared summary object');
  assert(payload.activeActionSummary?.resultExplanation === summary.resultExplanation, 'API must preserve result explanation');
  assert(!('resourcePressureNotice' in summary), 'API must not expose resource notice');
}

async function testHeadlessConsumesSharedBuilder(): Promise<void> {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '结果 parity',
    gender: 'male',
    catalogVersion: '1.0.0',
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 30;
  snapshot.state.player.events = [];
  snapshot.state.eventHistory = [];
  snapshot.state.flags = {};
  snapshot.state.player.flags = {};
  const session = HeadlessEngineSessionImpl.create({ snapshot });
  assert(session.getSessionPhase() === 'active_planning', 'headless parity fixture must enter active planning');
  await session.executeActiveAction('action_training_basic');
  const summary = session.getProgressionVolatileState().pendingActionSummary;
  assert(Boolean(summary?.resultExplanation?.includes('练功')), 'Headless must expose category result explanation');
  assert(Boolean(summary?.appliedDeltaSummary?.includes('功力')), 'Headless must expose actual public delta');
}

function testBrowserConsumerRendersSharedFields(): void {
  const source = readFileSync(resolve(process.cwd(), 'src/components/GameScreen.vue'), 'utf8');
  assert(source.includes('card.body'), 'Browser must render the shared echo narrative');
  assert(source.includes('card.metaLines'), 'Browser must render public delta and long-term echo lines');
  assert(!source.includes('activeActionSummaryDisplay.rewardSummary'), 'Browser must not repeat action previews in the echo');
}

function testProgressionEchoKeepsOnlyNewOutcomeInformation(): void {
  const summary = makeSummary();
  summary.resultExplanation = '营生未能回本，银两有所损耗。';
  summary.appliedDeltaSummary = '银两 -5';
  summary.longTermImpactLines = ['营生实践有所积累'];

  const buildActiveActionOverlayCard = (
    progressionOverlay as typeof progressionOverlay & {
      buildActiveActionOverlayCard: (
        id: string,
        summary: ActiveActionSummaryDisplay,
      ) => { title: string; body?: string; metaLines?: string[] };
    }
  ).buildActiveActionOverlayCard;
  assert(
    typeof buildActiveActionOverlayCard === 'function',
    'active-action settlement must provide a shared progression echo builder',
  );

  const actionCard = buildActiveActionOverlayCard('active-action-result', summary);
  const actionText = JSON.stringify(actionCard);
  assert(actionCard.title === summary.actionName, 'stage result must identify the action the player completed');
  assert(!actionText.includes('回响'), 'stage result must not use unexplained echo terminology');
  assert(actionCard.body === summary.resultExplanation, 'echo must retain the new result narrative');
  assert(actionText.includes('银两 -5'), 'echo must retain the applied public delta');
  assert(actionText.includes('营生实践有所积累'), 'echo must retain long-term impact');
  assert(!actionText.includes(summary.rewardSummary), 'echo must not repeat the selected action reward preview');
  assert(!actionText.includes(summary.costSummary), 'echo must not repeat the selected action cost preview');
  assert(!actionText.includes(summary.riskSummary), 'echo must not repeat the selected action risk preview');
  assert(!actionText.includes(summary.nextStepHint), 'echo must not retain the old continue hint');

  const feedback: ChoiceFeedbackModel = {
    player: {
      narrativeResult: '你守住了约定，村人开始信任你。',
      statImpacts: [{ stat: 'reputation', delta: 2, visibility: 'player' }],
      relationshipImpacts: [],
      routeImpact: null,
      longTermFlags: [{ flag: 'p9_echo_business_hook', value: true, visibility: 'player' }],
      riskHints: [],
    },
    diagnostic: { rawEffects: [] },
  };
  const choiceCard = progressionOverlay.buildChoiceFeedbackOverlayCard(
    'choice-result',
    '出身背景',
    '武林世家',
    feedback,
  );
  const choiceText = JSON.stringify(choiceCard);
  assert(choiceCard?.title === '出身背景', 'choice result must identify the completed stage');
  assert(choiceText.includes('选择：武林世家'), 'choice result must identify the selected option');
  assert(!choiceText.includes('回响'), 'choice result must not use unexplained echo terminology');
  assert(choiceText.includes('你守住了约定'), 'choice echo must retain the new result narrative');
  assert(choiceText.includes('名望 +2'), 'choice echo must retain the public delta');
  assert(choiceText.includes('营生方向已被记住'), 'choice echo must retain the long-term impact');

  const duplicateNarrativeCard = progressionOverlay.buildChoiceFeedbackOverlayCard(
    'duplicate-choice-result',
    '出身背景',
    '武林世家',
    feedback,
    ['你守住了约定，村人开始信任你。'],
  );
  assert(Boolean(duplicateNarrativeCard), 'choice echo must keep public outcomes when duplicate narrative is removed');
  assert(
    duplicateNarrativeCard?.body === undefined,
    'choice echo must omit narrative that repeats the selected choice content',
  );
  assert(
    duplicateNarrativeCard?.metaLines?.includes('名望 +2') === true,
    'choice echo must retain public delta after duplicate narrative is removed',
  );

  const periodCard = progressionOverlay.buildPeriodSummaryOverlayCard(
    'period-result',
    {
      sourceLabel: '童年岁月',
      headline: '初识马步',
      body: '父亲教你扎马步。',
      statDeltaSummary: '因「初识马步」：体魄+1',
      narrativeText: '父亲教你扎马步。（因「初识马步」，体魄+1）',
    },
  );
  assert(periodCard.title === '初识马步', 'single-path result must identify the completed stage');
  assert(periodCard.body === undefined, 'single-path result must not repeat the narrative just read');
  assert(periodCard.metaLines?.includes('体魄 +1') === true, 'single-path result must retain its actual delta');
}

function testAutomaticStageResultsKeepIndependentCausesSeparate(): void {
  const buildAutomaticStageOverlayCards = (
    progressionOverlay as typeof progressionOverlay & {
      buildAutomaticStageOverlayCards?: (
        results: Array<{
          id: string;
          title: string;
          body?: string;
          deltas: Record<string, number>;
        }>,
      ) => Array<{ title: string; body?: string; metaLines?: string[] }>;
    }
  ).buildAutomaticStageOverlayCards;

  assert(
    typeof buildAutomaticStageOverlayCards === 'function',
    'automatic settlement must expose a cause-preserving overlay builder',
  );

  const cards = buildAutomaticStageOverlayCards!([
    {
      id: 'daily_copybook_practice_pos_1',
      title: '临帖抄书',
      deltas: { knowledge: 1 },
    },
    {
      id: 'injury_accident',
      title: '意外受伤',
      body: '天有不测风云，你在一次意外中受了伤',
      deltas: { constitution: -5, martialPower: -3 },
    },
  ]);

  assert(cards.length === 2, 'independent event and setback must render as two result cards');
  assert(cards[0]?.title === '临帖抄书', 'the first card must retain the completed event cause');
  assert(cards[0]?.metaLines?.includes('学识 +1') === true, 'the event card must retain only its own gain');
  assert(cards[0]?.metaLines?.includes('体魄 -5') !== true, 'the event card must not absorb setback losses');
  assert(cards[1]?.title === '意外受伤', 'the setback card must name the independent setback');
  assert(cards[1]?.body?.includes('意外中受了伤') === true, 'the setback card must explain what happened');
  assert(cards[1]?.metaLines?.includes('体魄 -5') === true, 'the setback card must retain its own loss');
  assert(cards[1]?.metaLines?.includes('功力 -3') === true, 'the setback card must retain its own loss');
}

async function testAutomaticExecutionReturnsCausePreservingResults(): Promise<void> {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = 10;
  state.player.martialPower = 10;
  state.player.constitution = 10;
  state.player.knowledge = 10;
  state.eventHistory = [];
  state.flags = {};

  const originalRandom = Math.random;
  const rolls = [0, 0.99, 0.99, 0.99, 0.99, 0.99];
  Math.random = () => rolls.shift() ?? 0.99;
  try {
    const result = await engine.executeAutoEvent({
      id: 'daily_copybook_practice_pos_1',
      version: '1.0.0',
      category: 'daily_event',
      priority: 1,
      triggers: [],
      content: {
        title: '临帖抄书',
        text: '你伏案抄书，渐渐读出了其中意味。',
        description: '你伏案抄书，渐渐读出了其中意味。',
      },
      eventType: 'auto',
      autoEffects: [
        { type: 'stat_modify', target: 'knowledge', value: 1, operator: 'add' },
      ],
    } as never);
    const stageResults = (result as unknown as {
      stageResults?: Array<{ title: string; deltas: Record<string, number> }>;
    }).stageResults;

    assert(stageResults?.length === 2, 'engine must return the event and triggered setback separately');
    assert(stageResults?.[0]?.title === '临帖抄书', 'engine must retain the automatic event cause');
    assert(stageResults?.[0]?.deltas.knowledge === 1, 'event result must contain its own gain');
    assert(stageResults?.[0]?.deltas.constitution === undefined, 'event result must exclude setback loss');
    assert(stageResults?.[1]?.title === '意外受伤', 'engine must expose the triggered setback cause');
    assert(stageResults?.[1]?.deltas.constitution === -5, 'setback result must contain its own constitution loss');
    assert(stageResults?.[1]?.deltas.martialPower === -3, 'setback result must contain its own martial loss');
  } finally {
    Math.random = originalRandom;
  }
}

function testSharedEngineConsumesSharedBuilder(): void {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = 30;
  state.player.events = [];
  state.events = [];
  state.eventHistory = [];
  state.flags = {};
  state.player.flags = {};
  const result = engine.executeActiveAction('action_training_basic', { random: () => 0.5 });
  assert(Boolean(result?.activeActionSummary.resultExplanation?.includes('练功')), 'GameEngineIntegration must expose shared result explanation');
  assert(Boolean(result?.activeActionSummary.appliedDeltaSummary?.includes('功力')), 'GameEngineIntegration must expose actual public delta');
}

function testActiveActionRecordsOnlyAppliedCharismaDeltas(): void {
  const run = (charisma: number, random: () => number) => {
    const engine = new GameEngineIntegration();
    const state = engine.getGameState();
    state.player.age = 30;
    state.player.charisma = charisma;
    state.player.connections = 20;
    state.actionHistory = [];
    state.eventHistory = [];
    const beforeTime = { ...state.currentTime! };
    const beforePlayer = { ...state.player };
    const beforeCharisma = state.player.charisma;
    const result = executeActiveActionOnState(state, 'action_socializing_basic', {
      random,
      includeDisturbance: false,
    });
    assert(result !== null, 'socializing remains available at the charisma cap');
    const actualPublicDelta = calculatePublicStatDeltas(beforePlayer, state.player);
    assertDeltasMatch(result!.actionResult.deltas, actualPublicDelta, 'ActionResult must match canonical before/after');
    assertDeltasMatch(
      state.actionHistory?.at(-1)?.deltas ?? {},
      actualPublicDelta,
      'action history must match canonical before/after',
    );
    return { state, beforeCharisma, beforeTime, result: result! };
  };

  const ordinary = run(90, () => 0);
  assert(ordinary.state.player.charisma === 91, 'charisma 90 keeps its normal +1 growth');
  assert(ordinary.result.actionResult.deltas.charisma === 1, 'ActionResult records ordinary applied growth');

  const nearlyFull = run(99, () => 0.99);
  assert(nearlyFull.state.player.charisma === 100, 'charisma 99 caps at 100 when rolled reward exceeds room');
  assert(nearlyFull.result.actionResult.deltas.charisma === 1, 'ActionResult records only the remaining +1');
  assert(nearlyFull.state.actionHistory?.at(-1)?.deltas.charisma === 1, 'action history records the applied +1');
  assert(nearlyFull.result.actionResult.metadata.rewardSummary.includes('魅力+1'), 'result reward summary uses actual +1');
  assert(nearlyFull.result.activeActionSummary.appliedDeltaSummary?.includes('魅力+1') === true, 'applied summary uses actual +1');
  assert(nearlyFull.result.activeActionSummary.resultExplanation?.includes('魅力+1') === true, 'result explanation uses actual +1');
  assert(nearlyFull.result.feedbackText.includes('魅力+1'), 'completion feedback uses actual +1');
  assert(!nearlyFull.result.feedbackText.includes('魅力+3'), 'completion feedback omits rolled-away growth');

  const full = run(100, () => 0);
  const actualCharismaDelta = full.state.player.charisma - full.beforeCharisma;
  const summaryText = `${full.result.actionResult.metadata.rewardSummary} ${full.result.activeActionSummary.appliedDeltaSummary} ${full.result.activeActionSummary.resultExplanation}`;
  assert(full.state.player.charisma === 100, 'charisma 100 stays capped after socializing');
  assert(actualCharismaDelta === 0, 'full charisma has no applied charisma growth');
  assert(full.result.actionResult.deltas.charisma === undefined, 'ActionResult omits the capped zero delta');
  assert(full.state.actionHistory?.at(-1)?.deltas.charisma === undefined, 'history omits the capped zero delta');
  assert(!summaryText.includes('魅力'), 'active result summary must not report theoretical charisma growth');
  assert(!full.result.feedbackText.includes('魅力'), 'completion feedback must not report theoretical charisma growth');
  assert(
    JSON.stringify(full.state.currentTime) !== JSON.stringify(full.beforeTime),
    'a zero applied charisma delta must not cancel time progression',
  );
  assert(full.state.actionHistory?.length === 1, 'a zero applied charisma delta must still record the action');
}

function testSharedStatWriterKeepsOtherAttributeSemantics(): void {
  const engine = new GameEngineIntegration();
  const player = engine.getGameState().player;
  player.charisma = 0;
  player.chivalry = 0;
  player.reputation = 0;
  player.connections = 0;
  player.knowledge = 0;

  const applied = applyStatDeltas(player, {
    charisma: 200,
    chivalry: -5,
    reputation: 150,
    connections: 150,
    knowledge: 150,
  });

  assert(player.charisma === 100 && applied.charisma === 100, 'charisma is capped at 100');
  assert(player.chivalry === -5 && applied.chivalry === -5, 'chivalry continues to allow negative values');
  assert(player.reputation === 150, 'reputation remains without a fixed upper cap');
  assert(player.connections === 150, 'connections remain without a fixed upper cap');
  assert(player.knowledge === 150, 'knowledge remains without a fixed upper cap');

  const lowerBoundApplied = applyStatDeltas(player, { charisma: -250 });
  assert(player.charisma === 0 && lowerBoundApplied.charisma === -100, 'charisma is also capped at 0');
}

async function testMarriageLoveChoiceUsesSharedCharismaBoundary(): Promise<void> {
  const engine = new GameEngineIntegration();
  const player = engine.getGameState().player;
  player.age = 25;
  player.charisma = 99;
  player.chivalry = 0;

  await engine.executeChoiceEffects([], 'marriage_choice', 'love');

  const state = engine.getGameState();
  assert(state.player.charisma === 100, 'marriage love choice must not exceed the charisma cap');
  assert(state.player.chivalry === 5, 'marriage love choice must preserve its chivalry increase');
  assert(state.criticalChoices?.marriage_choice === 'love', 'marriage love choice fact remains recorded');
}

async function testMedicalPositiveCharismaEffectsRemainZeroDeltaAtCap(): Promise<void> {
  const catalog = createDefaultRuntimeEventCatalog();
  const cases = [
    { eventId: 'medical_imperial_doctor', choiceId: 'medical_imperial_doctor_choice_1', stat: 'reputation' as const, delta: 30 },
    { eventId: 'medical_palace_intrigue', choiceId: 'medical_palace_intrigue_choice_1', stat: 'chivalry' as const, delta: 5 },
  ];

  for (const item of cases) {
    const event = catalog.getEventById(item.eventId);
    const choice = event?.choices?.find(candidate => candidate.id === item.choiceId);
    assert(choice !== undefined, `${item.eventId} keeps its selected Medical choice`);
    const engine = new GameEngineIntegration();
    const player = engine.getGameState().player;
    player.charisma = 100;
    player[item.stat] = 10;
    const before = { ...player };

    await engine.executeChoiceEffects(choice!.effects ?? [], item.eventId, item.choiceId);

    const after = engine.getGameState().player;
    assert(after.charisma === 100, `${item.eventId} positive charisma effect stays at 100`);
    assert(after.charisma - before.charisma === 0, `${item.eventId} produces no false negative charisma delta`);
    assert(after[item.stat] - before[item.stat] === item.delta, `${item.eventId} preserves its other positive effect`);
    assert(
      calculatePublicStatDeltas(before, after).charisma === undefined,
      `${item.eventId} public delta does not report a charisma decrease`,
    );
    if (item.eventId === 'medical_imperial_doctor') {
      assert(engine.getGameState().flags?.medical_imperial === true, 'imperial doctor choice keeps its route flag');
    }
  }
}

async function testHeadlessAtCharismaCapExposesOnlyActualActionOutcome(): Promise<void> {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '魅力边界 parity',
    gender: 'female',
    catalogVersion: '1.0.0',
    randomSeed: 803,
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 30;
  snapshot.state.player.charisma = 100;
  snapshot.state.player.events = [];
  snapshot.state.eventHistory = [];
  snapshot.state.actionHistory = [];
  snapshot.state.flags = {};
  snapshot.state.player.flags = {};
  const session = HeadlessEngineSessionImpl.create({ snapshot });

  assert(session.getSessionPhase() === 'active_planning', 'capped Headless fixture enters active planning');
  await session.executeActiveAction('action_socializing_basic');

  const after = session.serialize().state;
  const volatile = session.getProgressionVolatileState();
  const history = after.actionHistory?.at(-1);
  const summaryText = `${volatile.pendingActionSummary?.appliedDeltaSummary} ${volatile.pendingActionSummary?.resultExplanation}`;
  assert(after.player.charisma === 100, 'Headless state remains at the charisma cap');
  assert(history?.deltas.charisma === undefined, 'Headless action history omits unapplied charisma growth');
  assert(!summaryText.includes('魅力'), 'Headless action summary reports only applied public deltas');
  assert(!String(volatile.lastOutcomeText).includes('魅力'), 'Headless completion feedback reports only applied rewards');

  const apiPayload = mapSessionProgression({
    getSessionPhase: () => 'action_summary',
    getNextEvent: async () => null,
    getPlanningOptions: () => [],
    getProgressionVolatileState: () => volatile,
    getRuntimeState: () => session.getRuntimeState(),
  } as never, 1, 'charisma-cap-snapshot', null, {} as never);
  assert(
    apiPayload.activeActionSummary === volatile.pendingActionSummary,
    'API preserves the actual Headless action summary',
  );
  assert(
    !String(apiPayload.activeActionSummary?.resultExplanation).includes('魅力'),
    'API action summary does not expose the unapplied charisma reward',
  );
}

async function main(): Promise<void> {
  testApiMapperPreservesSharedSemantics();
  testSharedEngineConsumesSharedBuilder();
  testActiveActionRecordsOnlyAppliedCharismaDeltas();
  testSharedStatWriterKeepsOtherAttributeSemantics();
  await testMarriageLoveChoiceUsesSharedCharismaBoundary();
  await testMedicalPositiveCharismaEffectsRemainZeroDeltaAtCap();
  await testHeadlessAtCharismaCapExposesOnlyActualActionOutcome();
  await testHeadlessConsumesSharedBuilder();
  testBrowserConsumerRendersSharedFields();
  testProgressionEchoKeepsOnlyNewOutcomeInformation();
  testAutomaticStageResultsKeepIndependentCausesSeparate();
  await testAutomaticExecutionReturnsCausePreservingResults();
  console.log('activeActionResultParity.test.ts: shared-engine/API/Headless/Web consumer coverage ok');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
