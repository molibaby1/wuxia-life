import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { getChallengeScene } from '../../src/data/challengeScenes';
import { eventLoader } from '../../src/core/EventLoader';
import { calculateFailureProbability } from '../../src/core/ChallengeSystem';
import { resolveChoiceEffects } from '../../src/core/ChoiceOutcomeResolver';
import { difficultyManager } from '../../src/core/DifficultyManager';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import { withRandomSourceSync } from '../../src/headless/adapters/randomSource';
import type { EventChoice } from '../../src/types/eventTypes';
import type { GameProcessRecord } from '../../src/types/simulationRecordTypes';

const EVENT_ID = 'jianghu_challenge';
const ACCEPT_CHOICE_ID = 'accept_challenge';
const DECLINE_CHOICE_ID = 'decline_challenge';
const SCENE_ID = 'jianghu_open_challenge';

interface CountingRandomSource {
  calls: number;
  next(): number;
}

interface SessionOptions {
  age?: number;
  reputation?: number;
  martialPower?: number;
  chivalry?: number;
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

function getChallengeEvent() {
  const event = eventLoader.getEventById(EVENT_ID);
  assert(event !== undefined, '正式事件目录必须装载 jianghu_challenge');
  return event;
}

function getChoice(choiceId: string): EventChoice {
  const choice = getChallengeEvent().choices?.find(candidate => candidate.id === choiceId);
  assert(choice !== undefined, `正式事件必须包含 ${choiceId}`);
  return choice;
}

function createSession(random: CountingRandomSource, options: SessionOptions = {}) {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '江湖高手比试测试',
    gender: 'male',
    randomSeed: 811,
    catalogVersion: '1.0.0',
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = options.age ?? 35;
  snapshot.state.player.reputation = options.reputation ?? 20;
  snapshot.state.player.martialPower = options.martialPower ?? 80;
  snapshot.state.player.chivalry = options.chivalry ?? 30;
  snapshot.state.player.traits = [];
  snapshot.state.pendingStoryEventId = EVENT_ID;

  const session = HeadlessEngineSessionImpl.create({ snapshot }, { random });
  assert(session.getCurrentEvent()?.id === EVENT_ID, '正式 Headless Choice 入口必须装载目标事件');
  return session;
}

async function executeChoice(
  choiceId: string,
  random: CountingRandomSource,
  options: SessionOptions = {},
) {
  const session = createSession(random, options);
  const randomCallsBeforeChoice = random.calls;
  const stateBefore = JSON.parse(JSON.stringify(session.getRuntimeState())) as ReturnType<
    typeof session.getRuntimeState
  >;
  const response = await session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: session.serialize() },
    action: { eventId: EVENT_ID, choiceId },
  });
  assert(response.status === 'success', `${choiceId} 必须通过正式 Headless Choice 执行入口`);
  return {
    response,
    stateBefore,
    randomCallsUsed: random.calls - randomCallsBeforeChoice,
  };
}

function impactDelta(
  response: Awaited<ReturnType<typeof executeChoice>>['response'],
  stat: 'reputation' | 'martialPower' | 'chivalry',
): number {
  return response.feedback.player.statImpacts.find(impact => impact.stat === stat)?.delta ?? 0;
}

function assertCanonicalImpactMatches(
  result: Awaited<ReturnType<typeof executeChoice>>,
  stat: 'reputation' | 'martialPower' | 'chivalry',
): void {
  const before = result.stateBefore.player![stat];
  const after = result.response.nextSnapshot.state.player[stat];
  assert(
    impactDelta(result.response, stat) === after - before,
    `${stat} 公开反馈必须与 canonical before/after 一致`,
  );
}

function assertSingleEventHistory(
  response: Awaited<ReturnType<typeof executeChoice>>['response'],
  branch: string,
): void {
  assert(
    response.nextSnapshot.state.eventHistory.filter(record => record.eventId === EVENT_ID).length === 1,
    `${branch} 选择只能产生一条合法事件完成记录`,
  );
}

