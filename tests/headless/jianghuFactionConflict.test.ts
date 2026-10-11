import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { getChallengeScene } from '../../src/data/challengeScenes';
import { eventLoader } from '../../src/core/EventLoader';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import type { EventChoice, EventDefinition, PlayerState } from '../../src/types/eventTypes';
import type { WealthCapacity } from '../../src/types/wealthCapacity';
import type { GameProcessRecord } from '../../src/types/simulationRecordTypes';

const EVENT_ID = 'jianghu_demon_sect';
const SCENE_ID = 'jianghu_faction_skirmish';
const CHOICE_IDS = [
  'support_traditional_skirmish',
  'support_unconventional_skirmish',
  'relieve_conflict_victims',
  'stay_out_of_conflict',
] as const;
const SUPPORT_CHOICE_IDS = CHOICE_IDS.slice(0, 2);
const RELIEF_CHOICE_ID = CHOICE_IDS[2];
const STAY_OUT_CHOICE_ID = CHOICE_IDS[3];

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

function getConflictEvent(): EventDefinition {
  const event = eventLoader.getEventById(EVENT_ID);
  assert(event !== undefined, '正式事件目录必须装载江湖纷争事件');
  return event;
}

function getChoice(choiceId: string): EventChoice {
  const choice = getConflictEvent().choices?.find(candidate => candidate.id === choiceId);
  assert(choice !== undefined, `正式事件必须包含 ${choiceId}`);
  return choice;
}

function createSession(
  random: CountingRandomSource,
  wealthCapacity: WealthCapacity = 'wealthy',
) {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '江湖纷争挑战测试',
    gender: 'male',
    randomSeed: 815,
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
  snapshot.state.player.wealthCapacity = wealthCapacity;
  snapshot.state.player.traits = [];
  snapshot.state.pendingStoryEventId = EVENT_ID;

  const session = HeadlessEngineSessionImpl.create({ snapshot }, { random });
  assert(session.getCurrentEvent()?.id === EVENT_ID, '正式 Headless Choice 入口必须装载江湖纷争事件');
  return session;
}

async function submitChoice(session: ReturnType<typeof createSession>, choiceId: string) {
  return session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: session.serialize() },
    action: { eventId: EVENT_ID, choiceId },
  });
}

