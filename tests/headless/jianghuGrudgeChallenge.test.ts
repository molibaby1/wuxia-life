import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { eventLoader } from '../../src/core/EventLoader';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import type { EventChoice, EventDefinition, PlayerState } from '../../src/types/eventTypes';
import type { GameProcessRecord } from '../../src/types/simulationRecordTypes';

const EVENT_ID = 'jianghu_grudge';
const FIGHT_CHOICE_ID = 'fight_grudge';
const MEDIATION_CHOICE_ID = 'peace_grudge';
const SCENE_ID = 'jianghu_open_challenge';

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

function getGrudgeEvent(): EventDefinition {
  const event = eventLoader.getEventById(EVENT_ID);
  assert(event !== undefined, '正式事件目录必须装载 jianghu_grudge');
  return event;
}

function getChoice(choiceId: string): EventChoice {
  const choice = getGrudgeEvent().choices?.find(candidate => candidate.id === choiceId);
  assert(choice !== undefined, `正式事件必须包含 ${choiceId}`);
  return choice;
}

function createSession(random: CountingRandomSource) {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '江湖恩怨挑战测试',
    gender: 'male',
    randomSeed: 814,
    catalogVersion: '1.0.0',
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 50;
  snapshot.state.player.martialPower = 80;
  snapshot.state.player.constitution = 60;
  snapshot.state.player.knowledge = 50;
  snapshot.state.player.connections = 20;
  snapshot.state.player.reputation = 40;
  snapshot.state.player.chivalry = 30;
  snapshot.state.player.traits = [];
  snapshot.state.pendingStoryEventId = EVENT_ID;

  const session = HeadlessEngineSessionImpl.create({ snapshot }, { random });
  assert(session.getCurrentEvent()?.id === EVENT_ID, '正式 Headless Choice 入口必须装载江湖恩怨事件');
  return session;
}

async function executeChoice(choiceId: string, random: CountingRandomSource) {
  const session = createSession(random);
  const stateBefore = JSON.parse(JSON.stringify(session.getRuntimeState())) as ReturnType<
    typeof session.getRuntimeState
  >;
  const callsBefore = random.calls;
  const response = await session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: session.serialize() },
    action: { eventId: EVENT_ID, choiceId },
  });
  return {
    response,
    stateBefore,
    randomCallsUsed: random.calls - callsBefore,
  };
}

function impactDelta(
  response: Awaited<ReturnType<typeof executeChoice>>['response'],
  stat: string,
): number {
  return response.feedback.player.statImpacts.find(impact => impact.stat === stat)?.delta ?? 0;
}

