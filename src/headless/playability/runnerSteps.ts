/**
 * P8.1 headless persona runner — per-phase step handlers.
 */
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../contracts/choiceExecution';
import { getActionById } from '../../data/activeActionCatalog';
import { toActiveActionReplayEventId } from '../../core/activePlanning/activeActionReplay';
import { selectPersonaActiveAction } from '../../p8/personaActionStrategy';
import type { P8Persona } from '../../p8/types';
import type { ChoiceScoreDiagnostic } from '../../p8/types';
import type { EventDefinition } from '../../types/eventTypes';
import type { GameProcessRecord } from '../../types/simulationRecordTypes';
import type { HeadlessEngineSession } from '../session/HeadlessEngineSession';
import { progressUntilChoiceOrTerminal } from '../progressionLoop';
import {
  buildChoiceDecision,
  selectPersonaChoice,
} from './choiceScoring';
import {
  cloneExperienceTraceValue,
  createExperienceStateDelta,
} from './experienceTraceTypes';
import type {
  ExperienceTraceActiveAction,
  ExperienceTraceChoiceCandidate,
  ExperienceTraceStep,
} from './experienceTraceTypes';

import type { AutomaticStageResultDisplay } from '../../types/activeActionTypes';
import type { ProgressAutomaticResult } from '../session/sessionTypes';

export interface RunnerStepContext {
  session: HeadlessEngineSession;
  persona: P8Persona;
  records: GameProcessRecord[];
  choiceDiagnostics: ChoiceScoreDiagnostic[];
  activeActionSelectionReasons: Array<{ age: number; actionId: string; reason: string }>;
  experienceTraceSteps?: ExperienceTraceStep[];
}
function snapshotStateForRecord(session: HeadlessEngineSession): ReturnType<HeadlessEngineSession['getRuntimeState']> {
  return JSON.parse(JSON.stringify(session.getRuntimeState()));
}

/** Setback stage copy must stay player-visible on the auto-event record (P8/B0 evidence). */
function visibleSetbackExplanation(stageResults: AutomaticStageResultDisplay[] | undefined): string {
  if (!stageResults?.length) return '';
  return stageResults
    .filter(result => result.sourceKind === 'setback')
    .map(result => [result.title, result.body].filter(Boolean).join('：'))
    .filter(Boolean)
    .join('；');
}

function autoStoryOutcomeText(
  eventText: string,
  progress: ProgressAutomaticResult,
): { eventText: string; outcomeText?: string } {
  const setbackText = visibleSetbackExplanation(progress.stageResults);
  if (!setbackText) {
    return { eventText };
  }
  return {
    eventText: `${eventText}\n${setbackText}`,
    outcomeText: setbackText,
  };
}

type TracePayload = Partial<Pick<ExperienceTraceStep, 'event' | 'choiceCandidates' | 'choiceDecision' | 'activeAction' | 'presentation' | 'acknowledgement'>>;

function currentTimeForTrace(state: ReturnType<HeadlessEngineSession['getRuntimeState']>): { year: number; month: number; day: number } {
  return state.currentTime ?? { year: 0, month: 1, day: 1 };
}

/** Read the phase after a mutation without invoking getSessionPhase's passive presentation side effect. */
function phaseAfterWithoutPresentation(session: HeadlessEngineSession): ExperienceTraceStep['phaseAfter'] {
  if (session.getTerminalState()) return 'terminal';
  const volatile = session.getProgressionVolatileState();
  if (volatile.pendingPeriodSummary) return 'period_summary';
  if (volatile.pendingActionSummary) return 'action_summary';
  if (volatile.pendingDisturbanceNarrative) return 'disturbance_narrative';
  if (volatile.pendingStoryEventId || volatile.pendingEphemeralStoryEvent) return 'story_event';
  if (session.getRuntimeState().player?.alive === false) return 'terminal';
  if (session.hasPendingForcedEvent()) return 'story_event';
  if (session.getPlanningOptions().length > 0) return 'active_planning';
  return 'passive_progression';
}

function recordExperienceTrace(
  ctx: RunnerStepContext,
  stateBefore: ReturnType<HeadlessEngineSession['getRuntimeState']>,
  phaseBefore: ExperienceTraceStep['phaseBefore'],
  payload: TracePayload,
): void {
  if (!ctx.experienceTraceSteps) return;
  const stateAfter = snapshotStateForRecord(ctx.session);
  ctx.experienceTraceSteps.push({
    sequence: ctx.experienceTraceSteps.length + 1,
    age: stateBefore.player?.age ?? 0,
    currentTime: currentTimeForTrace(stateBefore),
    phaseBefore,
    phaseAfter: phaseAfterWithoutPresentation(ctx.session),
    ...payload,
    stateDelta: createExperienceStateDelta(stateBefore, stateAfter),
  });
}

