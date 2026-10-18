import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { mapSessionProgression } from '../../server/src/services/sessionProgressionMapper';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function objectiveSnapshot() {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '试摊测试',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 17,
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 20;
  snapshot.state.player.alive = true;
  snapshot.state.currentTime = { year: 3, month: 1, day: 1 };
  snapshot.state.flags.p138_market_stall_accepted = true;
  snapshot.state.eventHistory = [
    {
      eventId: 'p138_market_stall_invitation',
      age: 20,
      timestamp: { year: 2, month: 12, day: 1 },
    },
  ];
  delete snapshot.state.pendingStoryEventId;
  return snapshot;
}

function invitationSnapshot() {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '邀请测试',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 19,
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 20;
  snapshot.state.currentTime = { year: 3, month: 1, day: 1 };
  snapshot.state.eventHistory = [];
  delete snapshot.state.pendingStoryEventId;
  return snapshot;
}

export async function runMarketStallSessionTests(): Promise<void> {
  const original = objectiveSnapshot();
  const restored = HeadlessEngineSessionImpl.create({ snapshot: original });
  const restoredAgain = HeadlessEngineSessionImpl.create({ snapshot: restored.serialize() });
  const firstProjection = mapSessionProgression(
    restored,
    1,
    'snapshot-1',
    null,
    restored.getLifeMemory(),
  ).marketStallObjective;
  const restoredProjection = mapSessionProgression(
    restoredAgain,
    2,
    'snapshot-2',
    null,
    restoredAgain.getLifeMemory(),
  ).marketStallObjective;
  assert(firstProjection?.status === 'active', 'accepted objective is projected as active');
  assert(
    JSON.stringify(firstProjection) === JSON.stringify(restoredProjection),
    'objective projection must survive snapshot restoration unchanged',
  );

  const session = HeadlessEngineSessionImpl.create({ snapshot: objectiveSnapshot() });
  const beforeAttempt = session.getRuntimeState().currentTime;
  await session.executeMarketStallAction('attempt');
  assert(session.getSessionPhase() === 'action_summary', 'attempt requires a single result acknowledgement');
  assert(
    session.getRuntimeState().currentTime?.month === (beforeAttempt?.month === 12 ? 1 : (beforeAttempt?.month ?? 0) + 1),
    'attempt advances the game calendar by exactly one month',
  );
  const engine = (session as unknown as { engine: { selectEvent: () => unknown } }).engine;
  const selectEvent = engine.selectEvent.bind(engine);
  let schedulerSelections = 0;
  engine.selectEvent = () => {
    schedulerSelections += 1;
    return selectEvent();
  };
  await session.acknowledgeProgression('action_summary');
  assert(schedulerSelections <= 1, 'result acknowledgement grants at most one scheduler selection');
  assert(session.getSessionPhase() !== 'action_summary', 'one acknowledgement clears the attempt result');
  let repeatedAckRejected = false;
  try {
    await session.acknowledgeProgression('action_summary');
  } catch {
    repeatedAckRejected = true;
  }
  assert(repeatedAckRejected, 'the same attempt result cannot be acknowledged twice');

  const abandonSession = HeadlessEngineSessionImpl.create({ snapshot: objectiveSnapshot() });
  const beforeAbandon = { ...abandonSession.getRuntimeState().currentTime! };
  await abandonSession.executeMarketStallAction('abandon');
  assert(
    JSON.stringify(abandonSession.getRuntimeState().currentTime) === JSON.stringify(beforeAbandon),
    'abandon must not advance game time',
  );
  assert(abandonSession.getSessionPhase() === 'active_planning', 'abandon returns directly to planning');

  const invalidPhaseSession = HeadlessEngineSessionImpl.create({ snapshot: objectiveSnapshot() });
  invalidPhaseSession.applyProgressionVolatileState({
    ...invalidPhaseSession.getProgressionVolatileState(),
    pendingActionSummary: {
      sourceLabel: '测试结果',
      actionName: '待确认行动',
      durationLabel: '1个月',
      rewardSummary: '',
      costSummary: '',
      riskSummary: '',
      nextStepHint: '',
    },
  });
  let invalidPhaseRejected = false;
  try {
    await invalidPhaseSession.executeMarketStallAction('attempt');
  } catch {
    invalidPhaseRejected = true;
  }
  assert(invalidPhaseRejected, 'market stall action must not cross an unconfirmed progression result');
  const phaseNarrowedProjection = mapSessionProgression(
    invalidPhaseSession,
    3,
    'snapshot-3',
    null,
    invalidPhaseSession.getLifeMemory(),
  ).marketStallObjective;
  assert(
    phaseNarrowedProjection?.canAttempt === false && phaseNarrowedProjection.canAbandon === false,
    'read-only objective actions are unavailable outside active_planning',
  );

  const invalidOperationSession = HeadlessEngineSessionImpl.create({ snapshot: objectiveSnapshot() });
  let invalidOperationRejected = false;
  try {
    await invalidOperationSession.executeMarketStallAction('unexpected' as 'attempt');
  } catch {
    invalidOperationRejected = true;
  }
  assert(invalidOperationRejected, 'runtime input must reject operation values outside the closed union');

  for (const [eventId, choiceId, snapshot] of [
    ['p138_market_stall_invitation', 'accept_market_stall', invitationSnapshot()],
    ['p138_market_stall_supply', 'prepare_market_stall_supply', objectiveSnapshot()],
  ] as const) {
    const forgedChoiceSession = HeadlessEngineSessionImpl.create({ snapshot });
    let forgedChoiceRejected = false;
    try {
      await forgedChoiceSession.executeChoice({
        requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
        snapshotRef: { snapshot: forgedChoiceSession.serialize() },
        action: { eventId, choiceId },
      });
    } catch {
      forgedChoiceRejected = true;
    }
    assert(forgedChoiceRejected, `${eventId} cannot be loaded solely from the requested event ID`);
  }
}
