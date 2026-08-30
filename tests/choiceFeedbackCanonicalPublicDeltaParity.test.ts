/**
 * Choice feedback must show canonical actual public deltas when before/after
 * player snapshots are reliable — not configured effect values.
 */
import { generateChoiceFeedback } from '../src/core/ChoiceFeedbackGenerator';
import { calculatePublicStatDeltas } from '../src/core/activePlanning/periodSummaryBuilder';
import { cloneCanonicalGameState } from '../src/contracts/validation/canonicalGameStateValidation';
import { gameEngine } from '../src/core/GameEngineIntegration';
import { useNewGameEngine } from '../src/composables/useNewGameEngine';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import { EffectType, type PlayerState } from '../src/types/eventTypes';
import type { GameState } from '../src/types';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function basePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    name: '反馈一致性',
    age: 28,
    gender: 'male',
    martialPower: 10,
    chivalry: 10,
    constitution: 10,
    reputation: 73,
    knowledge: 10,
    charisma: 10,
    businessAcumen: 0,
    influence: 0,
    connections: 20,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    wealthCapacity: 'no_surplus',
    affiliation: null,
    title: null,
    flags: {},
    events: [],
    relationships: [],
    children: 0,
    spouse: null,
    alive: true,
    healthStatus: 'healthy',
    statuses: [],
    investments: [],
    traits: [],
    lifeStates: {
      trainingHabit: 0,
      studyHabit: 0,
      businessHabit: 0,
    },
    ...overrides,
  };
}

function impactDelta(feedback: ReturnType<typeof generateChoiceFeedback>, stat: string): number | undefined {
  return feedback.player.statImpacts.find(item => item.stat === stat)?.delta;
}

console.log('=== Choice Feedback Canonical Public Delta Parity ===\n');

{
  // Evidence pattern: missing operator / EventExecutor set semantics
  // before reputation=73, configured value=-50 (no operator), after=-50 → display -123
  const before = basePlayer({ reputation: 73 });
  const after = basePlayer({ reputation: -50 });
  const feedback = generateChoiceFeedback({
    narrativeResult: '朝廷的棋局',
    effects: [
      { type: EffectType.STAT_MODIFY, target: 'reputation', value: -50 },
    ],
    beforePlayer: before,
    afterPlayer: after,
  });
  assertEqual(impactDelta(feedback, 'reputation'), -123, 'missing-operator set must show actual after-before');
  assert(
    !feedback.player.statImpacts.some(item => item.stat === 'reputation' && item.delta === -50),
    'must not display configured set value as additive delta',
  );
  assertEqual(
    impactDelta(feedback, 'reputation'),
    calculatePublicStatDeltas(before, after).reputation,
    'must equal calculatePublicStatDeltas',
  );
  console.log('✓ Test 1 — missing operator / set semantics');
}

{
  const before = basePlayer({ martialPower: 10 });
  const after = basePlayer({ martialPower: 18 });
  const feedback = generateChoiceFeedback({
    narrativeResult: '成长结算',
    effects: [
      { type: EffectType.STAT_MODIFY, target: 'martialPower', value: 5, operator: 'add' },
    ],
    beforePlayer: before,
    afterPlayer: after,
  });
  assertEqual(impactDelta(feedback, 'martialPower'), 8, 'growth-adjusted actual delta must be shown');
  console.log('✓ Test 2 — growth-adjusted actual result');
}

{
  const before = basePlayer({ reputation: 5 });
  const after = basePlayer({ reputation: 0 });
  const feedback = generateChoiceFeedback({
    narrativeResult: '钳制',
    effects: [
      { type: EffectType.STAT_MODIFY, target: 'reputation', value: 20, operator: 'subtract' },
    ],
    beforePlayer: before,
    afterPlayer: after,
  });
  assertEqual(impactDelta(feedback, 'reputation'), -5, 'clamp must show actual final delta');
  console.log('✓ Test 3 — clamp');
}

{
  const before = basePlayer({ chivalry: 40 });
  const after = basePlayer({ chivalry: 40 });
  const feedback = generateChoiceFeedback({
    narrativeResult: '无变化',
    effects: [
      { type: EffectType.STAT_MODIFY, target: 'chivalry', value: 10, operator: 'add' },
    ],
    beforePlayer: before,
    afterPlayer: after,
  });
  assert(
    feedback.player.statImpacts.every(item => item.stat !== 'chivalry'),
    'zero actual delta must omit statImpact',
  );
  console.log('✓ Test 4 — zero actual delta');
}

{
  const before = basePlayer({ connections: 10 });
  const after = basePlayer({ connections: 17 });
  const feedback = generateChoiceFeedback({
    narrativeResult: '多人脉效果',
    effects: [
      { type: EffectType.STAT_MODIFY, target: 'connections', value: 5, operator: 'add' },
      { type: EffectType.STAT_MODIFY, target: 'connections', value: 3, operator: 'add' },
    ],
    beforePlayer: before,
    afterPlayer: after,
  });
  const connectionImpacts = feedback.player.statImpacts.filter(item => item.stat === 'connections');
  assertEqual(connectionImpacts.length, 1, 'multiple effects must aggregate to one impact');
  assertEqual(connectionImpacts[0]?.delta, 7, 'aggregate must equal after-before');
  console.log('✓ Test 5 — multiple effects / aggregate actual delta');
}

{
  const feedback = generateChoiceFeedback({
    narrativeResult: '兼容回退',
    effects: [
      { type: EffectType.STAT_MODIFY, target: 'reputation', value: -50 },
    ],
  });
  assertEqual(
    impactDelta(feedback, 'reputation'),
    -50,
    'without snapshots, missing operator still uses effect-based add fallback',
  );
  console.log('✓ Test 6 — compatibility fallback');
}