function traceEvent(event: EventDefinition): ExperienceTraceStep['event'] {
  return {
    id: event.id,
    title: event.content?.title ?? event.id,
    text: event.content?.text ?? '',
  };
}

function traceChoiceCandidates(
  selection: NonNullable<ReturnType<typeof selectPersonaChoice>>,
): ExperienceTraceChoiceCandidate[] {
  return selection.scoreCandidates.map(candidate => ({
    choiceId: candidate.choiceId,
    text: candidate.choice.text,
    ...(candidate.choice.description ? { description: candidate.choice.description } : {}),
    baseScore: candidate.baseScore,
    personaAdjustedScore: candidate.personaAdjustedScore,
    personaBonus: candidate.personaBonus,
    directEffects: cloneExperienceTraceValue(candidate.directEffects),
    outcomeEffects: cloneExperienceTraceValue(candidate.outcomeEffects),
    outcomeCount: candidate.outcomeCount,
    selected: candidate.choiceId === selection.choice.id,
  }));
}

function traceActiveAction(
  available: ReturnType<HeadlessEngineSession['getPlanningOptions']>,
  actionId: string,
  reason: string,
  focusStreakCategory: string | null,
  focusStreakCount: number,
): ExperienceTraceActiveAction {
  return {
    availableActions: available.map(action => ({
      actionId: action.actionId,
      category: action.category,
      text: action.text,
    })),
    selectedActionId: actionId,
    selectionReason: reason,
    focusStreakCategory,
    focusStreakCount,
  };
}

