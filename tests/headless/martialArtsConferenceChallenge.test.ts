import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { eventLoader } from '../../src/core/EventLoader';
import { calculateFailureProbabilityForEvent } from '../../src/core/ChallengeSystem';
import { resolveChoiceEffects } from '../../src/core/ChoiceOutcomeResolver';
import { difficultyManager } from '../../src/core/DifficultyManager';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import { SeededRandomSource, withRandomSourceSync } from '../../src/headless/adapters/randomSource';
import type { EventChoice, EventDefinition } from '../../src/types/eventTypes';
import type { GameProcessRecord } from '../../src/types/simulationRecordTypes';

const EVENT_ID = 'career_martial_arts_conference';
const CHOICE_ID = 'career_martial_arts_conference_choice_1';

interface CountingRandomSource {
  calls: number;
  next(): number;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function fixedRandom(value: number): CountingRandomSource {
  return {
    calls: 0,
    next() {
      this.calls += 1;
      return value;
    },
  };
}

function getTournamentEvent(): EventDefinition {
  const event = eventLoader.getEventById(EVENT_ID);
  assert(event !== undefined, '武林大会事件必须存在');
  return event;
}

function createTournamentSession(random: CountingRandomSource | SeededRandomSource, age = 35) {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '武林大会挑战测试',
    gender: 'male',
    randomSeed: 801,
    catalogVersion: '1.0.0',
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = age;
  snapshot.state.player.martialPower = 80;
  snapshot.state.player.knowledge = 40;
  snapshot.state.player.reputation = 20;
  snapshot.state.player.traits = [];
  snapshot.state.pendingStoryEventId = EVENT_ID;
  const session = HeadlessEngineSessionImpl.create(
    { snapshot },
    { random },
  );
  assert(session.getCurrentEvent()?.id === EVENT_ID, 'Headless 必须装载待结算的武林大会事件');
  return session;
}

async function executeTournamentChoice(
  choiceId: string,
  random: CountingRandomSource | SeededRandomSource,
  age = 35,
) {
  const session = createTournamentSession(random, age);
  const randomCallsBeforeChoice = 'calls' in random ? random.calls : undefined;
  const stateBefore = JSON.parse(JSON.stringify(session.getRuntimeState())) as ReturnType<typeof session.getRuntimeState>;
  const before = session.serialize();
  const response = await session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: before },
    action: { eventId: EVENT_ID, choiceId },
  });
  assert(response.status === 'success', '武林大会选择必须通过正式 Headless 入口结算');
  return {
    response,
    session,
    stateBefore,
    randomCallsUsed: randomCallsBeforeChoice === undefined ? undefined : random.calls - randomCallsBeforeChoice,
  };
}

function reputationDelta(response: Awaited<ReturnType<typeof executeTournamentChoice>>['response']): number {
  return response.feedback.player.statImpacts.find(impact => impact.stat === 'reputation')?.delta ?? 0;
}

async function assertChallengeBranchesAndHeadlessFeedback(): Promise<void> {
  const failureRandom = fixedRandom(0);
  const failed = await executeTournamentChoice(CHOICE_ID, failureRandom);
  assert(reputationDelta(failed.response) === -10, '挑战失败必须实际扣除 10 点声望');
  assert(
    failed.response.feedback.player.narrativeResult?.includes('未能') === true,
    '失败反馈必须明确说明比武失利',
  );
  assert(
    failed.response.nextSnapshot.state.player.reputation === 10,
    '失败结果必须反映在 canonical after 状态中',
  );
  assert(
    failed.response.nextSnapshot.state.eventHistory.filter(record => record.eventId === EVENT_ID).length === 1,
    '失败结算只能写入一条武林大会事件历史',
  );
  assert(failed.randomCallsUsed === 1, '正式挑战分支只能进行一次受控随机判定');

  const successRandom = fixedRandom(0.99);
  const succeeded = await executeTournamentChoice(CHOICE_ID, successRandom);
  assert(
    reputationDelta(succeeded.response) === 50,
    `挑战成功必须实际增加 50 点声望，实际为 ${reputationDelta(succeeded.response)}`,
  );
  assert(
    succeeded.response.feedback.player.narrativeResult?.includes('胜出') === true,
    '成功反馈必须明确说明比武获胜',
  );
  assert(
    succeeded.response.nextSnapshot.state.player.reputation === 70,
    '成功结果必须反映在 canonical after 状态中',
  );
  assert(
    succeeded.response.nextSnapshot.state.eventHistory.filter(record => record.eventId === EVENT_ID).length === 1,
    '成功结算只能写入一条武林大会事件历史',
  );
  assert(succeeded.randomCallsUsed === 1, '成功分支也只能进行一次受控随机判定');

  const firstReplay = await executeTournamentChoice(CHOICE_ID, new SeededRandomSource(20261011));
  const secondReplay = await executeTournamentChoice(CHOICE_ID, new SeededRandomSource(20261011));
  assert(
    reputationDelta(firstReplay.response) === reputationDelta(secondReplay.response) &&
      firstReplay.response.feedback.player.narrativeResult === secondReplay.response.feedback.player.narrativeResult,
    '同一固定 seed 必须复现相同挑战结果与叙事',
  );
}

