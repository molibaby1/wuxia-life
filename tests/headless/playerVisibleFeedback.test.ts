import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { DailyEventSystem } from '../../src/core/DailyEventSystem';
import { generateChoiceFeedback } from '../../src/core/ChoiceFeedbackGenerator';
import { buildPeriodSummary, calculatePublicStatDeltas } from '../../src/core/activePlanning/periodSummaryBuilder';
import { SeededRandomSource } from '../../src/headless/adapters/randomSource';
import { getCanonicalBirthBackground, getBirthBackgroundNarrative } from '../../src/p16/canonicalBirthBackground';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot';
import { dailyEvents } from '../../src/data/life/dailyEvents';
import {
  buildAutomaticStageOverlayCards,
  buildChoiceFeedbackOverlayCard,
  buildPeriodSummaryOverlayCards,
} from '../../src/types/progressionOverlay';
import type { EventDefinition } from '../../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function withControlledRandom<T>(value: number, run: () => T | Promise<T>): Promise<T> {
  const originalRandom = Math.random;
  Math.random = () => value;
  try {
    return await run();
  } finally {
    Math.random = originalRandom;
  }
}

function careerChoiceSnapshot(statuses: Array<'fatigued' | 'anxious'>): GameStateSnapshot {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '状态反馈测试',
    gender: 'male',
    catalogVersion: '1.0.0',
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 32;
  snapshot.state.player.statuses = [...statuses];
  snapshot.state.player.flags = { ...snapshot.state.player.flags, has_own_sect: true };
  snapshot.state.flags = { ...snapshot.state.flags, has_own_sect: true };
  snapshot.state.pendingStoryEventId = 'career_martial_innovation';
  return snapshot;
}

async function executeRestoredCareerChoice(
  statuses: Array<'fatigued' | 'anxious'>,
  choiceId: 'innovate_full' | 'innovate_suspend',
) {
  const savedSession = HeadlessEngineSessionImpl.create(
    { snapshot: careerChoiceSnapshot(statuses) },
    { random: new SeededRandomSource(801) },
  );
  const savedSnapshot = savedSession.serialize();
  const restoredSession = HeadlessEngineSessionImpl.create(
    { snapshot: savedSnapshot },
    { random: new SeededRandomSource(801) },
  );
  assert(
    restoredSession.getCurrentEvent()?.id === 'career_martial_innovation',
    'restored formal Headless session must retain the pending EventLoader event',
  );
  const before = restoredSession.serialize();
  const response = await restoredSession.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: before },
    action: { eventId: 'career_martial_innovation', choiceId },
  });
  if (response.status !== 'success') {
    throw new Error(`formal Status choice failed: ${response.error.code}`);
  }
  return response;
}

async function createDailyRecoverySession(
  status: 'fatigued' | 'anxious',
): Promise<{ session: HeadlessEngineSessionImpl; event: EventDefinition }> {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '恢复事件反馈测试',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 801,
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 50;
  snapshot.state.player.statuses = [status];
  const session = HeadlessEngineSessionImpl.create(
    { snapshot },
    { random: new SeededRandomSource(801) },
  );
  const configId = status === 'fatigued' ? 'daily_fatigue_recovery' : 'daily_anxiety_recovery';
  const config = dailyEvents.find(candidate => candidate.id === configId);
  assert(config !== undefined, `official DailyEvent config must exist: ${configId}`);
  const event = await withControlledRandom(0, () =>
    new DailyEventSystem().selectEvent(session.getRuntimeState(), [config]),
  );
  assert(event !== null, `official DailyEvent should select when ${status} exists`);
  session.applyProgressionVolatileState({
    ...session.getProgressionVolatileState(),
    pendingEphemeralStoryEvent: event,
  });
  return { session, event };
}

