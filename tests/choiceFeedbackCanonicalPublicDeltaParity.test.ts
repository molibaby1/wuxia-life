/**
 * Choice feedback must show canonical actual public deltas when before/after
 * player snapshots are reliable — not configured effect values.
 */
import { generateChoiceFeedback } from '../src/core/ChoiceFeedbackGenerator';
import { calculatePublicStatDeltas } from '../src/core/activePlanning/periodSummaryBuilder';
import { EffectType, type PlayerState } from '../src/types/eventTypes';

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
  const feedback = generateChoiceFeedback(sharedInput);

  for (const [stat, delta] of Object.entries(canonical)) {
    assertEqual(impactDelta(feedback, stat), delta, `${stat} must match canonical public delta`);
  }
  console.log('✓ canonical public delta consistency regression');
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

console.log('\n=== Choice Feedback Canonical Public Delta Passed ===');