async function assertControlledSuccessAndFailure(): Promise<void> {
  const succeeded = await executeChoice(ACCEPT_CHOICE_ID, fixedRandom(0.99));
  assert(impactDelta(succeeded.response, 'reputation') === 20, '成功必须实际增加 20 点名望');
  assert(impactDelta(succeeded.response, 'martialPower') === 5, '成功必须实际增加 5 点功力');
  assert(succeeded.response.nextSnapshot.state.player.reputation === 40, '成功名望必须写入 canonical 状态');
  assert(succeeded.response.nextSnapshot.state.player.martialPower === 85, '成功功力必须写入 canonical 状态');
  assert(succeeded.randomCallsUsed === 1, '接受挑战只能消耗一次挑战随机判定');
  assertCanonicalImpactMatches(succeeded, 'reputation');
  assertCanonicalImpactMatches(succeeded, 'martialPower');
  assertSingleEventHistory(succeeded.response, '成功');

  const failed = await executeChoice(ACCEPT_CHOICE_ID, fixedRandom(0));
  assert(impactDelta(failed.response, 'reputation') === -10, '失败必须实际减少 10 点名望');
  assert(impactDelta(failed.response, 'martialPower') === 0, '失败不得执行成功分支的功力奖励');
  assert(failed.response.nextSnapshot.state.player.reputation === 10, '失败名望必须写入 canonical 状态');
  assert(failed.response.nextSnapshot.state.player.martialPower === 80, '失败不得改变 canonical 功力');
  assert(failed.randomCallsUsed === 1, '失败也只能消耗一次挑战随机判定');
  assertCanonicalImpactMatches(failed, 'reputation');
  assertCanonicalImpactMatches(failed, 'martialPower');
  assertSingleEventHistory(failed.response, '失败');

  const challenge = getChoice(ACCEPT_CHOICE_ID).challenge;
  assert(challenge !== undefined, '正式 accept_challenge 必须声明 challenge');
  assert(
    succeeded.response.feedback.player.narrativeResult === challenge.success.text,
    '成功反馈必须使用实际命中的成功叙事',
  );
  assert(
    failed.response.feedback.player.narrativeResult === challenge.failure.text,
    '失败反馈必须使用实际命中的失败叙事',
  );
  assert(challenge.success.text.includes('胜过') && challenge.success.text.includes('领悟'), '成功叙事必须表达胜利与交手后的领悟');
  assert(challenge.failure.text.includes('不敌') && challenge.failure.text.includes('传开'), '失败叙事必须表达失利与见证者传播结果');
}

