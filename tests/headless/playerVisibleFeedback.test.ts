import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { buildPeriodSummary, calculatePublicStatDeltas } from '../../src/core/activePlanning/periodSummaryBuilder';
import { SeededRandomSource } from '../../src/headless/adapters/randomSource';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
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
  const next = await session.getNextEvent();
  assert(next?.eventId === 'sect_choice', `expected sect_choice, got ${next?.eventId ?? 'none'}`);
  return { session, next };
}

export async function runPlayerVisibleFeedbackTests(): Promise<void> {
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
  assert(
    Object.keys(automaticDeltas).length === 0,
    'birth automatic event should not invent a public numeric delta',
  );
  assert(
    automaticSummary?.statDeltaSummary === '本期未见明显数值变化',
    'automatic result card must accurately show the absence of a public numeric delta',
  );

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
  const originDescriptions = originEvent.event.choices?.map(choice => choice.description);
  assert(originDescriptions?.length === 4, 'all four origin choices must expose descriptions');
  assert(originDescriptions?.every(description => Boolean(description)), 'origin descriptions must be non-empty');
  assert(originDescriptions?.some(description => description?.includes('拳脚根基')), 'martial origin direction is visible');
  assert(originDescriptions?.some(description => description?.includes('察言观色')), 'merchant origin direction is visible');

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