async function executeChoice(
  choiceId: string,
  random: CountingRandomSource,
  wealthCapacity: WealthCapacity = 'wealthy',
) {
  const session = createSession(random, wealthCapacity);
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

function assertCoreStatsUnchanged(
  result: Awaited<ReturnType<typeof executeChoice>>,
  except?: CoreStat,
): void {
  const before = result.stateBefore.player as PlayerState;
  const after = result.response.nextSnapshot.state.player;
  for (const stat of CORE_STATS) {
    if (stat === except) continue;
    assert(after[stat] === before[stat], `该分支不得改变未批准的核心属性 ${stat}`);
  }
}

function assertPlayerStateUnchanged(
  result: Awaited<ReturnType<typeof executeChoice>>,
): void {
  const before = result.stateBefore.player as PlayerState;
  const after = result.response.nextSnapshot.state.player;
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  assert(
    [...keys].every(key => JSON.stringify(
      before[key as keyof PlayerState],
    ) === JSON.stringify(after[key as keyof PlayerState])),
    '落败后不得改变人物状态、添加伤势或产生长期功力损失',
  );
}

function assertKarmaUnchanged(
  result: Awaited<ReturnType<typeof executeChoice>>,
): void {
  assert(
    JSON.stringify(result.response.nextSnapshot.state.karma) === JSON.stringify(result.stateBefore.karma),
    '本事件的任何选择都不得自动增加善行或恶行因果',
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
  const event = getConflictEvent();
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
      priority: 90,
      weight: 80,
      ageRange: { min: 40, max: 60 },
      type: 'jianghu',
      eventType: 'choice',
      tags: ['jianghu', 'faction-war'],
      triggers: [{ type: 'age_reach', value: 40 }],
      triggerConditions: {
        age: { min: 40, max: 60 },
        stats: { reputation: { min: 50 } },
      },
    }),
    '事件必须保留原 Event ID、年龄、权重、资格和其他调度元数据',
  );
  assert(
    JSON.stringify(event.choices?.map(choice => choice.id)) === JSON.stringify(CHOICE_IDS),
    '正式目录必须只提供四种已批准的新行动 ID',
  );

  const scene = getChallengeScene(SCENE_ID);
  assert(scene !== undefined, '局部交锋场景必须在正式目录中注册');
  assert(scene.baseFailureRate === 55, '局部交锋的基础失败概率必须为 55');
  assert(JSON.stringify(scene.relevantStats) === JSON.stringify(['martialPower']), '局部交锋只使用功力');
  assert(
    scene.thresholds.martialPower?.qualified === 70 &&
      scene.thresholds.martialPower.excellent === 130 &&
      scene.thresholds.martialPower.failureRateReduction === 0.3,
    '局部交锋必须采用已批准的功力阈值和失败率修正',
  );
  assert(
    !/生死决斗|致死|死亡/.test(scene.name + scene.description),
    '局部交锋不能描述为生死决斗或致命后果',
  );

  const supports = SUPPORT_CHOICE_IDS.map(choiceId => getChoice(choiceId));
  const outcomes = supports.flatMap(choice => {
    const challenge = choice.challenge;
    assert(challenge !== undefined, `${choice.id} 必须显式配置 Choice Challenge`);
    assert(challenge.sceneId === SCENE_ID, '两条武力选择必须复用同一局部交锋场景');
    assert(Array.isArray(choice.effects) && choice.effects.length === 0, '武力选择基础效果必须是合法空数组');
    assert(choice.condition === undefined, '武力选择不得新增未批准的资格门槛');
    assert(
      challenge.success.effects.length === 1 &&
        challenge.success.effects[0]?.type === 'stat_modify' &&
        challenge.success.effects[0].target === 'reputation' &&
        challenge.success.effects[0].value === 15 &&
        challenge.success.effects[0].operator === 'add',
      '武力成功分支必须只按基础值增加名望 15',
    );
    assert(challenge.failure.effects.length === 0, '武力失败分支必须使用合法空效果');
    assert(
      challenge.success.id !== challenge.failure.id &&
        challenge.success.text !== challenge.failure.text &&
        !challenge.success.text.includes(challenge.failure.text) &&
        !challenge.failure.text.includes(challenge.success.text),
      '每条武力选择的胜败 ID 和叙事必须各自稳定且可区分',
    );
    return [challenge.success, challenge.failure];
  });
  const outcomeIds = outcomes.map(outcome => outcome.id);
  const outcomeTexts = outcomes.map(outcome => outcome.text);
  assert(new Set(outcomeIds).size === 4, '四个挑战结果必须使用各自唯一的 outcome ID');
  assert(new Set(outcomeTexts).size === 4, '四个挑战结果必须有各自唯一的叙事');
  const catalogOutcomeIds = eventLoader.getAllEvents().flatMap(candidate =>
    (candidate.choices ?? []).flatMap(choice => [choice.challenge?.success.id, choice.challenge?.failure.id]),
  );
  assert(
    outcomeIds.every(id => catalogOutcomeIds.filter(candidate => candidate === id).length === 1),
    '四个 outcome ID 必须在正式事件目录中全局唯一',
  );

  const relief = getChoice(RELIEF_CHOICE_ID);
  assert(
    relief.condition?.type === 'wealth_capacity_at_least' &&
      relief.condition.minimum === 'comfortable_means',
    '援助选择必须保留 comfortable_means 财力资格',
  );
  assert(relief.challenge === undefined, '援助选择不得进入 Challenge');
  assert(
    relief.effects.length === 1 &&
      relief.effects[0]?.type === 'stat_modify' &&
      relief.effects[0].target === 'chivalry' &&
      relief.effects[0].value === 10 &&
      relief.effects[0].operator === 'add',
    '援助受波及者必须按基础值增加侠义声誉 10',
  );
  const stayOut = getChoice(STAY_OUT_CHOICE_ID);
  assert(stayOut.condition === undefined, '不参与选择不得有资格门槛');
  assert(stayOut.challenge === undefined, '不参与选择不得进行随机判定');
  assert(stayOut.effects.length === 0, '不参与选择必须保留合法空效果');

  const allChoices = event.choices ?? [];
  assert(
    allChoices.every(choice =>
      ![...(choice.effects ?? []), ...(choice.challenge?.success.effects ?? []), ...(choice.challenge?.failure.effects ?? [])]
        .some(effect => effect.type === 'karma_change' || effect.type === 'random'),
    ),
    '四种选择都不得保留旧 Random Effect 或自动 Karma 奖励',
  );

  const visibleCopy = [
    event.description,
    event.content?.text,
    ...allChoices.flatMap(choice => [
      choice.text,
      choice.description,
      choice.challenge?.success.text,
      choice.challenge?.failure.text,
    ]),
  ].filter((value): value is string => typeof value === 'string').join(' ');
  assert(!/\d|概率|成功率|失败率|阈值/.test(visibleCopy), '玩家可见文案不得泄露奖励数值、后台概率或内部阈值');
  assert(
    /正邪/.test(event.description ?? '') && /责任/.test(event.description ?? '') && /说法不同|各执一词|各有说法/.test(event.description ?? ''),
    '事件必须呈现各方对正邪判断、责任和冲突原因的不同说法',
  );
  assert(/名望/.test(event.description ?? '') && /名望/.test(event.content?.text ?? ''), '玩家应因已有名望而被询问立场');
  assert(
    /波及/.test(event.description ?? '') && /受困|受波及/.test(relief.text + (relief.description ?? '')),
    '局部交锋必须已波及普通人，援助选项明确针对受影响者',
  );
  assert(
    /撤出|退开/.test(outcomes.filter(outcome => outcome.id.endsWith('_failure')).map(outcome => outcome.text).join(' ')),
    '挑战失败叙事必须允许玩家撤出局部交锋',
  );

  const ordinaryChoices = [relief, stayOut];
  assert(
    ordinaryChoices.every(choice => choice.outcomes === undefined),
    '普通选择不得为了补齐文案增加虚构 ChoiceOutcome',
  );
}