function assertApprovedSceneAndEventConfiguration(): void {
  const event = getChallengeEvent();
  const acceptChoice = getChoice(ACCEPT_CHOICE_ID);
  const declineChoice = getChoice(DECLINE_CHOICE_ID);
  const challenge = acceptChoice.challenge;
  assert(challenge?.sceneId === SCENE_ID, '正式 Choice 必须指向独立江湖高手比试场景');
  assert(Array.isArray(acceptChoice.effects) && acceptChoice.effects.length === 0, 'challenge Choice 的基础 effects 必须是合法空数组');
  assert(challenge.success.id === 'jianghu_challenge_accept_success', '成功结果 ID 必须稳定且明确');
  assert(challenge.failure.id === 'jianghu_challenge_accept_failure', '失败结果 ID 必须稳定且明确');
  assert(challenge.success.id !== challenge.failure.id, '成功与失败结果 ID 必须不同');
  assert(challenge.success.text !== challenge.failure.text, '成功与失败叙事必须可唯一匹配');
  assert(!challenge.success.text.includes(challenge.failure.text), '成功叙事不得包含完整失败叙事');
  assert(!challenge.failure.text.includes(challenge.success.text), '失败叙事不得包含完整成功叙事');

  assert(
    declineChoice.text === '婉拒挑战，以和为贵' && !/[+-]\d+/.test(declineChoice.text),
    '婉拒选项文案必须避免暴露精确奖励数值',
  );

  const successEffects = challenge.success.effects;
  assert(successEffects.length === 2, '成功分支只能有名望与功力两项批准效果');
  assert(
    successEffects.some(effect => effect.type === 'stat_modify' && effect.target === 'reputation' && effect.value === 20 && effect.operator === 'add'),
    '成功必须通过显式 add 执行名望 +20',
  );
  assert(
    successEffects.some(effect => effect.type === 'stat_modify' && effect.target === 'martialPower' && effect.value === 5 && effect.operator === 'add'),
    '成功必须通过显式 add 执行功力 +5',
  );
  assert(challenge.failure.effects.length === 1, '失败分支只能包含批准的名望效果');
  const failureEffect = challenge.failure.effects[0];
  assert(
    failureEffect?.type === 'stat_modify' &&
      failureEffect.target === 'reputation' &&
      failureEffect.value === -10 &&
      failureEffect.operator === 'add',
    '失败必须通过显式 add 执行名望 -10',
  );

  assert(declineChoice.challenge === undefined, '婉拒选择不得进入 Challenge 判定');
  assert(
    declineChoice.effects.length === 1 &&
      declineChoice.effects[0]?.type === 'stat_modify' &&
      declineChoice.effects[0].target === 'chivalry' &&
      declineChoice.effects[0].value === 5 &&
      declineChoice.effects[0].operator === 'add',
    '婉拒选择必须保留原有侠义 +5 效果',
  );

  assert(event.id === EVENT_ID, '事件 ID 必须保持不变');
  assert(event.weight === 60, '事件权重必须保持不变');
  assert(event.ageRange?.min === 30 && event.ageRange.max === 50, '事件年龄范围必须保持不变');
  assert(event.triggers?.some(trigger => trigger.type === 'age_reach' && trigger.value === 30), '事件触发条件必须保持不变');
  assert(
    event.triggerConditions?.age?.min === 30 && event.triggerConditions.age.max === 50,
    '事件触发年龄条件必须保持不变',
  );
  assert(event.triggerConditions?.stats?.martialPower?.min === 40, '事件功力门槛必须保持不变');
  assert(
    event.content?.text.includes('非致命') === true &&
      event.content.text.includes('点到为止') &&
      event.content.text.includes('围观') &&
      event.content.text.includes('传开'),
    '事件文案必须建立普通非致命比试与见证传播的情境',
  );
  assert(
    acceptChoice.text.includes('失利') && acceptChoice.text.includes('名望'),
    '选择前必须提示失利可能损及名望',
  );
  assert(
    !/55|70|130|\+20|\+5/.test(`${event.content?.text ?? ''} ${acceptChoice.text}`),
    '事件与选择文案不得泄露概率、阈值或精确奖励',
  );

  const scene = getChallengeScene(SCENE_ID);
  assert(scene !== undefined, '独立江湖高手比试场景必须注册');
  assert(scene.id === SCENE_ID && scene.name === '江湖高手比试', '新场景 ID 与名称必须符合批准语义');
  assert(scene.baseFailureRate === 55, '新场景基础失败率必须沿用批准值 55');
  assert(scene.relevantStats.length === 1 && scene.relevantStats[0] === 'martialPower', '新场景只使用功力判定');
  assert(
    scene.thresholds.martialPower?.qualified === 70 &&
      scene.thresholds.martialPower.excellent === 130 &&
      scene.thresholds.martialPower.failureRateReduction === 0.3,
    '新场景功力阈值必须与批准参数一致',
  );
  assert(
    scene.description?.includes('普通') === true &&
      scene.description.includes('非致命') &&
      scene.description.includes('比试'),
    '新场景描述必须明确为普通、非致命的江湖较量',
  );

  const duel = getChallengeScene('jianghu_duel');
  assert(duel?.baseFailureRate === 55, '既有 jianghu_duel 基础概率不得改变');
  assert(
    duel?.thresholds.martialPower?.qualified === 70 &&
      duel.thresholds.martialPower.excellent === 130 &&
      duel.thresholds.martialPower.failureRateReduction === 0.3,
    '既有 jianghu_duel 能力参数不得改变',
  );
  assert(duel.description === '江湖上的生死决斗，不成功便成仁', '既有 jianghu_duel 场景描述不得被替换');
}

