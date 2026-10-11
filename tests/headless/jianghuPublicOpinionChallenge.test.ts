import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { getChallengeScene } from '../../src/data/challengeScenes';
import { eventLoader } from '../../src/core/EventLoader';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import type { EventChoice, EventDefinition, PlayerState } from '../../src/types/eventTypes';
import type { GameProcessRecord } from '../../src/types/simulationRecordTypes';

const EVENT_ID = 'jianghu_public_enemy';
const INVESTIGATE_CHOICE_ID = 'investigate_truth';
const CHALLENGE_CHOICE_ID = 'accept_public_challenge';
const IGNORE_CHOICE_ID = 'ignore_rumors';
const SCENE_ID = 'jianghu_open_challenge';
const SUCCESS_OUTCOME_ID = 'jianghu_public_enemy_challenge_success';
const FAILURE_OUTCOME_ID = 'jianghu_public_enemy_challenge_failure';

const CORE_STATS = [
  'martialPower',
  'constitution',
  'knowledge',
  'connections',
  'reputation',
  'chivalry',
] as const;

type CoreStat = (typeof CORE_STATS)[number];

interface CountingRandomSource {
  calls: number;
  next(): number;
}

function assert(condition: boolean, message: string): asserts condition {
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

function getPublicOpinionEvent(): EventDefinition {
  const event = eventLoader.getEventById(EVENT_ID);
  assert(event !== undefined, '正式事件目录必须装载江湖非议事件');
  return event;
}

function getChoice(choiceId: string): EventChoice {
  const choice = getPublicOpinionEvent().choices?.find(candidate => candidate.id === choiceId);
  assert(choice !== undefined, `正式事件必须包含 ${choiceId}`);
  return choice;
}

function createSession(random: CountingRandomSource) {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '江湖非议挑战测试',
    gender: 'male',
    randomSeed: 816,
    catalogVersion: '1.0.0',
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 50;
  snapshot.state.player.martialPower = 100;
  snapshot.state.player.constitution = 60;
  snapshot.state.player.knowledge = 50;
  snapshot.state.player.connections = 20;
  snapshot.state.player.reputation = 60;
  snapshot.state.player.chivalry = 30;
  snapshot.state.player.traits = [];
  snapshot.state.pendingStoryEventId = EVENT_ID;

  const session = HeadlessEngineSessionImpl.create({ snapshot }, { random });
  assert(session.getCurrentEvent()?.id === EVENT_ID, '正式 Headless Choice 入口必须装载江湖非议事件');
  return session;
}

async function submitChoice(session: ReturnType<typeof createSession>, choiceId: string) {
  return session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: session.serialize() },
    action: { eventId: EVENT_ID, choiceId },
  });
}

async function executeChoice(choiceId: string, random: CountingRandomSource) {
  const session = createSession(random);
  const stateBefore = JSON.parse(JSON.stringify(session.getRuntimeState())) as ReturnType<
    typeof session.getRuntimeState
  >;
  const callsBefore = random.calls;
  const response = await submitChoice(session, choiceId);
  return {
    response,
    stateBefore,
    randomCallsUsed: random.calls - callsBefore,
  };
}

function impactDelta(
  response: Awaited<ReturnType<typeof executeChoice>>['response'],
  stat: CoreStat,
): number {
  return response.feedback.player.statImpacts.find(impact => impact.stat === stat)?.delta ?? 0;
}

function assertFeedbackMatchesCanonicalState(
  result: Awaited<ReturnType<typeof executeChoice>>,
): void {
  const before = result.stateBefore.player as PlayerState;
  const after = result.response.nextSnapshot.state.player;
  for (const stat of CORE_STATS) {
    assert(
      impactDelta(result.response, stat) === after[stat] - before[stat],
      `${stat} 的公开变化必须与 canonical before/after 一致`,
    );
  }
}

function assertOnlyPlayerStatChanges(
  result: Awaited<ReturnType<typeof executeChoice>>,
  expectedStat?: CoreStat,
  expectedDelta = 0,
): void {
  const before = result.stateBefore.player as PlayerState;
  const after = result.response.nextSnapshot.state.player;
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (key === expectedStat) {
      const stat = expectedStat;
      assert(after[stat] - before[stat] === expectedDelta, `${stat} 的变化必须为 ${expectedDelta}`);
      continue;
    }
    assert(
      JSON.stringify(before[key as keyof PlayerState]) === JSON.stringify(after[key as keyof PlayerState]),
      `本选择不得改动未批准的人物状态字段 ${key}`,
    );
  }
}