function assertCoreStatFeedbackMatchesCanonicalState(
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

function assertCatalogConfiguration(): void {
  const event = getGrudgeEvent();
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
      priority: 75,
      weight: 65,
      ageRange: { min: 35, max: 55 },
      type: 'jianghu',
      eventType: 'choice',
      tags: ['jianghu', 'grudge'],
      triggers: [{ type: 'age_reach', value: 35 }],
      triggerConditions: { age: { min: 35, max: 55 } },
    }),
    '事件目录必须保留原 Event ID、年龄、触发条件、权重与调度元数据',
  );
  assert(event.choices?.length === 2, '事件必须保留两个原 Choice');

  const fight = getChoice(FIGHT_CHOICE_ID);
  const challenge = fight.challenge;
  assert(challenge?.sceneId === SCENE_ID, 'fight_grudge 必须显式使用既有江湖比试场景');
  assert(Array.isArray(fight.effects) && fight.effects.length === 0, '挑战 Choice 的基础 effects 必须为合法空数组');
  assert(!fight.effects.some(effect => effect.type === 'random'), 'fight_grudge 不得保留旧 Random Effect');
  assert(challenge.success.id === 'jianghu_grudge_fight_success', '成功 outcome ID 必须稳定且唯一');
  assert(challenge.failure.id === 'jianghu_grudge_fight_failure', '失败 outcome ID 必须稳定且唯一');
  assert(challenge.success.id !== challenge.failure.id, '胜败 outcome ID 必须不同');
  assert(
    challenge.success.effects.length === 1 &&
      challenge.success.effects[0]?.type === 'stat_modify' &&
      challenge.success.effects[0].target === 'chivalry' &&
      challenge.success.effects[0].value === 10 &&
      challenge.success.effects[0].operator === 'add',
    '成功只允许显式增加侠义声誉的批准效果',
  );
  assert(challenge.failure.effects.length === 0, '失败分支必须保持合法空效果');
  assert(
    challenge.success.text !== challenge.failure.text &&
      !challenge.success.text.includes(challenge.failure.text) &&
      !challenge.failure.text.includes(challenge.success.text),
    '胜败叙事必须可由 Replay 唯一识别',
  );

  const challengeOutcomeIds = eventLoader.getAllEvents().flatMap(candidate =>
    (candidate.choices ?? []).flatMap(choice => [choice.challenge?.success.id, choice.challenge?.failure.id]),
  );
  assert(
    challengeOutcomeIds.filter(id => id === challenge.success.id).length === 1 &&
      challengeOutcomeIds.filter(id => id === challenge.failure.id).length === 1,
    '胜败 outcome ID 必须在正式事件目录中全局唯一',
  );

  const mediation = getChoice(MEDIATION_CHOICE_ID);
  assert(mediation.challenge === undefined, '调停选项不得进入 Challenge');
  assert(
    mediation.effects.length === 1 &&
      mediation.effects[0]?.type === 'stat_modify' &&
      mediation.effects[0].target === 'connections' &&
      mediation.effects[0].value === 10 &&
      mediation.effects[0].operator === 'add',
    '调停选项必须保留人脉 +10 的基础效果',
  );

  assert(event.description?.includes('声称') && event.description.includes('旧怨'), '事件描述须表明旧怨只是来人的主张');
  assert(event.content?.text.includes('声称') && event.content.text.includes('尚无法核实'), '事件正文不得确认未经证实的过往');
  assert(
    fight.text.includes('点到为止') && fight.text.includes('比试') && fight.text.includes('胜负难料'),
    '比试选项必须说明点到为止并让玩家理解可能落败',
  );
  assert(
    challenge.success.text.includes('胜过') &&
      challenge.success.text.includes('认可') &&
      challenge.success.text.includes('不能证明'),
    '成功叙事必须表达克制获认可且胜负不证明旧怨属实',
  );
  assert(
    challenge.failure.text.includes('落败') && challenge.failure.text.includes('点到为止'),
    '失败叙事必须表达真实落败且按约收手',
  );
  assert(
    mediation.text.includes('联系江湖同道') &&
      mediation.text.includes('协调') &&
      mediation.description?.includes('主动向江湖同道求助') === true &&
      mediation.description.includes('是否接受'),
    '调停文案须表达实际联络协调过程且不保证对方接受',
  );

  const visibleCopy = [
    event.description,
    event.content?.text,
    fight.text,
    fight.description,
    challenge.success.text,
    challenge.failure.text,
    mediation.text,
    mediation.description,
  ].filter((value): value is string => typeof value === 'string').join(' ');
  assert(!/\d/.test(visibleCopy), '玩家可见文案不得泄露精确效果数值、后台概率或内部阈值');
}

async function assertFormalSuccessAndFailure(): Promise<void> {
  const succeeded = await executeChoice(FIGHT_CHOICE_ID, fixedRandom(0.99));
  assert(succeeded.response.status === 'success', '成功分支必须通过正式 Headless Choice 结算');
  assert(
    impactDelta(succeeded.response, 'chivalry') === 10,
    `正式成功分支必须增加 10 点侠义声誉，实际为 ${impactDelta(succeeded.response, 'chivalry')}`,
  );
  assert(succeeded.response.feedback.diagnostic.sourceOutcomeId === getChoice(FIGHT_CHOICE_ID).challenge?.success.id, '成功反馈必须记录命中的 outcome ID');
  assert(succeeded.response.feedback.player.narrativeResult === getChoice(FIGHT_CHOICE_ID).challenge?.success.text, '成功反馈必须使用真实胜利叙事');
  assert(succeeded.randomCallsUsed === 1, '成功挑战只能消耗一次受控随机判定');
  assertCoreStatFeedbackMatchesCanonicalState(succeeded);
  for (const stat of CORE_STATS.filter(stat => stat !== 'chivalry')) {
    assert(
      succeeded.response.nextSnapshot.state.player[stat] === succeeded.stateBefore.player![stat],
      `成功分支不得改变未批准的核心属性 ${stat}`,
    );
  }
  assert(
    succeeded.response.nextSnapshot.state.eventHistory.filter(record => record.eventId === EVENT_ID).length === 1,
    '成功分支事件历史只能记录一次',
  );

  const failed = await executeChoice(FIGHT_CHOICE_ID, fixedRandom(0));
  assert(failed.response.status === 'success', '空效果失败分支不得被判为非法选择或静默取消');
  assert(failed.response.feedback.diagnostic.sourceOutcomeId === getChoice(FIGHT_CHOICE_ID).challenge?.failure.id, '失败反馈必须明确命中失败 outcome');
  assert(failed.response.feedback.player.narrativeResult === getChoice(FIGHT_CHOICE_ID).challenge?.failure.text, '失败反馈必须使用真实落败叙事');
  assert(failed.randomCallsUsed === 1, '失败挑战只能消耗一次受控随机判定');
  for (const stat of CORE_STATS) {
    assert(
      failed.response.nextSnapshot.state.player[stat] === failed.stateBefore.player![stat],
      `失败分支不得改变核心属性 ${stat}`,
    );
  }
  assertCoreStatFeedbackMatchesCanonicalState(failed);
  assert(
    failed.response.nextSnapshot.state.eventHistory.filter(record => record.eventId === EVENT_ID).length === 1,
    '失败分支事件历史只能记录一次',
  );
}

