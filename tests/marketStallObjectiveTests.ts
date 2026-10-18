import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import {
  deriveMarketStallObjective,
  isMarketStallEventEligible,
} from '../src/core/marketStallObjective';
import type { GameState } from '../src/types/eventTypes';

function stateAt(
  currentTime: NonNullable<GameState['currentTime']>,
  flags: Record<string, unknown> = {},
  invitationTimestamp: NonNullable<GameState['eventHistory'][number]['timestamp']> | null = {
    year: 1,
    month: 1,
    day: 1,
  },
): GameState {
  const state = new GameEngineIntegration().getGameState();
  state.currentTime = currentTime;
  state.flags = flags;
  state.player.flags = { ...flags };
  state.eventHistory = invitationTimestamp === null
    ? []
    : [{ eventId: 'p138_market_stall_invitation', age: 16, timestamp: invitationTimestamp }];
  return state;
}

function acceptedState(currentTime: NonNullable<GameState['currentTime']>): GameState {
  return stateAt(currentTime, { p138_market_stall_accepted: true });
}

function testProjectionUsesSixCalendarMonthsAndDistinguishesExpiry(): void {
  const active = deriveMarketStallObjective(acceptedState({ year: 1, month: 6, day: 1 }));
  assert.equal(active?.status, 'active');
  assert.deepEqual(active?.deadline, { year: 1, month: 7, day: 1 });
  assert.equal(active?.canAttempt, true);

  const exactDeadline = deriveMarketStallObjective(acceptedState({ year: 1, month: 7, day: 1 }));
  assert.equal(exactDeadline?.status, 'expired');
  assert.equal(exactDeadline?.canAttempt, false);

  const insufficient = deriveMarketStallObjective(acceptedState({ year: 1, month: 6, day: 2 }));
  assert.equal(insufficient?.status, 'insufficient_time');
  assert.equal(insufficient?.canAttempt, false);
  assert.equal(insufficient?.canAbandon, true);
}

function testProjectionFailsClosedForConflictsAndInvalidCalendarDates(): void {
  const conflicting = acceptedState({ year: 1, month: 2, day: 1 });
  conflicting.flags.p138_market_stall_refused = true;
  const conflictProjection = deriveMarketStallObjective(conflicting);
  assert.equal(conflictProjection?.status, 'invalid');
  assert.ok(conflictProjection?.diagnostics.length);

  const completedAndAbandoned = acceptedState({ year: 1, month: 2, day: 1 });
  completedAndAbandoned.flags.p138_market_stall_attempted = true;
  completedAndAbandoned.flags.p138_market_stall_abandoned = true;
  assert.equal(deriveMarketStallObjective(completedAndAbandoned)?.status, 'invalid');

  const missingInvitation = stateAt(
    { year: 1, month: 2, day: 1 },
    { p138_market_stall_accepted: true },
    null,
  );
  assert.equal(deriveMarketStallObjective(missingInvitation)?.status, 'invalid');

  const invalidDate = acceptedState({ year: 1, month: 2, day: 1 });
  invalidDate.eventHistory[0].timestamp = { year: 1, month: 13, day: 1 };
  assert.equal(deriveMarketStallObjective(invalidDate)?.status, 'invalid');

  const unsafeDate = acceptedState({ year: 1, month: 2, day: 1 });
  unsafeDate.eventHistory[0].timestamp = { year: Number.MAX_SAFE_INTEGER, month: 1, day: 1 };
  assert.equal(deriveMarketStallObjective(unsafeDate)?.status, 'invalid');
}

function testOnlyAcceptedLiveObjectiveQualifiesForSupplyEvent(): void {
  const accepted = acceptedState({ year: 1, month: 2, day: 1 });
  assert.equal(isMarketStallEventEligible('p138_market_stall_supply', accepted), true);
  assert.equal(isMarketStallEventEligible('unrelated_event', accepted), false);

  const refused = stateAt(
    { year: 1, month: 2, day: 1 },
    { p138_market_stall_refused: true },
  );
  assert.equal(isMarketStallEventEligible('p138_market_stall_supply', refused), false);

  const supplied = acceptedState({ year: 1, month: 2, day: 1 });
  supplied.flags.p138_market_stall_supply_prepared = true;
  assert.equal(deriveMarketStallObjective(supplied)?.status, 'invalid');
  assert.equal(isMarketStallEventEligible('p138_market_stall_supply', supplied), false);

  const declinedSupply = acceptedState({ year: 1, month: 2, day: 1 });
  declinedSupply.eventHistory.push({ eventId: 'p138_market_stall_supply', age: 16 });
  assert.equal(deriveMarketStallObjective(declinedSupply)?.canAttempt, true);
  assert.equal(isMarketStallEventEligible('p138_market_stall_supply', declinedSupply), false);
  // Reading the same declined opportunity again must not reopen it.
  assert.equal(isMarketStallEventEligible('p138_market_stall_supply', declinedSupply), false);
}