function assertKarmaUnchanged(
  result: Awaited<ReturnType<typeof executeChoice>>,
): void {
  assert(
    JSON.stringify(result.response.nextSnapshot.state.karma) === JSON.stringify(result.stateBefore.karma),
    '本事件的任何选择都不得自动改变 Karma',
  );
}

function assertEventRecorded(
  result: Awaited<ReturnType<typeof executeChoice>>,
): void {
  assert(
    result.response.nextSnapshot.state.eventHistory.filter(record => record.eventId === EVENT_ID).length === 1,
    '每次正式选择只能记录一条本事件历史',
  );
}

function assertCatalogAndProductSemantics(): void {
  const event = getPublicOpinionEvent();
  assert(
    JSON.stringify({
      id: event.id,
      version: event.version,
      category: event.category,
      priority: event.priority,
      weight: event.weight,
      ageRange: event.ageRange,
      type: event.type,
      eventType: event.eventType,
      tags: event.tags,
      triggers: event.triggers,
      triggerConditions: event.triggerConditions,
    }) === JSON.stringify({
      id: EVENT_ID,
      version: '1.0.0',
      category: 'jianghu',
      priority: 85,
      weight: 75,
      ageRange: { min: 40, max: 60 },
      type: 'jianghu',
      eventType: 'choice',
      tags: ['jianghu', 'crisis'],
      triggers: [{ type: 'age_reach', value: 40 }],
      triggerConditions: {
        age: { min: 40, max: 60 },
        stats: { reputation: { min: 40 } },
      },
    }),
    '事件必须保留原 Event ID、版本、年龄、资格及调度元数据',
  );
  assert(event.name === '江湖非议' && event.content?.title === '江湖非议', '正式事件标题必须为江湖非议');
  assert(
    JSON.stringify(event.choices?.map(choice => choice.id)) === JSON.stringify([
      INVESTIGATE_CHOICE_ID,
      CHALLENGE_CHOICE_ID,
      IGNORE_CHOICE_ID,
    ]),
    '正式目录必须提供查访、公开比试、不予理会三种选择，且退役旧挑战 ID',
  );

  const eventCopy = `${event.description} ${event.content?.text}`;
  assert(eventCopy.includes('传言') && eventCopy.includes('指责'), '事件须说明江湖议论涉及传言与指责');
  assert(/尚未证实|尚未经证实|未经证实/.test(eventCopy), '事件不得把指责写成已证实事实');
  assert(/当众|当面/.test(eventCopy) && eventCopy.includes('比试') && eventCopy.includes('旁观者'), '事件须说明公开比试与旁观者');
  assert(
    !/遭人陷害|被人陷害|武林公敌|幕后黑手|洗清冤屈|全武林的共同敌人/.test(eventCopy),
    '事件不得预设陷害、幕后黑手、已洗清嫌疑或全武林共同敌人',
  );

  const investigate = getChoice(INVESTIGATE_CHOICE_ID);
  assert(investigate.challenge === undefined, '查访传言不得进入 Challenge');
  assert(investigate.condition === undefined, '查访传言不得新增资格门槛');
  assert(
    investigate.effects.length === 1 &&
      investigate.effects[0]?.type === 'stat_modify' &&
      investigate.effects[0].target === 'connections' &&
      investigate.effects[0].value === 10 &&
      investigate.effects[0].operator === 'add',
    '查访传言必须只增加基础人脉 10',
  );
  assert(!/查明真相|证明传言虚假|洗清嫌疑|确凿证据|找到陷害者/.test(`${investigate.text} ${investigate.description}`), '查访文案不得宣称已经查明事实');

  const challengeChoice = getChoice(CHALLENGE_CHOICE_ID);
  const challenge = challengeChoice.challenge;
  assert(challenge !== undefined, '公开比试必须显式配置正式 Choice Challenge');
  assert(challenge.sceneId === SCENE_ID, '公开比试必须复用既有江湖公开比试场景');
  assert(Array.isArray(challengeChoice.effects) && challengeChoice.effects.length === 0, '挑战基础效果必须为空');
  assert(challengeChoice.condition === undefined, '公开比试不得新增资格门槛');
  assert(
    challengeChoice.description?.includes('点到为止') && challengeChoice.description.includes('胜负') &&
      challengeChoice.description.includes('旁观者') && challengeChoice.description.includes('不能证明'),
    '比试选择须提示非致命约定、结果不确定、旁观者可见且不能证明传言真假',
  );
  assert(challenge.success.id === SUCCESS_OUTCOME_ID, '成功 Outcome ID 必须稳定');
  assert(challenge.failure.id === FAILURE_OUTCOME_ID, '失败 Outcome ID 必须稳定');
  assert(challenge.success.id !== challenge.failure.id, '胜败 Outcome ID 必须不同');
  assert(
    challenge.success.effects.length === 1 &&
      challenge.success.effects[0]?.type === 'stat_modify' &&
      challenge.success.effects[0].target === 'reputation' &&
      challenge.success.effects[0].value === 10 &&
      challenge.success.effects[0].operator === 'add',
    '成功分支必须只按基础值增加名望 10',
  );
  assert(challenge.failure.effects.length === 0, '失败分支必须是合法空效果');
  assert(
    challenge.success.text.includes('赢得') && challenge.success.text.includes('旁观者') && challenge.success.text.includes('不能证明') &&
      challenge.failure.text.includes('落败') && challenge.failure.text.includes('依约收手') && challenge.failure.text.includes('不能证明'),
    '胜败叙事须说明真实比试结果与见证，并明确不证明指责真假',
  );
  assert(challenge.success.text !== challenge.failure.text, '胜败叙事必须可区分');

  const challengeOutcomeIds = eventLoader.getAllEvents().flatMap(candidate =>
    (candidate.choices ?? []).flatMap(choice => [choice.challenge?.success.id, choice.challenge?.failure.id]),
  );
  assert(
    challengeOutcomeIds.filter(id => id === SUCCESS_OUTCOME_ID).length === 1 &&
      challengeOutcomeIds.filter(id => id === FAILURE_OUTCOME_ID).length === 1,
    '胜败 Outcome ID 必须在正式事件目录中全局唯一',
  );

  const ignore = getChoice(IGNORE_CHOICE_ID);
  assert(ignore.challenge === undefined && ignore.condition === undefined, '不予理会不得有 Challenge 或資格门槛');
  assert(Array.isArray(ignore.effects) && ignore.effects.length === 0, '不予理会必须保持空效果');

  const scene = getChallengeScene(SCENE_ID);
  assert(scene !== undefined, '江湖公开比试场景必须在正式目录中存在');

  const allEffects = event.choices?.flatMap(choice => [
    ...choice.effects,
    ...(choice.challenge?.success.effects ?? []),
    ...(choice.challenge?.failure.effects ?? []),
  ]) ?? [];
  assert(
    !allEffects.some(effect => effect.type === 'random' || effect.type === 'karma_change'),
    '本事件不得残留旧 Random Effect 或新增 Karma 效果',
  );
}