async function assertSupportSuccessAndFailure(): Promise<void> {
  for (const choiceId of SUPPORT_CHOICE_IDS) {
    const choice = getChoice(choiceId);
    const challenge = choice.challenge!;

    const succeeded = await executeChoice(choiceId, fixedRandom(0.99));
    assert(succeeded.response.status === 'success', `${choiceId} 成功结果必须通过正式 Headless 结算`);
    assert(
      succeeded.response.nextSnapshot.state.player.reputation - succeeded.stateBefore.player!.reputation === 15 &&
        impactDelta(succeeded.response, 'reputation') === 15,
      `${choiceId} 成功后名望必须按基础值增加 15`,
    );
    assert(succeeded.response.feedback.diagnostic.sourceOutcomeId === challenge.success.id, '成功反馈必须匹配真实 outcome ID');
    assert(succeeded.response.feedback.player.narrativeResult === challenge.success.text, '成功反馈必须使用真实胜利叙事');
    assert(succeeded.randomCallsUsed === 1, '每次成功武力选择只能消耗一次受控随机判定');
    assertCoreStatsUnchanged(succeeded, 'reputation');
    assertFeedbackMatchesCanonicalState(succeeded);
    assertKarmaUnchanged(succeeded);
    assertEventRecorded(succeeded);

    const failed = await executeChoice(choiceId, fixedRandom(0));
    assert(failed.response.status === 'success', '失败空效果分支必须正常完成选择');
    assert(failed.response.feedback.diagnostic.sourceOutcomeId === challenge.failure.id, '失败反馈必须匹配真实 outcome ID');
    assert(failed.response.feedback.player.narrativeResult === challenge.failure.text, '失败反馈必须使用真实落败叙事');
    assert(failed.randomCallsUsed === 1, '每次失败武力选择只能消耗一次受控随机判定');
    assertPlayerStateUnchanged(failed);
    assertFeedbackMatchesCanonicalState(failed);
    assertKarmaUnchanged(failed);
    assertEventRecorded(failed);
  }
}

async function assertReplayPreservesBothSupportChoices(): Promise<void> {
  const event = getConflictEvent();
  for (const choiceId of SUPPORT_CHOICE_IDS) {
    const choice = getChoice(choiceId);
    for (const scenario of [
      { originalRoll: 0.99, replayRoll: 0, branch: 'success' },
      { originalRoll: 0, replayRoll: 0.99, branch: 'failure' },
    ] as const) {
      const original = await executeChoice(choiceId, fixedRandom(scenario.originalRoll));
      const outcomeText = original.response.feedback.player.narrativeResult;
      assert(typeof outcomeText === 'string' && outcomeText.length > 0, `原始 ${scenario.branch} 必须有真实结果叙事`);
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
        { playerName: '江湖纷争回放测试', gender: 'male' },
        [record],
      );

      assert(replay.outcomeTexts[0] === outcomeText, '回放必须保留原始胜败结果叙事');
      assert(replayRandom.calls === 0, '胜败 Replay 必须复用原结果且不得重新抽签');
      assert(
        replay.finalState.eventHistory.filter(entry => entry.eventId === EVENT_ID).length === 1,
        'Replay 必须只记录一次正式事件历史',
      );
      assert(
        [...new Set([
          ...Object.keys(original.response.nextSnapshot.state.player),
          ...Object.keys(replay.finalState.player),
        ])].every(key => JSON.stringify(
          original.response.nextSnapshot.state.player[key as keyof PlayerState],
        ) === JSON.stringify(replay.finalState.player[key as keyof PlayerState])),
        `Replay ${choiceId}/${scenario.branch} 必须保留原始完整人物状态`,
      );
      assert(
        JSON.stringify(replay.finalState.karma) === JSON.stringify(original.response.nextSnapshot.state.karma),
        'Replay 必须保留原始善恶因果状态',
      );
    }
  }
}

