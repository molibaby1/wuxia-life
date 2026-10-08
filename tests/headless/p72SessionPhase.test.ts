import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import { HeadlessProgressionError } from '../../src/headless/session/sessionTypes';
import { GameEngineIntegration } from '../../src/core/GameEngineIntegration';
import { executeActiveActionOnState } from '../../src/core/activePlanning/ActivePlanningService';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution';
import { shouldPreferStoryGapPassiveBeforePlanning } from '../../src/p16/childhoodAgency';
import { ensureProgressionCatchUp, progressUntilChoiceOrTerminal } from '../../src/headless/progressionLoop';
import { resolveSessionAfterAutoProgress } from '../../server/src/services/headlessRuntime';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function snapshotAtAge(age: number, overrides?: Partial<{ charisma: number; connections: number }>): GameStateSnapshot {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '测试',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 1,
  });
  const snap = bootstrap.serialize();
  snap.state.player.age = age;
  snap.state.player.alive = true;
  snap.state.player.connections = overrides?.connections ?? 0;
  snap.state.player.affiliation = null;
  snap.state.eventHistory = [];
  snap.state.player.events = [];
  if (overrides?.charisma !== undefined) {
    snap.state.player.charisma = overrides.charisma;
  }
  return snap;
}

async function hydrateAtAge(
  age: number,
  randomSeed = 42,
  snapshotOverrides?: Partial<{ charisma: number; connections: number }>,
) {
  const session = HeadlessEngineSessionImpl.create({
    playerName: '规划侠客',
    gender: 'male',
    randomSeed,
    catalogVersion: '1.0.0',
  });
  await session.hydrate(snapshotAtAge(age, snapshotOverrides));
  return session;
}