function assertChallengeUsesExistingRules(): void {
  const scene = getChallengeScene(SCENE_ID);
  assert(scene !== undefined, '规则验证依赖正式新增场景');

  const oldTestMode = difficultyManager.config.testModeEnabled;
  const oldCoefficient = difficultyManager.config.failureProbabilityCoefficient;
  const event = getChallengeEvent();
  const choice = getChoice(ACCEPT_CHOICE_ID);
  const session = createSession(fixedRandom(0));
  const state = session.getRuntimeState();

  const assessAt = (martialPower: number) => {
    state.player!.martialPower = martialPower;
    const random = fixedRandom(0.6);
    const check = withRandomSourceSync(random, () => calculateFailureProbability(scene, state.player!, 1.0));
    assert(random.calls === 1, 'ChallengeSystem 概率评估每次只能抽取一次随机值');
    return check;
  };

  try {
    difficultyManager.config.testModeEnabled = false;
    difficultyManager.config.failureProbabilityCoefficient = 1.0;
    const insufficient = assessAt(69);
    const qualified = assessAt(70);
    const excellent = assessAt(130);
    assert(insufficient.abilityAssessment[0]?.status === 'insufficient', '低于 70 的功力必须按不足阈值处理');
    assert(insufficient.finalFailureRate === 66, '低于合格阈值时必须沿用既有 +20% 能力修正');
    assert(qualified.abilityAssessment[0]?.status === 'qualified', '功力 70 必须达到合格阈值');
    assert(qualified.finalFailureRate === 55, '合格阈值内必须采用基础失败率');
    assert(excellent.abilityAssessment[0]?.status === 'excellent', '功力 130 必须达到优秀阈值');
    assert(excellent.finalFailureRate === 38.5, '优秀阈值必须按 0.3 失败率修正');

    state.player!.martialPower = 70;
    const resolveWith = (randomValue: number, coefficient: number, testMode: boolean) => {
      difficultyManager.config.failureProbabilityCoefficient = coefficient;
      difficultyManager.config.testModeEnabled = testMode;
      const random = fixedRandom(randomValue);
      const resolved = withRandomSourceSync(random, () => resolveChoiceEffects(state, event, choice));
      assert(random.calls === 1, '正式 Choice Challenge 必须只进行一次随机判定');
      return resolved;
    };

    const ordinary = resolveWith(0.6, 1.0, false);
    const harder = resolveWith(0.6, 1.5, false);
    const testMode = resolveWith(0.6, 1.0, true);
    assert(ordinary?.outcomeId === choice.challenge?.success.id, '基础难度下 0.6 应命中成功分支');
    assert(harder?.outcomeId === choice.challenge?.failure.id, '全局难度系数必须改变挑战结果');
    assert(testMode?.outcomeId === choice.challenge?.failure.id, '测试模式 1.5 倍倍率必须继续作用于 Choice Challenge');
  } finally {
    difficultyManager.config.testModeEnabled = oldTestMode;
    difficultyManager.config.failureProbabilityCoefficient = oldCoefficient;
  }
}

