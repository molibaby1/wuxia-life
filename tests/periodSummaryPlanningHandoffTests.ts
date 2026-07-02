/**
 * period_summary ack must reach active_planning when lite actions exist (merchant HVG).
 */
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../src/contracts/choiceExecution';
import { progressUntilChoiceOrTerminal } from '../src/headless/progressionLoop';
import type { GameStateSnapshot } from '../src/contracts/gameStateSnapshot';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function merchantAgeSnapshot(age: number): GameStateSnapshot {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '交接探针',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 424242,
  });
  const snap = bootstrap.serialize();
  snap.state.player.age = age;
  snap.state.player.alive = true;
  snap.state.player.traitProfile = {
    coreTalent: 'keen_mind',
    weakness: 'lazy',
    temperament: 'bold',
    origin: 'merchant_house',
  };
  snap.state.flags = {
    ...(snap.state.flags ?? {}),
    origin_merchant_family: true,
    origin_id: 'merchant_house',
  };
  return snap;
}

export async function runPeriodSummaryPlanningHandoffTests(): Promise<void> {
  const session = HeadlessEngineSessionImpl.create({
    playerName: '交接探针',
    gender: 'male',
    catalogVersion: '1.0.0',
  });
  await session.hydrate(merchantAgeSnapshot(5));
  const volatile = session as unknown as {
    volatile: { storyGapPassiveServed: boolean; pendingPeriodSummary: unknown };
  };
  volatile.volatile.storyGapPassiveServed = true;
  volatile.volatile.pendingPeriodSummary = {
    sourceLabel: '童年岁月',
    headline: '算盘节律',
    body: '算盘声噼啪作响。',
    statDeltaSummary: '本期未见明显数值变化',
    narrativeText: '算盘声噼啪作响。',
  };

  assert(session.getSessionPhase() === 'period_summary', 'setup should be period_summary');

  await session.acknowledgeProgression('period_summary');

  assert(
    session.getSessionPhase() === 'active_planning',
    `after period_summary ack expected active_planning, got ${session.getSessionPhase()}`,
  );
  const options = session.getPlanningOptions().map(o => o.actionId);
  assert(
    options.includes('action_household_errand'),
    `merchant age 5 planning must include errand; got ${options.join(', ')}`,
  );

  const fresh = HeadlessEngineSessionImpl.create({
    playerName: '链路',
    gender: 'male',
    randomSeed: 424242,
  });
  await fresh.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: fresh.serialize() },
    action: { eventId: 'origin_background', choiceId: 'origin_merchant_family' },
  });

  for (let guard = 0; guard < 80; guard++) {
    const age = fresh.getRuntimeState().player?.age ?? 0;
    if (age >= 5 && fresh.getSessionPhase() === 'active_planning') {
      const ids = fresh.getPlanningOptions().map(o => o.actionId);
      assert(
        ids.includes('action_household_errand'),
        `full path age ${age} must surface merchant errand; got ${ids.join(', ')}`,
      );
      return;
    }

    await progressUntilChoiceOrTerminal(fresh);
    const phase = fresh.getSessionPhase();
    const pending = fresh.describePendingEvent();

    if (pending?.requiresChoice) {
      const choiceId = pending.event.choices?.find(c => c.available)?.id;
      if (choiceId) {
        await fresh.executeChoice({
          requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
          snapshotRef: { snapshot: fresh.serialize() },
          action: { eventId: pending.raw.id, choiceId },
        });
      }
      continue;
    }
    if (phase === 'period_summary') {
      await fresh.acknowledgeProgression('period_summary');
      continue;
    }
    if (phase === 'passive_progression') {
      await fresh.acknowledgeProgression('passive_continue');
      continue;
    }
    if (phase === 'action_summary') {
      await fresh.acknowledgeProgression('action_summary');
      continue;
    }
    if (phase === 'disturbance_narrative') {
      await fresh.acknowledgeProgression('disturbance');
      continue;
    }
    if (phase === 'story_event' && pending?.isAutomatic) {
      await fresh.acknowledgeProgression('story_automatic');
    }
  }

  throw new Error('full merchant path never reached active_planning with errand');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPeriodSummaryPlanningHandoffTests()
    .then(() => console.log('periodSummaryPlanningHandoffTests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