export async function runP72SessionPhaseTests(): Promise<void> {
  const planningSnapshot = snapshotAtAge(16, { connections: 5 });
  const planningSession = HeadlessEngineSessionImpl.create({ snapshot: planningSnapshot });
  const apiPlanningSession = HeadlessEngineSessionImpl.create({ snapshot: planningSnapshot });
  const planningEngine = (planningSession as unknown as { engine: GameEngineIntegration }).engine;
  const apiEngine = (apiPlanningSession as unknown as { engine: GameEngineIntegration }).engine;
  const ordinaryFormalEvent = planningEngine.getAvailableEvents(16).find(event => {
    const tags = (event.metadata?.tags ?? []).map(tag => tag.toLowerCase());
    return event.category !== 'daily_event' &&
      !tags.some(tag => ['critical', 'mandatory', 'mainline'].includes(tag)) &&
      Boolean(event.choices?.length);
  });
  const dailyEvent = planningEngine.getAvailableEvents(16).find(event =>
    event.category === 'daily_event' || event.metadata?.tags?.includes('daily_pool'),
  );
  assert(ordinaryFormalEvent, 'age-16 state has an ordinary formal event candidate');
  assert(dailyEvent, 'age-16 state has a daily event candidate');
  assert(planningSession.getPlanningOptions().length === 5, 'age 16 has five active planning options');
  assert(apiPlanningSession.getPlanningOptions().length === 5, 'API equivalent state has the same five options');
  for (let age = 13; age <= 28; age += 1) {
    const ageSession = await hydrateAtAge(age, 77, { connections: 5 });
    assert(
      ageSession.getSessionPhase() === 'active_planning',
      `legal age-${age} state remains in active planning`,
    );
    assert(
      ageSession.getPlanningOptions().length > 0,
      `legal age-${age} state exposes an active action`,
    );
  }

  const forcedSnapshot = snapshotAtAge(10);
  forcedSnapshot.state.flags = { externalFocus: true };
  forcedSnapshot.state.player.flags = forcedSnapshot.state.flags;
  const forcedPlanningSession = HeadlessEngineSessionImpl.create({ snapshot: forcedSnapshot });
  const forcedPlanningEngine = (forcedPlanningSession as unknown as { engine: GameEngineIntegration }).engine;
  assert(
    forcedPlanningEngine.getAvailableEvents(10).some(event => event.id === 'martial_focus_payoff'),
    'age-10 forced-event fixture uses an eligible catalog event',
  );
  assert(forcedPlanningSession.getPlanningOptions().length > 0, 'age-10 forced-event fixture has valid actions');
  assert(
    forcedPlanningSession.getSessionPhase() === 'story_event',
    'a pending forced event takes precedence over childhood active planning',
  );
  const forcedEvent = await forcedPlanningSession.getNextEvent();
  assert(forcedEvent?.eventId === 'martial_focus_payoff', 'the existing forced event is selected');

  const forcedAfterResultSession = HeadlessEngineSessionImpl.create({ snapshot: forcedSnapshot });
  const forcedAfterResultEngine = (forcedAfterResultSession as unknown as { engine: GameEngineIntegration }).engine;
  const forcedAfterResultVolatile = (
    forcedAfterResultSession as unknown as {
      volatile: {
        pendingPeriodSummary: {
          sourceLabel: string;
          headline: string;
          body: string;
          statDeltaSummary: string;
          narrativeText: string;
        } | null;
      };
    }
  ).volatile;
  forcedAfterResultVolatile.pendingPeriodSummary = {
    sourceLabel: '剧情抉择',
    headline: '事件结果',
    body: '等待确认的既有事件结果',
    statDeltaSummary: '',
    narrativeText: '',
  };
  assert(forcedAfterResultEngine.hasPendingForcedEvent(), 'the confirmed-result fixture has a pending forced event');
  await forcedAfterResultSession.acknowledgeProgression('period_summary');
  assert(
    forcedAfterResultSession.getCurrentEvent()?.id === 'martial_focus_payoff',
    'event-result confirmation resolves the pending forced event before returning to planning',
  );

  const catchUpSession = await hydrateAtAge(16, 77, { connections: 5 });
  const catchUpEngine = (catchUpSession as unknown as { engine: GameEngineIntegration }).engine;
  let catchUpSchedulerCalls = 0;
  let catchUpSchedulerTime: string | null = null;
  catchUpEngine.selectEvent = () => {
    catchUpSchedulerCalls += 1;
    catchUpSchedulerTime = JSON.stringify(catchUpEngine.getGameState().currentTime);
    return ordinaryFormalEvent;
  };
  const catchUpStartTime = JSON.stringify(catchUpSession.getRuntimeState().currentTime);
  await ensureProgressionCatchUp(catchUpSession, 16);
  assert(catchUpSchedulerCalls === 1, 'P8 year catch-up grants one ordinary scheduler opportunity');
  assert(catchUpSchedulerTime !== catchUpStartTime, 'catch-up scheduler runs after time advances');
  assert(catchUpSession.getSessionPhase() === 'story_event', 'catch-up can surface a selected formal event');

  let planningSchedulerCalls = 0;
  planningEngine.selectEvent = () => {
    planningSchedulerCalls += 1;
    return ordinaryFormalEvent;
  };
  let apiSchedulerCalls = 0;
  apiEngine.selectEvent = () => {
    apiSchedulerCalls += 1;
    return ordinaryFormalEvent;
  };
  await progressUntilChoiceOrTerminal(planningSession);
  assert(
    planningSession.getSessionPhase() === 'active_planning',
    'headless prefetch preserves valid age-16 planning',
  );
  assert(planningSession.getCurrentEvent() === null, 'planning prefetch does not choose an event');
  assert((await planningSession.getNextEvent()) === null, 'direct event reads preserve valid planning');
  assert((await planningSession.getNextEvent()) === null, 'repeated event reads do not select an event');
  const apiResolution = await resolveSessionAfterAutoProgress(apiPlanningSession);
  assert(apiResolution.phase === 'active_planning', 'API resolution preserves equivalent planning phase');
  assert(apiResolution.nextEvent === null, 'API resolution does not prefetch over planning');
  assert(planningSchedulerCalls === 0 && apiSchedulerCalls === 0, 'planning reads grant no scheduler opportunity');

  const actionSchedulingSession = await hydrateAtAge(16, 77, { connections: 5 });
  const actionSchedulingEngine = (actionSchedulingSession as unknown as { engine: GameEngineIntegration }).engine;
  let actionSchedulerCalls = 0;
  const actionSchedulerTimes: string[] = [];
  actionSchedulingEngine.selectEvent = () => {
    actionSchedulerCalls += 1;
    actionSchedulerTimes.push(JSON.stringify(actionSchedulingEngine.getGameState().currentTime));
    return ordinaryFormalEvent;
  };
  const actionStartTime = JSON.stringify(actionSchedulingSession.getRuntimeState().currentTime);
  await actionSchedulingSession.executeActiveAction('action_training_basic');
  assert(actionSchedulerCalls === 0, 'action execution alone does not schedule an event');
  await actionSchedulingSession.acknowledgeProgression('action_summary');
  if (actionSchedulingSession.getSessionPhase() === 'disturbance_narrative') {
    assert(actionSchedulerCalls === 0, 'interruption result must be acknowledged before scheduling');
    await actionSchedulingSession.acknowledgeProgression('disturbance');
  }
  assert(actionSchedulerCalls === 1, 'confirmed active action grants one scheduler opportunity');
  assert(actionSchedulerTimes[0] !== actionStartTime, 'scheduler runs after active-action time advances');
  const scheduledFormal = actionSchedulingSession.describePendingEvent();
  assert(scheduledFormal?.eventId === ordinaryFormalEvent.id, 'legal scheduler boundary may select a formal event');
  const sameFormal = await actionSchedulingSession.getNextEvent();
  assert(sameFormal?.eventId === ordinaryFormalEvent.id, 're-reading a selected event preserves its identity');
  assert(actionSchedulerCalls === 1, 're-reading a selected event does not rerun the scheduler');
  assert(
    actionSchedulingSession.serialize().state.pendingStoryEventId === ordinaryFormalEvent.id,
    'selected formal event is represented by the existing snapshot field',
  );
  const availableChoice = scheduledFormal.raw.choices?.find(choice =>
    !choice.condition || actionSchedulingEngine.isChoiceAvailable(choice.condition),
  );
  assert(availableChoice, 'selected formal event has an available choice');
  await actionSchedulingSession.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: actionSchedulingSession.serialize() },
    action: { eventId: scheduledFormal.eventId, choiceId: availableChoice.id },
  });
  assert(actionSchedulingSession.getSessionPhase() === 'period_summary', 'selected event result awaits confirmation');
  await actionSchedulingSession.acknowledgeProgression('period_summary');
  assert(
    actionSchedulingSession.serialize().state.pendingStoryEventId === undefined,
    'resolved event is removed from the pending snapshot field',
  );
  await progressUntilChoiceOrTerminal(actionSchedulingSession);
  assert(actionSchedulingSession.getSessionPhase() === 'active_planning', 'ordinary event completion returns to planning');
  assert(actionSchedulerCalls === 1, 'ordinary event completion does not recursively select another event');

  const noActionEventSession = await hydrateAtAge(16, 79, { connections: 5 });
  const noActionEngine = (noActionEventSession as unknown as { engine: GameEngineIntegration }).engine;
  let noActionSchedulerCalls = 0;
  const noActionSchedulerTimes: string[] = [];
  noActionEngine.selectEvent = () => {
    noActionSchedulerCalls += 1;
    noActionSchedulerTimes.push(JSON.stringify(noActionEngine.getGameState().currentTime));
    return noActionSchedulerCalls === 1 ? ordinaryFormalEvent : null;
  };
  await noActionEventSession.executeActiveAction('action_training_basic');
  await noActionEventSession.acknowledgeProgression('action_summary');
  if (noActionEventSession.getSessionPhase() === 'disturbance_narrative') {
    await noActionEventSession.acknowledgeProgression('disturbance');
  }
  const noActionChoice = noActionEventSession.describePendingEvent()?.raw.choices?.find(choice =>
    !choice.condition || noActionEngine.isChoiceAvailable(choice.condition),
  );
  assert(noActionChoice, 'no-action recovery fixture event has an available choice');
  const noActionPending = noActionEventSession.describePendingEvent();
  assert(noActionPending, 'no-action recovery fixture has a pending event');
  await noActionEventSession.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: noActionEventSession.serialize() },
    action: { eventId: noActionPending.eventId, choiceId: noActionChoice.id },
  });
  const eventResultTime = JSON.stringify(noActionEventSession.getRuntimeState().currentTime);
  noActionEngine.getAvailableActiveActions = () => [];
  await noActionEventSession.acknowledgeProgression('period_summary');
  assert(noActionSchedulerCalls > 1, 'no-action event completion continues through the scheduler path');
  assert(
    noActionSchedulerTimes[1] !== eventResultTime,
    'event-result confirmation advances time before its next scheduler opportunity',
  );

  const optionsSession = await hydrateAtAge(16, 55);
  const localEngine = new GameEngineIntegration();
  localEngine.loadGameState(optionsSession.getRuntimeState());
  const localIds = new Set(localEngine.getAvailableActiveActions().map(c => c.actionId));
  const headlessIds = new Set(optionsSession.getPlanningOptions().map(o => o.actionId));
  assert(localIds.size >= 3, 'expect minimum actions at age 16');
  assert([...localIds].every(id => headlessIds.has(id)), 'planning options match local action ids');
  for (const option of optionsSession.getPlanningOptions()) {
    assert(option.rewardSummary.length > 0, 'reward summary populated');
    assert(option.costSummary.length > 0, 'cost summary populated');
    assert(option.riskLevel.length > 0, 'risk populated');
  }

  // With no social exposure, the Mingyue character entry is unavailable and active planning can proceed.
  const actionSession = await hydrateAtAge(16, 12345, { charisma: 4, connections: 0 });
  const beforeStats = { ...actionSession.getRuntimeState().player };
  await actionSession.executeActiveAction('action_training_basic');
  assert(actionSession.getSessionPhase() === 'action_summary', 'after action → action_summary');
  assert(actionSession.getProgressionVolatileState().pendingActionSummary !== null, 'volatile summary set');
  const history = actionSession.getRuntimeState().actionHistory ?? [];
  assert(
    history.some(h => h.sourceKind === 'active_action' && h.actionId === 'action_training_basic'),
    'action history entry',
  );
  const after = actionSession.getRuntimeState().player;
  assert(
    (after.martialPower ?? 0) !== (beforeStats.martialPower ?? 0),
    'stat delta applied',
  );

  // No social exposure keeps the loop out of the character opportunity.
  const loopSession = await hydrateAtAge(16, 88, { charisma: 4, connections: 0 });
  await loopSession.executeActiveAction('action_socializing_basic');
  await loopSession.acknowledgeProgression('action_summary');
  if (loopSession.getProgressionVolatileState().pendingDisturbanceNarrative) {
    assert(loopSession.getSessionPhase() === 'disturbance_narrative', 'summary ack with disturbance');
    await loopSession.acknowledgeProgression('disturbance');
  }
  assert(
    loopSession.getSessionPhase() === 'active_planning' || loopSession.getSessionPhase() === 'story_event',
    'loop ends in planning or story',
  );

  const confirmedActionSession = await hydrateAtAge(16, 98, { charisma: 4, connections: 0 });
  const confirmedActionEngine = (confirmedActionSession as unknown as { engine: GameEngineIntegration }).engine;
  let confirmedActionSchedulerCalls = 0;
  confirmedActionEngine.selectEvent = () => {
    confirmedActionSchedulerCalls += 1;
    return null;
  };
  const beforeActionTime = JSON.stringify(confirmedActionSession.getRuntimeState().currentTime);
  await confirmedActionSession.executeActiveAction('action_training_basic');
  assert(confirmedActionSchedulerCalls === 0, 'action execution alone does not schedule an event');
  assert(
    (confirmedActionSession.getRuntimeState().actionHistory ?? []).some(
      entry => entry.sourceKind === 'active_action' && entry.actionId === 'action_training_basic',
    ),
    'active action is recorded before event scheduling',
  );
  assert(
    JSON.stringify(confirmedActionSession.getRuntimeState().currentTime) !== beforeActionTime,
    'active action advances time before event scheduling',
  );
  await confirmedActionSession.acknowledgeProgression('action_summary');
  if (confirmedActionSession.getSessionPhase() === 'disturbance_narrative') {
    assert(confirmedActionSchedulerCalls === 0, 'summary acknowledgement waits for disturbance confirmation');
    await confirmedActionSession.acknowledgeProgression('disturbance');
  }
  assert(confirmedActionSchedulerCalls === 1, 'final action result confirmation grants one scheduler opportunity');
  assert(confirmedActionSession.getSessionPhase() === 'active_planning', 'no event selected returns to planning');
  await progressUntilChoiceOrTerminal(confirmedActionSession);
  assert(confirmedActionSchedulerCalls === 1, 'repeated planning resolution grants no additional opportunity');

  const coreState = (await hydrateAtAge(16)).getRuntimeState();
  executeActiveActionOnState(coreState, 'action_study_basic', {
    random: () => 0.99,
    includeDisturbance: false,
  });

  try {
    await actionSession.executeActiveAction('action_training_basic');
    throw new Error('expected INVALID_SESSION_PHASE');
  } catch (error) {
    assert(error instanceof HeadlessProgressionError, 'invalid phase throws');
    assert(error.code === 'INVALID_SESSION_PHASE', 'phase guard');
  }

  const invalidSession = await hydrateAtAge(16, 42, { charisma: 4 });
  try {
    await invalidSession.executeActiveAction('not_a_real_action');
    throw new Error('expected INVALID_ACTION');
  } catch (error) {
    assert(error instanceof HeadlessProgressionError, 'invalid action throws');
    assert(error.code === 'INVALID_ACTION', 'action guard');
  }

  const deadSnap = snapshotAtAge(80);
  deadSnap.state.player.alive = false;
  deadSnap.state.player.deathReason = 'test';
  const terminalSession = HeadlessEngineSessionImpl.create({
    playerName: '终局',
    gender: 'male',
    catalogVersion: '1.0.0',
  });
  await terminalSession.hydrate(deadSnap);
  assert(terminalSession.getSessionPhase() === 'terminal', 'terminal phase');
  assert(terminalSession.getPlanningOptions().length === 0, 'terminal has no planning options');

  const infantSession = await hydrateAtAge(1, 42);
  assert(infantSession.getSessionPhase() === 'passive_progression', 'age 1 → passive_progression');
  assert(infantSession.getPlanningOptions().length === 0, 'no planning options at age 1');
  infantSession.ensurePassivePresentation();
  const volatile = infantSession.getProgressionVolatileState();
  assert(volatile.passiveNarrative !== null, 'passive narrative prepared');

  const age3Session = await hydrateAtAge(3, 42);
  assert(age3Session.getSessionPhase() === 'passive_progression', 'age 3 story gap → passive_progression');
  assert(age3Session.getSessionPhase() !== 'active_planning', 'age 3 never enters active_planning on gap');

  const age5Session = await hydrateAtAge(5, 42);
  assert(
    age5Session.getSessionPhase() === 'passive_progression',
    'age 5 story gap prefers passive before lite planning',
  );
  assert(age5Session.getSessionPhase() !== 'active_planning', 'age 5 first gap pass is not active_planning yet');
  assert(shouldPreferStoryGapPassiveBeforePlanning(3, false), 'age 3 always prefers passive on gap');
  assert(shouldPreferStoryGapPassiveBeforePlanning(5, false), 'age 5 prefers passive before planning on gap');
  assert(!shouldPreferStoryGapPassiveBeforePlanning(5, true), 'age 5 allows lite planning after passive served');
  assert(!shouldPreferStoryGapPassiveBeforePlanning(8, false), 'age 8+ skips preschool gap preference');

  const autoAckSession = await hydrateAtAge(1, 77);
  const pending = await autoAckSession.getNextEvent();
  if (pending?.isAutomatic) {
    assert(autoAckSession.getSessionPhase() === 'story_event', 'automatic event → story_event');
    await autoAckSession.acknowledgeProgression('story_automatic');
    const afterPhase = autoAckSession.getSessionPhase();
    assert(
      afterPhase === 'active_planning' ||
        afterPhase === 'story_event' ||
        afterPhase === 'terminal' ||
        afterPhase === 'passive_progression' ||
        afterPhase === 'period_summary',
      'story_automatic ack advances session',
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP72SessionPhaseTests()
    .then(() => console.log('p72SessionPhase.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