{
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '浏览器快照',
    gender: 'male',
    catalogVersion: '1.0.0',
  });
  const liveState = cloneCanonicalGameState(bootstrap.serialize().state as unknown as GameState);
  liveState.player.reputation = 73;
  liveState.flags = { ...liveState.flags, sect_faction: 'orthodox' };
  liveState.player.flags = { ...liveState.player.flags, sect_faction: 'orthodox' };

  const engine = useNewGameEngine();
  const originalGetGameState = gameEngine.getGameState;
  const originalExecuteChoiceEffects = gameEngine.executeChoiceEffects;
  const originalRaf = globalThis.requestAnimationFrame;

  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  }) as typeof requestAnimationFrame;

  try {
    (gameEngine as any).getGameState = () => liveState;
    (gameEngine as any).executeChoiceEffects = async () => {
      // In-place mutation of the live reactive reference (real engine behavior).
      liveState.player.reputation = -50;
      liveState.flags.sect_faction = 'demonic';
      liveState.player.flags = { ...liveState.player.flags, sect_faction: 'demonic' };
      return liveState;
    };

    (engine.engineState as any).currentEvent = {
      id: 'browser_detached_feedback_event',
      eventType: 'choice',
      content: { title: '朝廷的棋局' },
      choices: [
        {
          id: 'accept_court_plot',
          text: '入局',
          effects: [],
          outcomes: [
            {
              id: 'court_set_reputation',
              text: '你的名望被朝廷重新定义。',
              effects: [
                { type: EffectType.STAT_MODIFY, target: 'reputation', value: -50 },
              ],
            },
          ],
        },
      ],
    };

    const handled = await engine.handleChoice({ id: 'accept_court_plot' } as any);
    assert(handled, 'browser choice should execute');
    const feedback = engine.engineState.lastChoiceFeedback;
    assert(feedback !== null, 'browser choice must produce feedback');
    assertEqual(
      impactDelta(feedback!, 'reputation'),
      -123,
      'browser path must use detached before snapshot for actual delta',
    );
    assertEqual(liveState.player.reputation, -50, 'live state must reflect settlement');
  } finally {
    (gameEngine as any).getGameState = originalGetGameState;
    (gameEngine as any).executeChoiceEffects = originalExecuteChoiceEffects;
    globalThis.requestAnimationFrame = originalRaf;
    (engine.engineState as any).currentEvent = null;
    engine.engineState.lastOutcomeText = null;
    engine.engineState.lastEffects = [];
    (engine.engineState as any).lastChoiceFeedback = null;
  }
  console.log('✓ Browser detached-state regression');
}

{
  const before = basePlayer({ reputation: 73, connections: 20 });
  const after = basePlayer({ reputation: -50, connections: -92 });
  const canonical = calculatePublicStatDeltas(before, after);
  const sharedInput = {
    narrativeResult: '朝廷的棋局',
    effects: [
      { type: EffectType.STAT_MODIFY, target: 'reputation', value: -50 },
      { type: EffectType.STAT_MODIFY, target: 'connections', value: 20, operator: 'add' },
    ],
    beforePlayer: before,
    afterPlayer: after,
  };
  const browserLike = generateChoiceFeedback(sharedInput);
  const headlessLike = generateChoiceFeedback(sharedInput);

  for (const [stat, delta] of Object.entries(canonical)) {
    assertEqual(impactDelta(browserLike, stat), delta, `browser-like ${stat} must match canonical`);
    assertEqual(impactDelta(headlessLike, stat), delta, `headless-like ${stat} must match canonical`);
  }
  assertEqual(
    impactDelta(browserLike, 'reputation'),
    impactDelta(headlessLike, 'reputation'),
    'Browser/Headless reputation parity',
  );
  assertEqual(
    impactDelta(browserLike, 'connections'),
    impactDelta(headlessLike, 'connections'),
    'Browser/Headless connections parity',
  );
  console.log('✓ canonical generator consistency regression');
}

{
  // Relationship / flag feedback must survive actual-delta mode
  const before = basePlayer({ reputation: 73 });
  const after = basePlayer({
    reputation: -50,
    relationships: [{ id: 'mentor_master', name: '师父', affinity: 40 } as any],
  });
  const feedback = generateChoiceFeedback({
    narrativeResult: '保留非属性反馈',
    effects: [
      { type: EffectType.STAT_MODIFY, target: 'reputation', value: -50 },
      { type: EffectType.RELATION_CHANGE, target: 'mentor_master', value: 5 },
      { type: EffectType.FLAG_SET, target: 'long_term_oath' },
    ],
    beforePlayer: before,
    afterPlayer: after,
    beforeFlags: { sect_faction: 'orthodox' },
    afterFlags: { sect_faction: 'demonic' },
  });
  assertEqual(impactDelta(feedback, 'reputation'), -123, 'stat still actual-delta');
  assertEqual(feedback.player.relationshipImpacts[0]?.relationId, 'mentor_master', 'relationship preserved');
  assert(
    feedback.player.longTermFlags.some(item => item.flag === 'long_term_oath'),
    'flag feedback preserved',
  );
  assertEqual(feedback.player.routeImpact?.from, 'orthodox', 'route from preserved');
  assertEqual(feedback.player.routeImpact?.to, 'demonic', 'route to preserved');
  assert(
    feedback.diagnostic.rawEffects.some(effect => effect.type === EffectType.STAT_MODIFY),
    'configured effects remain diagnostic',
  );
  console.log('✓ non-stat feedback preserved in actual-delta mode');
}

console.log('\n=== Choice Feedback Canonical Public Delta Parity Passed ===');
