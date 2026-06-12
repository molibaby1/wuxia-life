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
import { selectPersonaChoice } from './choiceScoring';

export interface RunnerStepContext {
  session: HeadlessEngineSession;
  persona: P8Persona;
  records: GameProcessRecord[];
  choiceDiagnostics: ChoiceScoreDiagnostic[];
  activeActionSelectionReasons: Array<{ age: number; actionId: string; reason: string }>;
}

function snapshotStateForRecord(session: HeadlessEngineSession): ReturnType<HeadlessEngineSession['getRuntimeState']> {
  return JSON.parse(JSON.stringify(session.getRuntimeState()));
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
      await session.progressAutomatic({ maxSteps: 8 });
      const after = session.getRuntimeState();
      ctx.records.push({
        age,
        eventId: event.id,
        eventTitle: event.content?.title ?? event.id,
        eventText: event.content?.text ?? '',
        eventType: 'auto',
        progressionKind: 'story_event',
        gameState: stateBefore,
        currentTime: after.currentTime,
        timestamp: new Date().toISOString(),
      });
      await progressUntilChoiceOrTerminal(session);
      return;
    }
  }

  const catalogEvent = resolveCatalogEvent(session, event);
  if (!eventRequiresChoice(catalogEvent)) {
    const age = session.getRuntimeState().player?.age ?? 0;
    const stateBefore = snapshotStateForRecord(session);
    await session.progressAutomatic({ maxSteps: 8 });
    const after = session.getRuntimeState();
    ctx.records.push({
      age,
      eventId: catalogEvent.id,
      eventTitle: catalogEvent.content?.title ?? catalogEvent.id,
      eventText: catalogEvent.content?.text ?? '',
      eventType: 'auto',
      progressionKind: 'story_event',
      gameState: stateBefore,
      currentTime: after.currentTime,
      timestamp: new Date().toISOString(),
    });
    await progressUntilChoiceOrTerminal(session);
    return;
  }

  const age = session.getRuntimeState().player?.age ?? 0;
  const stateBefore = snapshotStateForRecord(session);
  const selection = selectPersonaChoice(session, catalogEvent, persona);
  if (!selection?.choice?.id) {
    await progressUntilChoiceOrTerminal(session);
    return;
  }

  const choiceId = selection.choice.id;
  if (!catalogEvent.choices?.some(c => c.id === choiceId)) {
    await progressUntilChoiceOrTerminal(session);
    return;
  }

  if (selection.diagnostic) {
    ctx.choiceDiagnostics.push(selection.diagnostic);
  }

  const snap = session.serialize();
  await session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: snap },
    action: { eventId: catalogEvent.id, choiceId },
  });

  ctx.records.push({
    age,
    eventId: catalogEvent.id,
    eventTitle: catalogEvent.content?.title ?? catalogEvent.id,
    eventText: catalogEvent.content?.text ?? '',
    eventType: 'choice',
    progressionKind: 'story_event',
    selectedChoice: selection.choice,
    choiceScoreDiagnostic: selection.diagnostic
      ? {
          selectedScore: selection.diagnostic.selectedScore,
          runnerUpScore: selection.diagnostic.runnerUpScore,
          runnerUpChoiceId: selection.diagnostic.runnerUpChoiceId,
        }
      : undefined,
    gameState: stateBefore,
    currentTime: session.getRuntimeState().currentTime,
    timestamp: new Date().toISOString(),
  });
  await progressUntilChoiceOrTerminal(session);
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
  const feedbackText = summary?.actionName
    ? `本期安排${summary.actionName}`
    : `本期安排${actionDef?.name ?? '主动行动'}`;

  ctx.records.push({
    age,
    eventId: toActiveActionReplayEventId(selection.actionId),
    eventTitle: actionDef?.name ? `主动${actionDef.name}` : '主动行动',
    eventText: feedbackText,
    outcomeText: feedbackText,
    eventType: 'auto',
    progressionKind: 'active_action',
    activeActionId: selection.actionId,
    activeActionSelectionReason: selection.reason,
    gameState: stateBefore,
    currentTime: session.getRuntimeState().currentTime,
    timestamp: new Date().toISOString(),
  });
}

export async function runActionSummaryAckStep(ctx: RunnerStepContext): Promise<void> {
  if (ctx.session.getTerminalState()) return;
  await ctx.session.acknowledgeProgression('action_summary');
  await progressUntilChoiceOrTerminal(ctx.session);
}

export async function runDisturbanceAckStep(ctx: RunnerStepContext): Promise<void> {
  if (ctx.session.getTerminalState()) return;
  await ctx.session.acknowledgeProgression('disturbance');
  await progressUntilChoiceOrTerminal(ctx.session);
}