function testInvitationAgeAndCalendarBoundaries(): void {
  for (const [age, expected] of [[16, true], [25, true], [26, false]] as const) {
    const candidate = new GameEngineIntegration().getGameState();
    candidate.player.age = age;
    candidate.currentTime = { year: 1, month: 12, day: 30 };
    assert.equal(
      isMarketStallEventEligible('p138_market_stall_invitation', candidate),
      expected,
      `invitation eligibility at age ${age}`,
    );
  }

  const yearEnd = stateAt({ year: 2, month: 1, day: 30 }, { p138_market_stall_accepted: true }, {
    year: 1, month: 7, day: 30,
  });
  assert.deepEqual(deriveMarketStallObjective(yearEnd)?.deadline, { year: 2, month: 1, day: 30 });

  const beforeInvite = acceptedState({ year: 1, month: 1, day: 1 });
  beforeInvite.eventHistory[0].timestamp = { year: 1, month: 2, day: 1 };
  assert.equal(deriveMarketStallObjective(beforeInvite)?.status, 'invalid');

  const duplicateInvite = acceptedState({ year: 1, month: 2, day: 1 });
  duplicateInvite.eventHistory.push({
    eventId: 'p138_market_stall_invitation', age: 16,
    timestamp: { year: 1, month: 1, day: 1 },
  });
  assert.equal(deriveMarketStallObjective(duplicateInvite)?.status, 'invalid');

  const orphanInviteFacts = new GameEngineIntegration().getGameState();
  orphanInviteFacts.player.age = 16;
  orphanInviteFacts.currentTime = { year: 1, month: 1, day: 1 };
  orphanInviteFacts.flags.p138_market_stall_attempted = true;
  assert.equal(isMarketStallEventEligible('p138_market_stall_invitation', orphanInviteFacts), false);
}

async function testFormalInvitationHistoryCapturesPreEffectCalendarDate(): Promise<void> {
  const engine = new GameEngineIntegration();
  const gameState = engine.getGameState();
  gameState.player.age = 16;
  gameState.currentTime = { year: 7, month: 12, day: 30 };

  await engine.executeChoiceEffects(
    [{ type: 'time_advance', value: 1, timeUnit: 'month' }],
    'p138_market_stall_invitation',
    'accept_invitation',
  );

  assert.deepEqual(gameState.eventHistory.at(-1)?.timestamp, { year: 7, month: 12, day: 30 });
  assert.deepEqual(gameState.currentTime, { year: 8, month: 1, day: 30 });
}

async function testAge26CanFinishExactlyAtTheDeadline(): Promise<void> {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = 26;
  state.currentTime = { year: 2, month: 3, day: 30 };
  state.flags.p138_market_stall_accepted = true;
  state.eventHistory.push({
    eventId: 'p138_market_stall_invitation', age: 25,
    timestamp: { year: 1, month: 10, day: 30 },
  });
  assert.equal(isMarketStallEventEligible('p138_market_stall_supply', state), true);
  const before = state.player.businessAcumen;
  await engine.executeMarketStallOperation('attempt');
  assert.deepEqual(state.currentTime, { year: 2, month: 4, day: 30 });
  assert.deepEqual(deriveMarketStallObjective(state)?.deadline, state.currentTime);
  assert.equal(deriveMarketStallObjective(state)?.status, 'completed');
  assert.equal(state.player.businessAcumen - before, 1);
  assert.equal(isMarketStallEventEligible('p138_market_stall_supply', state), false);
}

