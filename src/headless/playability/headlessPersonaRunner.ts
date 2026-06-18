/**
 * P8.1 headless persona main loop — runs persona to endAge via P7.2 phase machine.
 */

import type { HeadlessPersonaRunConfig, HeadlessPersonaRunResult } from './types';
import { createPersonaHeadlessSession, applyPersonaYouthRouteSeedsAtAge } from './createPersonaSession';
import {
  runStoryEventStep,
  runActivePlanningStep,
  runActionSummaryAckStep,
  runDisturbanceAckStep,
} from './runnerSteps';
import { ensureProgressionCatchUp, progressUntilChoiceOrTerminal } from '../progressionLoop';

const DEFAULT_MAX_STEPS = 2400;
/** Phase micro-steps without calendar advance before forcing +1 year (unstick stall). */
const STALL_STEPS_BEFORE_YEAR_NUDGE = 16;

export async function runHeadlessPersona(config: HeadlessPersonaRunConfig): Promise<HeadlessPersonaRunResult> {
  const { persona, endAge, catalogVersion, maxSteps = DEFAULT_MAX_STEPS } = config;
  const session = createPersonaHeadlessSession(persona, catalogVersion);
  await progressUntilChoiceOrTerminal(session);

  const records: HeadlessPersonaRunResult['records'] = [];
  const choiceDiagnostics: HeadlessPersonaRunResult['choiceDiagnostics'] = [];
  const activeActionSelectionReasons: HeadlessPersonaRunResult['activeActionSelectionReasons'] = [];
  const ctx = { session, persona, records, choiceDiagnostics, activeActionSelectionReasons };

  let steps = 0;
  let stoppedReason: HeadlessPersonaRunResult['stoppedReason'] = 'end_age';
  let ageAnchor = session.getRuntimeState().player?.age ?? 0;
  let stepsWithoutAgeChange = 0;

  while (steps < maxSteps) {
    steps += 1;
    const state = session.getRuntimeState();
    const age = state.player?.age ?? 0;

    if (session.getTerminalState() || age >= endAge) {
      stoppedReason = session.getTerminalState() ? 'terminal' : 'end_age';
      break;
    }

    applyPersonaYouthRouteSeedsAtAge(session, persona);

    const phase = session.getSessionPhase();
    switch (phase) {
      case 'terminal':
        stoppedReason = 'terminal';
        break;
      case 'story_event':
        await runStoryEventStep(ctx);
        break;
      case 'active_planning':
        await runActivePlanningStep(ctx);
        break;
      case 'action_summary':
        await runActionSummaryAckStep(ctx);
        break;
      case 'disturbance_narrative':
        await runDisturbanceAckStep(ctx);
        break;
      case 'passive_progression':
        await session.acknowledgeProgression('passive_continue');
        break;
      case 'period_summary':
        await session.acknowledgeProgression('period_summary');
        await progressUntilChoiceOrTerminal(session);
        break;
      default:
        await progressUntilChoiceOrTerminal(session);
    }

    if (stoppedReason === 'terminal') break;

    const ageAfter = session.getRuntimeState().player?.age ?? 0;
    if (ageAfter <= ageAnchor) {
      stepsWithoutAgeChange += 1;
      if (stepsWithoutAgeChange >= STALL_STEPS_BEFORE_YEAR_NUDGE) {
        await ensureProgressionCatchUp(session, ageAnchor);
        stepsWithoutAgeChange = 0;
        ageAnchor = session.getRuntimeState().player?.age ?? ageAnchor;
      }
    } else {
      stepsWithoutAgeChange = 0;
      ageAnchor = ageAfter;
    }

    if ((session.getRuntimeState().player?.age ?? 0) >= endAge) {
      stoppedReason = 'end_age';
      break;
    }
  }

  if (steps >= maxSteps) {
    stoppedReason = 'max_steps';
  }

  const finalState = session.getRuntimeState();
  const choiceCount = records.filter(r => r.eventType === 'choice').length;
  const activeCount = records.filter(r => r.progressionKind === 'active_action').length;

  return {
    personaId: persona.id,
    finalAge: finalState.player?.age ?? 0,
    isAlive: finalState.player?.alive !== false,
    deathReason: finalState.player?.deathReason ?? null,
    finalGameState: JSON.parse(JSON.stringify(finalState)),
    records,
    choiceDiagnostics,
    activeActionSelectionReasons,
    totalChoices: choiceCount,
    totalActiveActions: activeCount,
    randomSeed: persona.seed,
    catalogVersion,
    stepsExecuted: steps,
    stoppedReason,
  };
}
