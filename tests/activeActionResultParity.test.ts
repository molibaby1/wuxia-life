import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mapSessionProgression } from '../server/src/services/sessionProgressionMapper';
import { buildActiveActionSummaryDisplay } from '../src/core/activePlanning/activeActionSummaryBuilder';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import type { ActiveActionSummaryDisplay } from '../src/types/activeActionTypes';
import type { ChoiceFeedbackModel } from '../src/types/choiceFeedback';
import * as progressionOverlay from '../src/types/progressionOverlay';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
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
    getRuntimeState: () => ({ player: { name: 'parity', age: 45, alive: true } }),
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
    diagnostic: { fallbackUsed: false, rawEffects: [] },
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

function testLocalEngineConsumesSharedBuilder(): void {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = 30;
  state.player.events = [];
  state.events = [];
  state.eventHistory = [];
  state.flags = {};
  state.player.flags = {};
  const result = engine.executeActiveAction('action_training_basic', { random: () => 0.5 });
  assert(Boolean(result?.activeActionSummary.resultExplanation?.includes('练功')), 'Local engine must expose shared result explanation');
  assert(Boolean(result?.activeActionSummary.appliedDeltaSummary?.includes('功力')), 'Local engine must expose actual public delta');
}

async function main(): Promise<void> {
  testApiMapperPreservesSharedSemantics();
  testLocalEngineConsumesSharedBuilder();
  await testHeadlessConsumesSharedBuilder();
  testBrowserConsumerRendersSharedFields();
  testProgressionEchoKeepsOnlyNewOutcomeInformation();
  testAutomaticStageResultsKeepIndependentCausesSeparate();
  await testAutomaticExecutionReturnsCausePreservingResults();
  console.log('activeActionResultParity.test.ts: Local/API/Headless/Browser parity ok');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
