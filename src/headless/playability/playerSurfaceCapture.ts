import type { ChoiceFeedbackModel } from '../../types/choiceFeedback';
import type {
  ActiveActionSummaryDisplay,
  DisturbanceNarrativeDisplay,
  PassiveNarrativeDisplay,
  PeriodSummaryDisplay,
} from '../../types/activeActionTypes';
import {
  buildActiveActionOverlayCard,
  buildChoiceFeedbackOverlayCard,
  buildPeriodSummaryOverlayCards,
  buildStageResultOverlayCard,
  type ProgressionOverlayCard,
} from '../../types/progressionOverlay';
import type { NextEventResult } from '../session/sessionTypes';

export const HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION =
  'headless-api-player-surface-source-v1' as const;

export interface HeadlessApiSurfaceChoice {
  id: string;
  text: string;
  description?: string;
}

export interface HeadlessApiSurfaceStoryEvent {
  eventId: string;
  title: string;
  text: string;
  choices?: HeadlessApiSurfaceChoice[];
}

export interface HeadlessApiSurfacePresentationCard {
  title: string;
  body?: string;
  metaLines?: string[];
}

export interface HeadlessApiPlayerSurfaceStep {
  sequence: number;
  kind:
    | 'story_event'
    | 'active_action_result'
    | 'period_summary'
    | 'disturbance'
    | 'passive_narrative';
  age?: number;
  storyEvent?: HeadlessApiSurfaceStoryEvent;
  selectedChoiceId?: string;
  /** Formal active-action identity for active_action_result provenance (not player-visible). */
  actionId?: string;
  presentationCards?: HeadlessApiSurfacePresentationCard[];
}

export interface HeadlessApiPlayerSurfaceTrace {
  schemaVersion: typeof HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION;
  steps: HeadlessApiPlayerSurfaceStep[];
}

export function capturePlayerSafeStoryEvent(next: NextEventResult): HeadlessApiSurfaceStoryEvent {
  const visibleChoices = next.event.choices
    ?.filter(choice => choice.available === true)
    .map(choice => ({
      id: choice.id,
      text: choice.text,
      ...(typeof choice.description === 'string' && choice.description.length > 0
        ? { description: choice.description }
        : {}),
    }));

  return {
    eventId: next.event.eventId,
    title: next.event.title,
    text: next.event.text,
    ...(visibleChoices !== undefined ? { choices: visibleChoices } : {}),
  };
}

export function captureProgressionOverlayCard(
  card: ProgressionOverlayCard | null,
): HeadlessApiSurfacePresentationCard | null {
  if (!card) return null;
  return {
    title: card.title,
    ...(card.body !== undefined ? { body: card.body } : {}),
    ...(card.metaLines !== undefined ? { metaLines: [...card.metaLines] } : {}),
  };
}

export function buildChoiceSurfacePresentation(
  story: HeadlessApiSurfaceStoryEvent,
  selectedChoiceId: string,
  feedback: ChoiceFeedbackModel,
): HeadlessApiSurfacePresentationCard {
  const selectedChoice = story.choices?.find(choice => choice.id === selectedChoiceId);
  if (!selectedChoice) {
    throw new Error(
      `selected choice ${selectedChoiceId} is not present in the player-visible choice set`,
    );
  }

  const card = buildChoiceFeedbackOverlayCard(
    'surface-choice-result',
    story.title,
    selectedChoice.text,
    feedback,
    [selectedChoice.text, selectedChoice.description],
  );
  const presentation = captureProgressionOverlayCard(card);
  if (!presentation) {
    throw new Error(`failed to build player-visible presentation for choice ${selectedChoiceId}`);
  }
  return presentation;
}

export function buildActiveActionSurfacePresentation(
  summary: ActiveActionSummaryDisplay,
): HeadlessApiSurfacePresentationCard {
  return captureProgressionOverlayCard(
    buildActiveActionOverlayCard('surface-active-action-result', summary),
  )!;
}

export function buildPeriodSummarySurfacePresentations(
  summary: PeriodSummaryDisplay,
): HeadlessApiSurfacePresentationCard[] {
  return buildPeriodSummaryOverlayCards('surface-period-summary', summary)
    .map(captureProgressionOverlayCard)
    .filter((card): card is HeadlessApiSurfacePresentationCard => card !== null);
}

export function buildDisturbanceSurfacePresentation(
  narrative: DisturbanceNarrativeDisplay,
): HeadlessApiSurfacePresentationCard {
  return captureProgressionOverlayCard(
    buildStageResultOverlayCard(
      'surface-disturbance-result',
      narrative.title,
      [narrative.impactSummary],
    ),
  )!;
}

export function buildPassiveSurfacePresentation(
  passive: PassiveNarrativeDisplay,
): HeadlessApiSurfacePresentationCard {
  return {
    title: passive.title,
    body: passive.text,
  };
}