function eventRequiresChoice(event: EventDefinition): boolean {
  if (event.autoEffects && event.autoEffects.length > 0) return false;
  if (event.eventType === 'auto') return false;
  return Boolean(event.choices?.length);
}
function resolveCatalogEvent(session: HeadlessEngineSession, event: EventDefinition): EventDefinition {
  const version = session.serialize().metadata.eventCatalogVersion;
  try {
    return session.dependencies.catalog.getEventById(event.id, version);
  } catch {
    return event;
  }
}
async function continueDeferredAutoStoryEvent(ctx: RunnerStepContext): Promise<void> {
  if (ctx.session.getTerminalState()) return;
  if (ctx.session.getSessionPhase() !== 'story_event') return;
  const event = ctx.session.getCurrentEvent();
  if (!event) return;
  const catalogEvent = resolveCatalogEvent(ctx.session, event);
  if (!eventRequiresChoice(catalogEvent)) {
    await runStoryEventStep(ctx);
  }
}
async function afterStoryProgression(ctx: RunnerStepContext): Promise<void> {
  await progressUntilChoiceOrTerminal(ctx.session);
  await continueDeferredAutoStoryEvent(ctx);
}
export async function runStoryEventStep(ctx: RunnerStepContext): Promise<void> {
  if (ctx.session.getTerminalState()) return;
  const { session, persona } = ctx;
  let event = session.getCurrentEvent();
  if (!event) {
    const next = await session.getNextEvent();
    if (!next) return;
    event = next.raw;
    if (!next.requiresChoice) {
      const age = session.getRuntimeState().player?.age ?? 0;
      const stateBefore = snapshotStateForRecord(session);
      // ponytail: one auto event per record; maxSteps:8 conflated later events into this evidence
      const progress = await session.progressAutomatic({ maxSteps: 1 });
      const after = session.getRuntimeState();
      const baseText = event.content?.text ?? '';
      const visible = autoStoryOutcomeText(baseText, progress);
      ctx.records.push({
        age,
        eventId: event.id,
        eventTitle: event.content?.title ?? event.id,
        eventText: visible.eventText,
        outcomeText: visible.outcomeText,
        eventType: 'auto',
        progressionKind: 'story_event',
        gameState: stateBefore,
        outcomeEvidence: {
          stateBefore,
          stateAfter: snapshotStateForRecord(session),
          executedEffects: event.autoEffects ?? [],
        },
        currentTime: after.currentTime,
        timestamp: new Date().toISOString(),
      });
      recordExperienceTrace(ctx, stateBefore, 'story_event', {
        event: {
          ...traceEvent(event),
          text: visible.eventText,
        },
      });
      await afterStoryProgression(ctx);
      return;
    }
  }
  const catalogEvent = resolveCatalogEvent(session, event);
  if (!eventRequiresChoice(catalogEvent)) {
    const age = session.getRuntimeState().player?.age ?? 0;
    const stateBefore = snapshotStateForRecord(session);
    // ponytail: one auto event per record; maxSteps:8 conflated later events into this evidence
    const progress = await session.progressAutomatic({ maxSteps: 1 });
    const after = session.getRuntimeState();
    const baseText = catalogEvent.content?.text ?? '';
    const visible = autoStoryOutcomeText(baseText, progress);
    ctx.records.push({
      age,
      eventId: catalogEvent.id,
      eventTitle: catalogEvent.content?.title ?? catalogEvent.id,
      eventText: visible.eventText,
      outcomeText: visible.outcomeText,
      eventType: 'auto',
      progressionKind: 'story_event',
      gameState: stateBefore,
      outcomeEvidence: {
        stateBefore,
        stateAfter: snapshotStateForRecord(session),
        executedEffects: catalogEvent.autoEffects ?? [],
      },
      currentTime: after.currentTime,
      timestamp: new Date().toISOString(),
    });
    recordExperienceTrace(ctx, stateBefore, 'story_event', {
      event: {
        ...traceEvent(catalogEvent),
        text: visible.eventText,
      },
    });
    await afterStoryProgression(ctx);
    return;
  }
  const age = session.getRuntimeState().player?.age ?? 0;
  const stateBefore = snapshotStateForRecord(session);
  const selection = selectPersonaChoice(session, catalogEvent, persona);
  if (!selection?.choice?.id) {
    await afterStoryProgression(ctx);
    return;
  }
  const choiceId = selection.choice.id;
  if (!catalogEvent.choices?.some(c => c.id === choiceId)) {
    await afterStoryProgression(ctx);
    return;
  }
  if (selection.diagnostic) {
    ctx.choiceDiagnostics.push(selection.diagnostic);
  }
  const snap = session.serialize();
  const choiceResponse = await session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: snap },
    action: { eventId: catalogEvent.id, choiceId },
  });
  const stateAfterChoice = snapshotStateForRecord(session);
  ctx.records.push({
    age,
    eventId: catalogEvent.id,
    eventTitle: catalogEvent.content?.title ?? catalogEvent.id,
    eventText: catalogEvent.content?.text ?? '',
    eventType: 'choice',
    progressionKind: 'story_event',
    selectedChoice: selection.choice,
    outcomeText: choiceResponse.status === 'success' ? choiceResponse.feedback.player.narrativeResult : undefined,
    choiceScoreDiagnostic: selection.diagnostic
      ? {
          selectedScore: selection.diagnostic.selectedScore,
          runnerUpScore: selection.diagnostic.runnerUpScore,
          runnerUpChoiceId: selection.diagnostic.runnerUpChoiceId,
        }
      : undefined,
    gameState: stateBefore,
    outcomeEvidence: { stateBefore, stateAfter: stateAfterChoice },
    currentTime: session.getRuntimeState().currentTime,
    timestamp: new Date().toISOString(),
  });
  if (selection.diagnostic) {
    recordExperienceTrace(ctx, stateBefore, 'story_event', {
      event: traceEvent(catalogEvent),
      choiceCandidates: traceChoiceCandidates(selection),
      choiceDecision: buildChoiceDecision(
        selection.scoreCandidates,
        selection.diagnostic,
      ),
    });
  }
  await afterStoryProgression(ctx);
}
export async function runActivePlanningStep(ctx: RunnerStepContext): Promise<void> {
  if (ctx.session.getTerminalState()) return;
  const { session, persona } = ctx;
  const age = session.getRuntimeState().player?.age ?? 0;
  const stateBefore = snapshotStateForRecord(session);
  const available = session.getPlanningOptions();
  if (available.length === 0) {
    await session.getNextEvent();
    return;
  }
  const stateNow = session.getRuntimeState();
  const selection = selectPersonaActiveAction({
    persona,
    availableActions: available.map(a => ({
      actionId: a.actionId,
      category: a.category,
      name: a.text,
    })),
    age,
    focusStreakCategory: stateNow.actionFocusStreak?.category ?? null,
    focusStreakCount: stateNow.actionFocusStreak?.count ?? 0,
  });
  ctx.activeActionSelectionReasons.push({
    age,
    actionId: selection.actionId,
    reason: selection.reason,
  });
  await session.executeActiveAction(selection.actionId);
  const actionDef = getActionById(selection.actionId);
  const summary = session.getProgressionVolatileState().pendingActionSummary;
  const stateAfterAction = snapshotStateForRecord(session);
  const feedbackText = summary?.actionName
    ? `本期安排${summary.actionName}`
    : `本期安排${actionDef?.name ?? '主动行动'}`;
  ctx.records.push({
    age,
    eventId: toActiveActionReplayEventId(selection.actionId),
    eventTitle: actionDef?.name ? `主动${actionDef.name}` : '主动行动',
    eventText: feedbackText,
    outcomeText: [
      feedbackText,
      summary?.appliedDeltaSummary,
      summary?.resultExplanation,
      summary?.resourcePressureNotice,
    ]
      .filter(Boolean)
      .join(' '),
    eventType: 'auto',
    progressionKind: 'active_action',
    activeActionId: selection.actionId,
    activeActionSelectionReason: selection.reason,
    gameState: stateBefore,
    outcomeEvidence: { stateBefore, stateAfter: stateAfterAction },
    currentTime: session.getRuntimeState().currentTime,
    timestamp: new Date().toISOString(),
  });
  recordExperienceTrace(ctx, stateBefore, 'active_planning', {
    activeAction: traceActiveAction(
      available,
      selection.actionId,
      selection.reason,
      stateBefore.actionFocusStreak?.category ?? null,
      stateBefore.actionFocusStreak?.count ?? 0,
    ),
    ...(summary ? { presentation: { actionSummary: cloneExperienceTraceValue(summary) } } : {}),
  });
}
export async function runActionSummaryAckStep(ctx: RunnerStepContext): Promise<void> {
  if (ctx.session.getTerminalState()) return;
  const stateBefore = snapshotStateForRecord(ctx.session);
  const summary = ctx.session.getProgressionVolatileState().pendingActionSummary;
  await ctx.session.acknowledgeProgression('action_summary');
  recordExperienceTrace(ctx, stateBefore, 'action_summary', {
    ...(summary ? { presentation: { actionSummary: cloneExperienceTraceValue(summary) } } : {}),
    acknowledgement: { kind: 'action_summary' },
  });
  await afterStoryProgression(ctx);
}
export async function runDisturbanceAckStep(ctx: RunnerStepContext): Promise<void> {
  if (ctx.session.getTerminalState()) return;
  const stateBefore = snapshotStateForRecord(ctx.session);
  const disturbance = ctx.session.getProgressionVolatileState().pendingDisturbanceNarrative;
  await ctx.session.acknowledgeProgression('disturbance');
  recordExperienceTrace(ctx, stateBefore, 'disturbance_narrative', {
    ...(disturbance ? { presentation: { disturbanceNarrative: cloneExperienceTraceValue(disturbance) } } : {}),
    acknowledgement: { kind: 'disturbance' },
  });
  await afterStoryProgression(ctx);
}

