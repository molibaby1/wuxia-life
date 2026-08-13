/**
 * P8.1 headless persona main loop — runs persona to endAge via P7.2 phase machine.
 */

import type { GameProcessRecord } from '../../types/simulationRecordTypes';
import type { GameState } from '../../types/eventTypes';
import { EventPriority } from '../../types/eventTypes';
import type { RuntimeEventCatalog } from '../../core/RuntimeEventCatalog';
import type { HeadlessPersonaRunConfig, HeadlessPersonaRunResult } from './types';
import { createPersonaHeadlessSession, applyPersonaYouthRouteSeedsAtAge } from './createPersonaSession';
import {
  runStoryEventStep,
  runActivePlanningStep,
  runActionSummaryAckStep,
  runDisturbanceAckStep,
  runPassiveProgressionStep,
  runPeriodSummaryStep,
} from './runnerSteps';
import { ensureProgressionCatchUp, progressUntilChoiceOrTerminal } from '../progressionLoop';
import {

  EXPERIENCE_TRACE_SCHEMA_VERSION,
  EXPERIENCE_TRACE_SELECTION_POLICY,
  cloneExperienceTraceValue,
  experienceTracePersona,
} from './experienceTraceTypes';


const DEFAULT_MAX_STEPS = 2400;
/** Phase micro-steps without calendar advance before forcing +1 year (unstick stall). */
const STALL_STEPS_BEFORE_YEAR_NUDGE = 16;

function isMandatoryHistoryEvent(eventId: string, runtimeCatalog: RuntimeEventCatalog): boolean {
  const event = runtimeCatalog.getEventById(eventId);
  if (!event) return false;
  const tags = (event.metadata?.tags || []).map(tag => tag.toLowerCase());
  return (
    event.priority === EventPriority.CRITICAL ||
    tags.includes('critical') ||
    tags.includes('mandatory') ||
    tags.includes('mainline')
  );
}

function isVisibleAutomaticMainlineHistoryEvent(eventId: string, runtimeCatalog: RuntimeEventCatalog): boolean {
  const event = runtimeCatalog.getEventById(eventId);
  return Boolean(
    event?.eventType === 'auto' &&
    event.category === 'main_story' &&
    event.metadata?.tags?.includes('主线') === true &&
    (event.content?.title || event.content?.text),
  );
}

function snapshotForHistoryRecord(historyRecord: GameState['eventHistory'][number], finalState: GameState): GameState {
  const snapshot = historyRecord.stateSnapshot as GameState | undefined;
  if (snapshot) {
    return JSON.parse(JSON.stringify(snapshot));
  }
  return JSON.parse(JSON.stringify(finalState));
}

function backfillPacingEvidenceStoryRecords(
  records: GameProcessRecord[],
  finalState: GameState,
  runtimeCatalog: RuntimeEventCatalog,
): void {
  const recordedIds = new Set(records.map(record => record.eventId));
  for (const historyRecord of finalState.eventHistory ?? []) {
    if (recordedIds.has(historyRecord.eventId)) {
      continue;
    }
    if (
      !isMandatoryHistoryEvent(historyRecord.eventId, runtimeCatalog) &&
      !isVisibleAutomaticMainlineHistoryEvent(historyRecord.eventId, runtimeCatalog)
    ) {
      continue;
    }
    const catalogEvent = runtimeCatalog.getEventById(historyRecord.eventId);
    if (!catalogEvent) continue;
    records.push({
      age: historyRecord.age ?? finalState.player?.age ?? 0,
      eventId: historyRecord.eventId,
      eventTitle: catalogEvent.content?.title ?? historyRecord.eventId,
      eventText: catalogEvent.content?.text ?? '',
      eventType: 'auto',
      progressionKind: 'story_event',
      gameState: snapshotForHistoryRecord(historyRecord, finalState),
      currentTime: finalState.currentTime,
      timestamp: new Date().toISOString(),
    });
    recordedIds.add(historyRecord.eventId);
  }
  records.sort((a, b) => {
    if (a.age !== b.age) {
      return a.age - b.age;
    }
    return a.timestamp.localeCompare(b.timestamp);
  });
}

export async function runHeadlessPersona(config: HeadlessPersonaRunConfig): Promise<HeadlessPersonaRunResult> {
  const { persona, endAge, catalogVersion, maxSteps = DEFAULT_MAX_STEPS, runtimeCatalog } = config;

  const effectivePersona = config.seed === undefined ? persona : { ...persona, seed: config.seed };

  const session = createPersonaHeadlessSession(effectivePersona, catalogVersion, runtimeCatalog);

  await progressUntilChoiceOrTerminal(session);

  const records: HeadlessPersonaRunResult['records'] = [];
  const choiceDiagnostics: HeadlessPersonaRunResult['choiceDiagnostics'] = [];
  const activeActionSelectionReasons: HeadlessPersonaRunResult['activeActionSelectionReasons'] = [];
  const experienceTraceSteps = config.experienceTrace ? [] : undefined;

  const ctx = {
    session,
    persona: effectivePersona,
    records,
    choiceDiagnostics,
    activeActionSelectionReasons,
    experienceTraceSteps,
  };


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

    let phase = session.getSessionPhase();
    if (
      phase !== 'story_event' &&
      phase !== 'terminal' &&
      session.hasPendingForcedEvent()
    ) {
      await session.getNextEvent();
      phase = session.getSessionPhase();
    }

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
        await runPassiveProgressionStep(ctx);

        break;
      case 'period_summary':
        await runPeriodSummaryStep(ctx);

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
        if (session.getSessionPhase() === 'story_event') {
          await runStoryEventStep(ctx);
        }
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
  backfillPacingEvidenceStoryRecords(records, finalState, session.dependencies.runtimeCatalog);
  const choiceCount = records.filter(r => r.eventType === 'choice').length;
  const activeCount = records.filter(r => r.progressionKind === 'active_action').length;
  const experienceTrace = experienceTraceSteps

    ? {

        schemaVersion: EXPERIENCE_TRACE_SCHEMA_VERSION,

        generatedAt: new Date().toISOString(),

        runtimePath: 'headless_server' as const,

        persona: experienceTracePersona(persona),

        seed: effectivePersona.seed,

        endAge,

        selectionPolicy: EXPERIENCE_TRACE_SELECTION_POLICY,

        steps: experienceTraceSteps,

        finalState: cloneExperienceTraceValue(finalState),

        stoppedReason,

      }

    : undefined;


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
    randomSeed: effectivePersona.seed,

    catalogVersion,
    stepsExecuted: steps,
    stoppedReason,
    ...(experienceTrace ? { experienceTrace } : {}),

  };
}