async function assertChoiceStatusFeedback(): Promise<void> {
    const empty = await executeRestoredCareerChoice([], 'innovate_full');
    assert(
      JSON.stringify(empty.nextSnapshot.state.player.statuses) === JSON.stringify(['anxious']),
      'innovate_full from empty statuses must retain only its unresolved anxious producer',
    );
    assert(
      empty.feedback.player.narrativeResult?.includes('状态变化：进入焦虑状态') === true &&
        !empty.feedback.player.narrativeResult.includes('疲惫'),
      'innovate_full must report anxious and must not claim newly added fatigue',
    );
    assert(
      !JSON.stringify(empty.feedback.player).includes('rawEffects'),
      'player feedback must not expose diagnostic rawEffects',
    );
    const emptyCard = buildChoiceFeedbackOverlayCard(
      'innovation-result',
      '武学创新',
      '闭关创作 (功力 +10)',
      empty.feedback,
      ['闭关创作 (功力 +10)'],
    );
    assert(emptyCard?.body === empty.feedback.player.narrativeResult, 'result card must show Status feedback');
    const martialDelta = empty.feedback.player.statImpacts.find(impact => impact.stat === 'martialPower')?.delta;
    assert(typeof martialDelta === 'number' && martialDelta > 0, 'formal choice must retain its actual martialPower gain');
    assert(
      emptyCard?.metaLines?.includes(`功力 +${martialDelta}`) === true,
      'Status feedback must preserve the actual numeric gain on the result card',
    );
    const preservedNarrative = generateChoiceFeedback({
      narrativeResult: '闭关数日，你对武学有了新的领悟。',
      effects: [],
      beforePlayer: { ...empty.nextSnapshot.state.player, statuses: [] },
      afterPlayer: empty.nextSnapshot.state.player,
    });
    assert(
      preservedNarrative.player.narrativeResult ===
        '闭关数日，你对武学有了新的领悟。 状态变化：进入焦虑状态。',
      'actual anxiety feedback must preserve the existing narrative result',
    );
    const fatigueFeedback = generateChoiceFeedback({
      narrativeResult: '你长途奔走后终于歇下。',
      effects: [],
      beforePlayer: { ...empty.nextSnapshot.state.player, statuses: [] },
      afterPlayer: { ...empty.nextSnapshot.state.player, statuses: ['fatigued'] },
    });
    assert(
      fatigueFeedback.player.narrativeResult === '你长途奔走后终于歇下。 状态变化：进入疲惫状态。',
      'generic canonical before/after feedback must still report a real fatigue change',
    );
    const effectsOnly = generateChoiceFeedback({
      effects: [{ type: 'status_add', status: 'fatigued' }],
    });
    assert(
      effectsOnly.player.narrativeResult === null,
      'Status effects without canonical before/after must not generate player feedback',
    );

    const anxiousAlreadyPresent = await executeRestoredCareerChoice(['anxious'], 'innovate_full');
    assert(
      JSON.stringify(anxiousAlreadyPresent.nextSnapshot.state.player.statuses) === JSON.stringify(['anxious']),
      'innovate_full must retain existing anxious without adding fatigue',
    );
    assert(
      anxiousAlreadyPresent.feedback.player.narrativeResult === null,
      'existing anxious must not be reported as new, and no fatigue addition may be reported',
    );
    assert(
      anxiousAlreadyPresent.feedback.player.statImpacts.some(
        impact => impact.stat === 'martialPower' && impact.delta > 0,
      ),
      'existing anxious must not change the actual martialPower reward',
    );

    const bothAlreadyPresent = await executeRestoredCareerChoice(['fatigued', 'anxious'], 'innovate_full');
    assert(
      bothAlreadyPresent.feedback.player.narrativeResult === null,
      'idempotent additions must not create false Status feedback',
    );
    assert(
      bothAlreadyPresent.feedback.player.statImpacts.some(
        impact => impact.stat === 'martialPower' && impact.delta > 0,
      ),
      'idempotent status additions must preserve the actual numeric gain',
    );

    const removedAfterRestore = await executeRestoredCareerChoice(['anxious'], 'innovate_suspend');
    assert(
      JSON.stringify(removedAfterRestore.nextSnapshot.state.player.statuses) === JSON.stringify([]),
      'restored anxious status must be removed by the formal choice',
    );
    assert(
      removedAfterRestore.feedback.player.narrativeResult === '状态变化：焦虑已解除。',
      'formal status_remove must report the actual anxiety resolution',
    );
    assert(
      removedAfterRestore.feedback.player.statImpacts.some(
        impact => impact.stat === 'knowledge' && impact.delta > 0,
      ),
      'status resolution must preserve the formal choice knowledge reward',
    );

    const removedWhenAbsent = await executeRestoredCareerChoice([], 'innovate_suspend');
    assert(
      removedWhenAbsent.feedback.player.narrativeResult === null,
      'status_remove on an absent anxious status must not claim resolution',
    );
}