async function assertNonNegativeReputationBoundary(): Promise<void> {
  const failedNearZero = await executeChoice(ACCEPT_CHOICE_ID, fixedRandom(0), { reputation: 4 });
  assert(
    failedNearZero.response.nextSnapshot.state.player.reputation === 0,
    '声望下限必须将失败结算裁剪到零',
  );
  assert(impactDelta(failedNearZero.response, 'reputation') === -4, '公开声望 delta 必须反映实际 -4 而非配置 -10');
  assertCanonicalImpactMatches(failedNearZero, 'reputation');
  assert(impactDelta(failedNearZero.response, 'martialPower') === 0, '边界失败不得执行成功功力效果');
  assert(
    !failedNearZero.response.feedback.player.narrativeResult?.includes('名望受损') &&
      !failedNearZero.response.feedback.player.narrativeResult?.includes('名望下降'),
    '失败叙事不得在声望下限处虚称发生了名望下降',
  );
  assert(failedNearZero.randomCallsUsed === 1, '边界失败仍只允许一次挑战抽签');
  assertSingleEventHistory(failedNearZero.response, '声望边界失败');
}

async function assertDecliningDoesNotChallenge(): Promise<void> {
  const declined = await executeChoice(DECLINE_CHOICE_ID, fixedRandom(0));
  assert(impactDelta(declined.response, 'chivalry') === 5, '婉拒必须保留原有侠义 +5 结果');
  assert(declined.response.nextSnapshot.state.player.chivalry === 35, '婉拒结果必须进入 canonical 状态');
  assert(declined.randomCallsUsed === 0, '婉拒不得消耗挑战随机数');
  assertCanonicalImpactMatches(declined, 'chivalry');
  assertSingleEventHistory(declined.response, '婉拒');
}

async function assertReplayUsesRecordedOutcome(): Promise<void> {
  const event = getChallengeEvent();
  const choice = getChoice(ACCEPT_CHOICE_ID);
  const challenge = choice.challenge;
  assert(challenge !== undefined, '回放验证需要正式 Challenge 分支');
  const oldTestMode = difficultyManager.config.testModeEnabled;
  difficultyManager.config.testModeEnabled = false;

  try {
    for (const scenario of [
      { originalRoll: 0.99, replayRoll: 0, result: challenge.success, branch: 'success' },
      { originalRoll: 0, replayRoll: 0.99, result: challenge.failure, branch: 'failure' },
    ]) {
      const original = await executeChoice(ACCEPT_CHOICE_ID, fixedRandom(scenario.originalRoll));
      const outcomeText = original.response.feedback.player.narrativeResult;
      assert(outcomeText === scenario.result.text, `原始 ${scenario.branch} 结果必须产生对应唯一叙事`);

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
        { playerName: '江湖高手比试回放测试', gender: 'male' },
        [record],
      );

      for (const stat of ['reputation', 'martialPower'] as const) {
        assert(
          replay.finalState.player?.[stat] === original.response.nextSnapshot.state.player[stat],
          `回放必须保留原 ${scenario.branch} 分支的 ${stat} 状态`,
        );
      }
      assert(
        replay.finalState.eventHistory.filter(entry => entry.eventId === EVENT_ID).length === 1,
        `回放 ${scenario.branch} 只能产生一条事件历史`,
      );
      assert(replay.outcomeTexts[0] === outcomeText, `回放 ${scenario.branch} 必须保留原始胜败叙事`);
      assert(replayRandom.calls === 0, `回放 ${scenario.branch} 不得重新随机抽签`);
    }
  } finally {
    difficultyManager.config.testModeEnabled = oldTestMode;
  }
}

export async function runJianghuChallengeTests(): Promise<void> {
  await assertControlledSuccessAndFailure();
  assertApprovedSceneAndEventConfiguration();
  assertChallengeUsesExistingRules();
  await assertNonNegativeReputationBoundary();
  await assertDecliningDoesNotChallenge();
  await assertReplayUsesRecordedOutcome();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runJianghuChallengeTests()
    .then(() => console.log('jianghuChallenge.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