async function assertInvestigationAndIgnoring(): Promise<void> {
  const investigation = await executeChoice(INVESTIGATE_CHOICE_ID, fixedRandom(0));
  assert(investigation.response.status === 'success', '查访传言必须通过正式 Headless Choice 结算');
  assert(investigation.response.feedback.diagnostic.sourceOutcomeId === undefined, '查访传言不得产生 Challenge outcome');
  assert(investigation.response.feedback.player.narrativeResult === null, '查访传言不得虚构已查明事实的结果叙事');
  assert(investigation.randomCallsUsed === 0, '查访传言不得消耗挑战随机数');
  assertOnlyPlayerStatChanges(investigation, 'connections', 10);
  assert(impactDelta(investigation.response, 'connections') === 10, '查访传言反馈须呈现实际人脉 +10');
  assertFeedbackMatchesCanonicalState(investigation);
  assertKarmaUnchanged(investigation);
  assertEventRecorded(investigation);

  const ignored = await executeChoice(IGNORE_CHOICE_ID, fixedRandom(0));
  assert(ignored.response.status === 'success', '不予理会必须通过正式 Headless Choice 结算');
  assert(ignored.response.feedback.diagnostic.sourceOutcomeId === undefined, '不予理会不得产生 Challenge outcome');
  assert(ignored.response.feedback.player.narrativeResult === null, '不予理会不得伪造议论消失的结果叙事');
  assert(ignored.randomCallsUsed === 0, '不予理会不得消耗随机数');
  assertOnlyPlayerStatChanges(ignored);
  assertFeedbackMatchesCanonicalState(ignored);
  assertKarmaUnchanged(ignored);
  assertEventRecorded(ignored);
}