async function assertOtherChoicesDoNotRoll(): Promise<void> {
  const event = getTournamentEvent();
  for (const [choiceId, expectedDeltas] of [
    ['career_martial_arts_conference_choice_2', { martialPower: 5 }],
    ['career_martial_arts_conference_choice_3', { connections: 15, reputation: 8 }],
  ] as const) {
    const random = fixedRandom(0.55);
    const session = createTournamentSession(random);
    const beforeCalls = random.calls;
    const before = session.serialize();
    const response = await session.executeChoice({
      requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
      snapshotRef: { snapshot: before },
      action: { eventId: EVENT_ID, choiceId },
    });
    assert(response.status === 'success', `${choiceId} 必须保持正常结算`);
    assert(random.calls === beforeCalls, `${choiceId} 未配置 challenge，不得额外抽签`);
    for (const [stat, expected] of Object.entries(expectedDeltas)) {
      assert(
        response.feedback.player.statImpacts.find(impact => impact.stat === stat)?.delta === expected,
        `${choiceId} 的 ${stat} 变化必须保持 ${expected}`,
      );
    }
  }

  const ordinaryChoice = event.choices?.find(choice => choice.id === 'career_martial_arts_conference_choice_2');
  assert(ordinaryChoice !== undefined, '观摩选择必须存在');
  const ordinaryRandom = fixedRandom(0.55);
  const ordinaryResolved = withRandomSourceSync(ordinaryRandom, () =>
    resolveChoiceEffects(
      createTournamentSession(fixedRandom(0.55)).getRuntimeState(),
      event,
      ordinaryChoice,
    ),
  );
  assert(ordinaryResolved?.effects[0]?.type === 'stat_modify', '普通 Choice 仍直接解析原有合法效果');
  assert(ordinaryRandom.calls === 0, '普通 Choice 的共享解析不得消耗挑战随机数');
}

async function assertChallengeUsesCurrentSceneRules(): Promise<void> {
  const event = getTournamentEvent();
  const choice = event.choices?.find(candidate => candidate.id === CHOICE_ID);
  assert(choice !== undefined, '比武选择必须存在');
  const oldCoefficient = difficultyManager.config.failureProbabilityCoefficient;
  const resolveAt = (martialPower: number, knowledge: number, coefficient: number) => {
    difficultyManager.config.failureProbabilityCoefficient = coefficient;
    const state = createTournamentSession(fixedRandom(0.55)).getRuntimeState();
    state.player!.martialPower = martialPower;
    state.player!.knowledge = knowledge;
    return withRandomSourceSync(fixedRandom(0.55), () => resolveChoiceEffects(state, event, choice));
  };

  try {
    const qualified = resolveAt(80, 40, 1.0);
    const lowMartialPower = resolveAt(0, 40, 1.0);
    const lowKnowledge = resolveAt(80, 0, 1.0);
    const harderDifficulty = resolveAt(80, 40, 1.5);
    assert(qualified?.outcomeId?.includes('success') === true, '合格功力与学识在 55% 抽签下应通过基础场景');
    assert(lowMartialPower?.outcomeId?.includes('failure') === true, '功力不足仍应提高现有场景的失败率');
    assert(lowKnowledge?.outcomeId?.includes('failure') === true, '学识不足仍应提高现有场景的失败率');
    assert(harderDifficulty?.outcomeId?.includes('failure') === true, '当前难度系数仍应影响挑战判定');
  } finally {
    difficultyManager.config.failureProbabilityCoefficient = oldCoefficient;
  }
}