async function assertDailyRecoveryResultFeedback(): Promise<void> {
  for (const status of ['fatigued', 'anxious'] as const) {
    const { session, event } = await createDailyRecoverySession(status);
    const catchUp = await session.progressAutomatic({ maxSteps: 1 });
    assert(
      !session.getRuntimeState().player.statuses.includes(status),
      `${event.id} must actually remove ${status}`,
    );
    const catchUpStage = catchUp.stageResults.find(result => result.id === event.id);
    assert(
      catchUpStage?.body === event.content.text,
      `${event.id} auto catch-up stage must retain its event text after real removal`,
    );
    const catchUpCard = buildAutomaticStageOverlayCards(catchUp.stageResults)
      .find(card => card.id === event.id);
    assert(
      catchUpCard?.body === event.content.text,
      `${event.id} auto catch-up result card must explain the actual recovery`,
    );

    const { session: standaloneSession, event: standaloneEvent } = await createDailyRecoverySession(status);
    await standaloneSession.acknowledgeProgression('story_automatic');
    const summary = standaloneSession.getProgressionVolatileState().pendingPeriodSummary;
    const standaloneStage = summary?.stageResults?.find(result => result.id === standaloneEvent.id);
    assert(
      standaloneStage?.body === standaloneEvent.content.text,
      `${standaloneEvent.id} standalone story_event result must retain actual recovery feedback`,
    );
    const standaloneCard = summary
      ? buildPeriodSummaryOverlayCards('daily-recovery', summary)
          .find(card => card.id === standaloneEvent.id)
      : undefined;
    assert(
      standaloneCard?.body === standaloneEvent.content.text,
      `${standaloneEvent.id} standalone result card must show recovery once through stageResults`,
    );
  }

  const { session: selectedSession, event } = await createDailyRecoverySession('fatigued');
  const absentSnapshot = selectedSession.serialize();
  absentSnapshot.state.player.statuses = [];
  const absentSession = HeadlessEngineSessionImpl.create(
    { snapshot: absentSnapshot },
    { random: new SeededRandomSource(801) },
  );
  absentSession.applyProgressionVolatileState({
    ...absentSession.getProgressionVolatileState(),
    pendingEphemeralStoryEvent: event,
  });
  await absentSession.acknowledgeProgression('story_automatic');
  const absentResultBody = absentSession.getProgressionVolatileState().pendingPeriodSummary?.body ?? '';
  assert(
    !absentResultBody.includes('疲惫') && !absentResultBody.includes('消退'),
    'standalone recovery event with no canonical status change must not claim recovery in API result body',
  );
}

function age14Snapshot(martialPower: number): GameStateSnapshot {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '玩家可见反馈测试',
    gender: 'male',
    catalogVersion: '1.0.0',
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 14;
  snapshot.state.player.martialPower = martialPower;
  snapshot.state.player.lifeStates.trainingHabit = 1;
  snapshot.state.player.events = [];
  snapshot.state.player.flags = {};
  snapshot.state.eventHistory = [];
  snapshot.state.flags = {};
  return snapshot;
}

async function getSectEvent(martialPower: number) {
  const session = HeadlessEngineSessionImpl.create(
    { snapshot: age14Snapshot(martialPower) },
    { random: new SeededRandomSource(1) },
  );
  await session.advanceCalendar(3, 'month');
  const next = await session.getNextEvent({ afterTimeAdvance: true });
  assert(next?.eventId === 'sect_choice', `expected sect_choice, got ${next?.eventId ?? 'none'}`);
  return { session, next };
}