async function assertReliefAndStayOut(): Promise<void> {
  const relief = await executeChoice(RELIEF_CHOICE_ID, fixedRandom(0), 'comfortable_means');
  assert(relief.response.status === 'success', '满足财力资格时援助选择必须正常结算');
  assert(
    relief.response.nextSnapshot.state.player.chivalry - relief.stateBefore.player!.chivalry === 10 &&
      impactDelta(relief.response, 'chivalry') === 10,
    '实际援助受波及者必须按基础值增加侠义声誉 10',
  );
  assert(
    relief.response.nextSnapshot.state.player.wealthCapacity === relief.stateBefore.player!.wealthCapacity,
    '援助不得降低 Wealth Capacity',
  );
  assert(relief.randomCallsUsed === 0, '援助选择不得消耗挑战随机数');
  assert(relief.response.feedback.diagnostic.sourceOutcomeId === undefined, '援助选择不得生成 Challenge outcome');
  assert(relief.response.feedback.player.narrativeResult === null, '援助选择不得伪造普通 Choice 结果叙事');
  assertCoreStatsUnchanged(relief, 'chivalry');
  assertFeedbackMatchesCanonicalState(relief);
  assertKarmaUnchanged(relief);
  assertEventRecorded(relief);

  const poorRandom = fixedRandom(0);
  const poorSession = createSession(poorRandom, 'modest_savings');
  const callsBeforeDeniedRelief = poorRandom.calls;
  const beforeDeniedRelief = JSON.parse(JSON.stringify(poorSession.getRuntimeState())) as ReturnType<
    typeof poorSession.getRuntimeState
  >;
  let reliefWasDenied = false;
  try {
    await submitChoice(poorSession, RELIEF_CHOICE_ID);
  } catch {
    reliefWasDenied = true;
  }
  assert(reliefWasDenied, '低于 comfortable_means 的人物不得执行援助选择');
  assert(poorRandom.calls === callsBeforeDeniedRelief, '援助资格拒绝不得消耗随机数');
  assert(
    JSON.stringify(poorSession.getRuntimeState().player) === JSON.stringify(beforeDeniedRelief.player) &&
      poorSession.getRuntimeState().eventHistory.filter(record => record.eventId === EVENT_ID).length === 0,
    '援助资格拒绝不得修改状态或写入事件历史',
  );

  const callsBeforeStayOut = poorRandom.calls;
  const stayOut = await submitChoice(poorSession, STAY_OUT_CHOICE_ID);
  assert(stayOut.status === 'success', '援助资格不足时其他合法选择仍须可执行');
  const stayOutResult = {
    response: stayOut,
    stateBefore: beforeDeniedRelief,
    randomCallsUsed: poorRandom.calls - callsBeforeStayOut,
  };
  assert(stayOut.feedback.player.narrativeResult === null, '不参与选择不得伪造普通 Choice 结果叙事');
  assert(stayOut.feedback.diagnostic.sourceOutcomeId === undefined, '不参与选择不得生成 Challenge outcome');
  assertCoreStatsUnchanged(stayOutResult);
  assertFeedbackMatchesCanonicalState(stayOutResult);
  assertKarmaUnchanged(stayOutResult);
  assert(poorRandom.calls === callsBeforeStayOut, '不参与选择不得消耗挑战随机数');
  assertEventRecorded(stayOutResult);
}

export async function runJianghuFactionConflictTests(): Promise<void> {
  assertCatalogAndProductSemantics();
  await assertSupportSuccessAndFailure();
  await assertReplayPreservesBothSupportChoices();
  await assertReliefAndStayOut();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runJianghuFactionConflictTests()
    .then(() => console.log('jianghuFactionConflict.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