async function testAttemptAndAbandonUseOnlyApprovedEffects(): Promise<void> {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.currentTime = { year: 1, month: 1, day: 1 };
  state.flags.p138_market_stall_accepted = true;
  state.eventHistory.push({
    eventId: 'p138_market_stall_invitation',
    age: 16,
    timestamp: { year: 1, month: 1, day: 1 },
  });
  const beforeAcumen = state.player.businessAcumen;
  const beforeCharisma = state.player.charisma;
  const beforeReputation = state.player.reputation;
  const beforeWealthCapacity = state.player.wealthCapacity;
  const beforeMerchantNetwork = state.player.merchantNetwork;
  const beforeFacts = { ...state.facts };
  const beforeFlags = { ...state.flags };
  const summary = await engine.executeMarketStallOperation('attempt');
  assert.equal(state.player.businessAcumen - beforeAcumen, 1);
  assert.deepEqual(state.currentTime, { year: 1, month: 2, day: 1 });
  assert.equal(state.flags.p138_market_stall_attempted, true);
  assert.equal(state.player.lifeStates.businessHabit, 0);
  assert.equal(state.actionHistory?.length ?? 0, 0);
  assert.equal(state.player.charisma, beforeCharisma);
  assert.equal(state.player.reputation, beforeReputation);
  assert.equal(state.player.wealthCapacity, beforeWealthCapacity);
  assert.equal(state.player.merchantNetwork, beforeMerchantNetwork);
  assert.deepEqual(state.facts, beforeFacts);
  assert.deepEqual(
    Object.keys(state.flags).filter(key => state.flags[key] !== beforeFlags[key]),
    ['p138_market_stall_attempted'],
  );
  assert.match(summary?.resultExplanation ?? '', /此次试摊已经完成/);
  assert.equal(deriveMarketStallObjective(state)?.status, 'completed');

  const preparedEngine = new GameEngineIntegration();
  const prepared = preparedEngine.getGameState();
  prepared.currentTime = { year: 1, month: 1, day: 1 };
  prepared.flags.p138_market_stall_accepted = true;
  prepared.flags.p138_market_stall_supply_prepared = true;
  prepared.eventHistory.push({
    eventId: 'p138_market_stall_invitation',
    age: 16,
    timestamp: { year: 1, month: 1, day: 1 },
  });
  prepared.eventHistory.push({ eventId: 'p138_market_stall_supply', age: 16 });
  const preparedBefore = prepared.player.businessAcumen;
  const preparedHabit = prepared.player.lifeStates.businessHabit;
  await preparedEngine.executeMarketStallOperation('attempt');
  assert.equal(prepared.player.businessAcumen - preparedBefore, 2);
  assert.equal(prepared.player.lifeStates.businessHabit, preparedHabit);

  const abandonEngine = new GameEngineIntegration();
  const abandon = abandonEngine.getGameState();
  abandon.currentTime = { year: 1, month: 1, day: 1 };
  abandon.flags.p138_market_stall_accepted = true;
  abandon.eventHistory.push({
    eventId: 'p138_market_stall_invitation',
    age: 16,
    timestamp: { year: 1, month: 1, day: 1 },
  });
  const beforeAbandonTime = { ...abandon.currentTime };
  assert.equal(await abandonEngine.executeMarketStallOperation('abandon'), null);
  assert.deepEqual(abandon.currentTime, beforeAbandonTime);
  assert.equal(abandon.flags.p138_market_stall_abandoned, true);
  assert.equal(abandon.actionHistory?.length ?? 0, 0);
  assert.equal(deriveMarketStallObjective(abandon)?.status, 'abandoned');

  const invalidOperationEngine = new GameEngineIntegration();
  await assert.rejects(
    invalidOperationEngine.executeMarketStallOperation('invalid' as never),
    /Unknown market stall operation/,
  );

  const insufficientAbandonEngine = new GameEngineIntegration();
  const insufficientAbandon = insufficientAbandonEngine.getGameState();
  insufficientAbandon.currentTime = { year: 1, month: 6, day: 2 };
  insufficientAbandon.flags.p138_market_stall_accepted = true;
  insufficientAbandon.eventHistory.push({
    eventId: 'p138_market_stall_invitation', age: 16,
    timestamp: { year: 1, month: 1, day: 1 },
  });
  assert.equal(deriveMarketStallObjective(insufficientAbandon)?.canAbandon, true);
  assert.equal(await insufficientAbandonEngine.executeMarketStallOperation('abandon'), null);
  assert.equal(insufficientAbandon.flags.p138_market_stall_abandoned, true);
}

await testFormalInvitationHistoryCapturesPreEffectCalendarDate();
await testAge26CanFinishExactlyAtTheDeadline();
await testAttemptAndAbandonUseOnlyApprovedEffects();
testProjectionUsesSixCalendarMonthsAndDistinguishesExpiry();
testProjectionFailsClosedForConflictsAndInvalidCalendarDates();
testOnlyAcceptedLiveObjectiveQualifiesForSupplyEvent();
testInvitationAgeAndCalendarBoundaries();
console.log('✅ Market stall objective tests passed');