export async function runPlayerVisibleFeedbackTests(): Promise<void> {
  await assertChoiceStatusFeedback();
  await assertDailyRecoveryResultFeedback();

  const automaticSession = HeadlessEngineSessionImpl.create({
    playerName: '自动结果反馈测试',
    gender: 'male',
    randomSeed: 1,
    catalogVersion: '1.0.0',
  });
  const automaticEvent = await automaticSession.getNextEvent();
  assert(automaticEvent?.isAutomatic === true, 'automatic setup event should be available');
  const automaticBeforePlayer = automaticSession.serialize().state.player;
  await automaticSession.acknowledgeProgression('story_automatic');
  const automaticAfterPlayer = automaticSession.serialize().state.player;
  const automaticSummary = automaticSession.getProgressionVolatileState().pendingPeriodSummary;
  const automaticDeltas = calculatePublicStatDeltas(automaticBeforePlayer, automaticAfterPlayer);
  const automaticStages = automaticSummary?.stageResults ?? [];
  assert(
    Object.keys(automaticStages.find(stage => stage.id === 'birth_with_phenomenon')?.deltas ?? {}).length === 0,
    'birth phenomenon event should not invent a public numeric delta',
  );
  assert(
    automaticSummary?.statDeltaSummary !== '本期未见明显数值变化' || Object.keys(automaticDeltas).length === 0,
    'automatic summary must include only actual birth/background deltas',
  );
  const originStage = automaticStages.find(stage => stage.id === 'origin_background');
  assert(originStage?.body === getBirthBackgroundNarrative(automaticSession.getRuntimeState()), 'birth narrative must derive from canonical background');
  assert(getCanonicalBirthBackground(automaticSession.getRuntimeState()) !== null, 'automatic progression must resolve canonical background');

  const originSession = HeadlessEngineSessionImpl.create({
    playerName: '出身说明测试',
    gender: 'male',
    randomSeed: 1,
    catalogVersion: '1.0.0',
  });
  let originEvent = await originSession.getNextEvent();
  for (let guard = 0; guard < 4 && originEvent?.eventId !== 'origin_background'; guard += 1) {
    assert(originEvent?.isAutomatic === true, 'origin setup should only pass automatic events');
    await originSession.progressAutomatic({ maxSteps: 1 });
    originEvent = await originSession.getNextEvent();
  }
  assert(originEvent?.eventId === 'origin_background', 'origin_background should be player-visible');
  assert(originEvent.isAutomatic === true, 'production origin resolution must be automatic');
  assert(!originEvent.event.choices?.length, 'production origin resolution must not expose independent choices');

  const eligible = await getSectEvent(15);
  const eligibleIds = (eligible.next.event.choices ?? [])
    .filter(choice => choice.available)
    .map(choice => choice.id);
  assert(
    eligibleIds.join(',') === 'join_shaolin,join_wudang,stay_home',
    'trained players must only receive Shaolin, Wudang, or stay-home choices',
  );

  const beforeChoiceSnapshot = eligible.session.serialize();
  const response = await eligible.session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: beforeChoiceSnapshot },
    action: { eventId: 'sect_choice', choiceId: 'join_shaolin' },
  });
  assert(response.status === 'success', 'sect choice should execute once');
  assert(response.responseVersion === '2.0.0', 'choice response should use response contract v2');
  assert(
    response.feedback.player.narrativeResult ===
      '你顺利拜入少林，成为一名少林弟子。在师父的指导下，你的武艺进步神速。',
    'explicit outcome text should remain the player narrative',
  );
  assert(!('fallbackUsed' in response.feedback.diagnostic), 'diagnostic must not report a narrative fallback');
  const summary = eligible.session.getProgressionVolatileState().pendingPeriodSummary;
  assert(
    summary?.body.startsWith(response.feedback.player.narrativeResult),
    'headless period body should use only explicit outcome text',
  );

  const nullNarrativeCase = await getSectEvent(15);
  const nullNarrativeChoice = nullNarrativeCase.next.raw.choices?.find(choice => choice.id === 'stay_home');
  assert(nullNarrativeChoice !== undefined, 'stay-home choice should be available for fallback hierarchy regression');
  nullNarrativeChoice.description = '独立的选项说明';
  const nullNarrativeResponse = await nullNarrativeCase.session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: nullNarrativeCase.session.serialize() },
    action: { eventId: 'sect_choice', choiceId: 'stay_home' },
  });
  assert(nullNarrativeResponse.status === 'success', 'choice without outcome text should still execute successfully');
  assert(
    nullNarrativeResponse.feedback.player.narrativeResult === null,
    'choice without outcome text must keep nullable player narrative semantics',
  );
  assert(
    nullNarrativeCase.session.getProgressionVolatileState().pendingPeriodSummary?.body?.startsWith('独立的选项说明') === true,
    'period summary must retain the independent description fallback hierarchy',
  );

  const actualDeltas = calculatePublicStatDeltas(
    beforeChoiceSnapshot.state.player,
    response.nextSnapshot.state.player,
  );
  assert(actualDeltas.martialPower !== undefined, 'sect choice should change public martial power');
  assert(
    summary?.statDeltaSummary.includes(`功力+${actualDeltas.martialPower}`) === true,
    'result card must show actual public martial delta',
  );
  assert(summary?.statDeltaSummary !== '本期未见明显数值变化', 'result card must not hide an actual public delta');
  assert(
    response.nextSnapshot.state.player.martialPower ===
      beforeChoiceSnapshot.state.player.martialPower + actualDeltas.martialPower,
    'one choice must apply the public martial delta exactly once',
  );
  assert(
    response.feedback.player.statImpacts.some(
      impact => impact.stat === 'martialPower' && impact.delta === actualDeltas.martialPower,
    ),
    'choice feedback must show the actual public martial delta',
  );

  const beforePlayer = structuredClone(response.nextSnapshot.state.player);
  const afterPlayer = structuredClone(beforePlayer);
  afterPlayer.money += 3;
  afterPlayer.connections -= 1;
  const mixedDeltas = calculatePublicStatDeltas(beforePlayer, afterPlayer);
  assert(mixedDeltas.money === undefined, 'retired wallet deltas must not appear as public period deltas');
  assert(mixedDeltas.connections === -1, 'non-money public deltas must still be calculated');

  const moneyOnlyAfter = structuredClone(beforePlayer);
  moneyOnlyAfter.money += 9;
  const moneyOnlyDeltas = calculatePublicStatDeltas(beforePlayer, moneyOnlyAfter);
  assert(Object.keys(moneyOnlyDeltas).length === 0, 'money-only before/after must produce no public delta');

  const noChangeSummary = buildPeriodSummary({
    sourceLabel: '测试',
    headline: '无变化',
    body: '结果正文存在。',
    deltas: {},
  });
  assert(noChangeSummary.statDeltaSummary === '本期未见明显数值变化', 'no public delta keeps the no-change message');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPlayerVisibleFeedbackTests()
    .then(() => console.log('playerVisibleFeedback.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
