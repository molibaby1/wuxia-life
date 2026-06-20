import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import { HeadlessProgressionError } from '../../src/headless/session/sessionTypes';
import { GameEngineIntegration } from '../../src/core/GameEngineIntegration';
import { executeActiveActionOnState } from '../../src/core/activePlanning/ActivePlanningService';
import { shouldPreferStoryGapPassiveBeforePlanning } from '../../src/p16/childhoodAgency';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function snapshotAtAge(age: number): GameStateSnapshot {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '测试',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 1,
  });
  const snap = bootstrap.serialize();
  snap.state.player.age = age;
  snap.state.player.alive = true;
  return snap;
}

async function hydrateAtAge(age: number, randomSeed = 42) {
  const session = HeadlessEngineSessionImpl.create({
    playerName: '规划侠客',
    gender: 'male',
    randomSeed,
    catalogVersion: '1.0.0',
  });
  await session.hydrate(snapshotAtAge(age));
  return session;
}

export async function runP72SessionPhaseTests(): Promise<void> {
  const planningSession = await hydrateAtAge(16, 77);
  assert(planningSession.getSessionPhase() === 'active_planning', 'alive with no event → active_planning');

  const next = await planningSession.getNextEvent();
  if (next) {
    assert(planningSession.getSessionPhase() === 'story_event', 'current event → story_event');
  }

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

  const actionSession = await hydrateAtAge(16, 12345);
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
    (after.externalSkill ?? 0) !== (beforeStats.externalSkill ?? 0) ||
      (after.internalSkill ?? 0) !== (beforeStats.internalSkill ?? 0),
    'stat delta applied',
  );

  const loopSession = await hydrateAtAge(16, 88);
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

  const invalidSession = await hydrateAtAge(16);
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