async function assertReplayUsesRecordedChallengeResult(): Promise<void> {
  const previousTestMode = difficultyManager.config.testModeEnabled;
  difficultyManager.config.testModeEnabled = false;
  try {
    const event = getTournamentEvent();
    const choice = event.choices?.find(candidate => candidate.id === CHOICE_ID);
    assert(choice?.challenge !== undefined, '比武选择必须显式声明挑战分支');

    for (const scenario of [
      { originalRoll: 0, replayRoll: 0.99, expectedDelta: -10, branch: 'failure' },
      { originalRoll: 0.99, replayRoll: 0, expectedDelta: 50, branch: 'success' },
    ] as const) {
      const original = await executeTournamentChoice(CHOICE_ID, fixedRandom(scenario.originalRoll), 50);
      const originalDelta = reputationDelta(original.response);
      assert(originalDelta === scenario.expectedDelta, `原始 ${scenario.branch} 结算必须产生 ${scenario.expectedDelta} 点声望变化`);
      const outcomeText = original.response.feedback.player.narrativeResult;
      assert(typeof outcomeText === 'string' && outcomeText.length > 0, '原始挑战结果必须记录胜败叙事');

      const record: GameProcessRecord = {
        age: original.stateBefore.player!.age,
        eventId: EVENT_ID,
        eventTitle: event.content?.title ?? EVENT_ID,
        eventText: event.content?.text,
        eventType: 'choice',
        selectedChoice: choice,
        outcomeText,
        gameState: original.stateBefore,
        timestamp: new Date(0).toISOString(),
      };
      const replayRandom = fixedRandom(scenario.replayRoll);
      const replaySession = HeadlessEngineSessionImpl.createForReplay(
        { catalogVersion: '1.0.0' },
        { random: replayRandom },
      );
      const replay = await replaySession.replaySimulatorRecords(
        { playerName: '武林大会回放测试', gender: 'male' },
        [record],
      );

      assert(
        replay.finalState.player?.reputation === original.response.nextSnapshot.state.player.reputation,
        `回放必须复用已记录的 ${scenario.branch} 分支效果`,
      );
      assert(
        replay.finalState.eventHistory.filter(entry => entry.eventId === EVENT_ID).length === 1,
        `回放 ${scenario.branch} 分支只能结算并记录一次`,
      );
      assert(replay.outcomeTexts[0] === outcomeText, `回放必须保留原始 ${scenario.branch} 叙事`);
      assert(replayRandom.calls === 0, `回放 ${scenario.branch} 结果不得重新抽签`);
    }
  } finally {
    difficultyManager.config.testModeEnabled = previousTestMode;
  }
}

function assertTestModeMultiplierMatchesChallengeSystem(): void {
  const event = getTournamentEvent();
  const choice = event.choices?.find(candidate => candidate.id === CHOICE_ID);
  assert(choice !== undefined, '比武选择必须存在');
  const state = createTournamentSession(fixedRandom(0.6)).getRuntimeState();
  const eventWithChallengeScene: EventDefinition = {
    ...event,
    challengeScene: { sceneId: 'martial_arts_tournament', enableFailureCheck: true },
  };
  const oldTestMode = difficultyManager.config.testModeEnabled;
  const oldCoefficient = difficultyManager.config.failureProbabilityCoefficient;
  try {
    difficultyManager.config.testModeEnabled = true;
    difficultyManager.config.failureProbabilityCoefficient = 1.0;
    const eventCheck = withRandomSourceSync(fixedRandom(0.6), () =>
      calculateFailureProbabilityForEvent(eventWithChallengeScene, state.player!),
    );
    const choiceResult = withRandomSourceSync(fixedRandom(0.6), () =>
      resolveChoiceEffects(state, event, choice),
    );
    assert(eventCheck?.testModeMultiplier === 1.5 && eventCheck.isFailed, 'ChallengeSystem 事件路径必须使用测试模式 1.5 倍倍率');
    assert(choiceResult?.outcomeId === choice.challenge?.failure.id, 'Choice Challenge 必须与 ChallengeSystem 事件路径采用相同测试倍率');
  } finally {
    difficultyManager.config.testModeEnabled = oldTestMode;
    difficultyManager.config.failureProbabilityCoefficient = oldCoefficient;
  }
}

async function assertInvalidSceneFailsClosed(): Promise<void> {
  for (const sceneId of ['', 'missing-challenge-scene', '__proto__']) {
    const event = structuredClone(getTournamentEvent());
    const choice = event.choices?.find(candidate => candidate.id === CHOICE_ID) as
      | (EventChoice & { challenge?: { sceneId?: string } })
      | undefined;
    assert(choice !== undefined, '比武选择必须存在');
    const challenge = choice.challenge;
    assert(challenge !== undefined, '比武选择必须显式声明挑战场景');
    challenge.sceneId = sceneId;
    const state = createTournamentSession(fixedRandom(0.5)).getRuntimeState();
    const reputationBefore = state.player!.reputation;
    const random = fixedRandom(0.5);
    let error: unknown;
    try {
      withRandomSourceSync(random, () => resolveChoiceEffects(state, event, choice));
    } catch (caught) {
      error = caught;
    }
    assert(error instanceof Error && error.message.includes('challenge scene'), '缺失或无效场景必须明确报错');
    assert(random.calls === 0, '缺失或无效场景必须在抽签前失败');
    assert(state.player!.reputation === reputationBefore, '缺失或无效场景不得执行任一奖励效果');
  }
}

export async function runMartialArtsConferenceChallengeTests(): Promise<void> {
  await assertChallengeBranchesAndHeadlessFeedback();
  await assertOtherChoicesDoNotRoll();
  await assertChallengeUsesCurrentSceneRules();
  await assertReplayUsesRecordedChallengeResult();
  assertTestModeMultiplierMatchesChallengeSystem();
  await assertInvalidSceneFailsClosed();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMartialArtsConferenceChallengeTests()
    .then(() => console.log('martialArtsConferenceChallenge.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