export async function runPassiveProgressionStep(ctx: RunnerStepContext): Promise<void> {
  if (ctx.session.getTerminalState()) return;
  const stateBefore = snapshotStateForRecord(ctx.session);
  const passive = ctx.session.getProgressionVolatileState().passiveNarrative;
  await ctx.session.acknowledgeProgression('passive_continue');
  recordExperienceTrace(ctx, stateBefore, 'passive_progression', {
    ...(passive ? { presentation: { passiveNarrative: cloneExperienceTraceValue(passive) } } : {}),
    acknowledgement: { kind: 'passive_continue' },
  });
}

export async function runPeriodSummaryStep(ctx: RunnerStepContext): Promise<void> {
  if (ctx.session.getTerminalState()) return;
  const stateBefore = snapshotStateForRecord(ctx.session);
  const periodSummary = ctx.session.getProgressionVolatileState().pendingPeriodSummary;
  await ctx.session.acknowledgeProgression('period_summary');
  recordExperienceTrace(ctx, stateBefore, 'period_summary', {
    ...(periodSummary ? { presentation: { periodSummary: cloneExperienceTraceValue(periodSummary) } } : {}),
    acknowledgement: { kind: 'period_summary' },
  });
  await progressUntilChoiceOrTerminal(ctx.session);
}