async function assertChallengeSuccessAndFailure(): Promise<void> {
  const choice = getChoice(CHALLENGE_CHOICE_ID);
  const challenge = choice.challenge!;

  const succeeded = await executeChoice(CHALLENGE_CHOICE_ID, fixedRandom(0.99));
  assert(succeeded.response.status === 'success', '公开比试成功分支必须通过正式 Headless Choice 结算');
  assert(succeeded.randomCallsUsed === 1, '每次正式挑战只能消耗一次受控随机判定');
  assert(succeeded.response.feedback.diagnostic.sourceOutcomeId === SUCCESS_OUTCOME_ID, '成功必须命中稳定成功 Outcome');
  assert(succeeded.response.feedback.player.narrativeResult === challenge.success.text, '成功反馈必须使用真实 Outcome 叙事');
  assertOnlyPlayerStatChanges(succeeded, 'reputation', 10);
  assert(impactDelta(succeeded.response, 'reputation') === 10, '成功反馈须呈现基础名望 +10');
  assertFeedbackMatchesCanonicalState(succeeded);
  assertKarmaUnchanged(succeeded);
  assertEventRecorded(succeeded);

  const failed = await executeChoice(CHALLENGE_CHOICE_ID, fixedRandom(0));
  assert(failed.response.status === 'success', '空效果失败分支必须正常完成选择');
  assert(failed.randomCallsUsed === 1, '失败挑战也只能消耗一次受控随机判定');
  assert(failed.response.feedback.diagnostic.sourceOutcomeId === FAILURE_OUTCOME_ID, '失败必须命中稳定失败 Outcome');
  assert(failed.response.feedback.player.narrativeResult === challenge.failure.text, '失败反馈必须使用真实 Outcome 叙事');
  assertOnlyPlayerStatChanges(failed);
  assertFeedbackMatchesCanonicalState(failed);
  assertKarmaUnchanged(failed);
  assertEventRecorded(failed);
}

async function assertReplayPreservesRecordedOutcomes(): Promise<void> {
  const event = getPublicOpinionEvent();
  const choice = getChoice(CHALLENGE_CHOICE_ID);
  for (const scenario of [
    { originalRoll: 0.99, replayRoll: 0, outcomeId: SUCCESS_OUTCOME_ID, branch: '成功' },
    { originalRoll: 0, replayRoll: 0.99, outcomeId: FAILURE_OUTCOME_ID, branch: '失败' },
  ] as const) {
    const original = await executeChoice(CHALLENGE_CHOICE_ID, fixedRandom(scenario.originalRoll));
    assert(original.response.feedback.diagnostic.sourceOutcomeId === scenario.outcomeId, `原始${scenario.branch}必须记录胜败 ID`);
    const outcomeText = original.response.feedback.player.narrativeResult;
    assert(typeof outcomeText === 'string' && outcomeText.length > 0, `原始${scenario.branch}必须记录真实结果叙事`);
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
      { playerName: '江湖非议回放测试', gender: 'male' },
      [record],
    );

    assert(replay.outcomeTexts[0] === outcomeText, `Replay 必须保留原始${scenario.branch}结果叙事`);
    assert(replayRandom.calls === 0, `${scenario.branch} Replay 不得重新抽签`);
    assert(
      replay.finalState.eventHistory.filter(entry => entry.eventId === EVENT_ID).length === 1,
      `${scenario.branch} Replay 必须只记录一次事件历史`,
    );
    const originalPlayer = original.response.nextSnapshot.state.player;
    const replayedPlayer = replay.finalState.player;
    const playerFields = new Set([...Object.keys(originalPlayer), ...Object.keys(replayedPlayer)]);
    assert(
      [...playerFields].every(key => JSON.stringify(
        originalPlayer[key as keyof PlayerState],
      ) === JSON.stringify(replayedPlayer[key as keyof PlayerState])),
      `${scenario.branch} Replay 必须保留原始完整人物状态`,
    );
    assert(
      JSON.stringify(replay.finalState.karma) === JSON.stringify(original.response.nextSnapshot.state.karma),
      `${scenario.branch} Replay 必须保留原始 Karma`,
    );
  }
}

export async function runJianghuPublicOpinionChallengeTests(): Promise<void> {
  assertCatalogAndProductSemantics();
  await assertInvestigationAndIgnoring();
  await assertChallengeSuccessAndFailure();
  await assertReplayPreservesRecordedOutcomes();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runJianghuPublicOpinionChallengeTests()
    .then(() => console.log('jianghuPublicOpinionChallenge.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