async function assertReplayPreservesRecordedOutcomes(): Promise<void> {
  const event = getGrudgeEvent();
  const choice = getChoice(FIGHT_CHOICE_ID);
  for (const scenario of [
    { originalRoll: 0.99, replayRoll: 0, branch: 'success' },
    { originalRoll: 0, replayRoll: 0.99, branch: 'failure' },
  ] as const) {
    const original = await executeChoice(FIGHT_CHOICE_ID, fixedRandom(scenario.originalRoll));
    const outcomeText = original.response.feedback.player.narrativeResult;
    assert(typeof outcomeText === 'string' && outcomeText.length > 0, `原始 ${scenario.branch} 必须记录结果叙事`);
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
      { playerName: '江湖恩怨回放测试', gender: 'male' },
      [record],
    );

    assert(replay.outcomeTexts[0] === outcomeText, `回放必须保留原始 ${scenario.branch} 结果叙事`);
    assert(replayRandom.calls === 0, `回放 ${scenario.branch} 不得重新抽签`);
    assert(
      replay.finalState.eventHistory.filter(entry => entry.eventId === EVENT_ID).length === 1,
      `回放 ${scenario.branch} 必须只记录一次事件历史`,
    );
    const originalPlayer = original.response.nextSnapshot.state.player;
    const replayedPlayer = replay.finalState.player;
    const playerFields = new Set([...Object.keys(originalPlayer), ...Object.keys(replayedPlayer)]);
    const differingPlayerFields = [...playerFields].filter(
      key => JSON.stringify(originalPlayer[key as keyof typeof originalPlayer]) !==
        JSON.stringify(replayedPlayer[key as keyof typeof replayedPlayer]),
    );
    assert(
      differingPlayerFields.length === 0,
      `回放 ${scenario.branch} 必须保留原始完整人物状态，差异字段：${differingPlayerFields.join(', ')}`,
    );
    for (const stat of CORE_STATS) {
      assert(
        replay.finalState.player[stat] === original.response.nextSnapshot.state.player[stat],
        `回放 ${scenario.branch} 必须保留 ${stat} 原始人物状态`,
      );
    }
  }
}

async function assertMediationUsesNoChallengeRandomness(): Promise<void> {
  const result = await executeChoice(MEDIATION_CHOICE_ID, fixedRandom(0));
  assert(result.response.status === 'success', '调停选项必须通过正式 Headless Choice 结算');
  assert(result.response.feedback.diagnostic.sourceOutcomeId === undefined, '调停选项不得生成挑战 outcome');
  assert(result.response.feedback.player.narrativeResult === null, '调停不得虚构调停已经成功的结果叙事');
  assert(result.randomCallsUsed === 0, '调停选项不得消耗挑战随机数');
  assert(
    result.response.nextSnapshot.state.player.connections - result.stateBefore.player!.connections === 10 &&
      impactDelta(result.response, 'connections') === 10,
    '调停选项必须按 canonical 结算增加 10 点人脉',
  );
  assertCoreStatFeedbackMatchesCanonicalState(result);
  assert(
    result.response.nextSnapshot.state.eventHistory.filter(record => record.eventId === EVENT_ID).length === 1,
    '调停分支事件历史只能记录一次',
  );
}

export async function runJianghuGrudgeChallengeTests(): Promise<void> {
  await assertFormalSuccessAndFailure();
  assertCatalogConfiguration();
  await assertReplayPreservesRecordedOutcomes();
  await assertMediationUsesNoChallengeRandomness();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runJianghuGrudgeChallengeTests()
    .then(() => console.log('jianghuGrudgeChallenge.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
