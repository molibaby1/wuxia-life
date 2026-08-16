import {
  HEADLESS_API_PLAYER_SURFACE_ID,
  PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
  type ObservableChoice,
  type ObservableEntry,
  type ObservableEntryKind,
  type ObservablePayload,
} from './playerObservableTranscript';
import {
  HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION,
  type HeadlessApiPlayerSurfaceStep,
  type HeadlessApiPlayerSurfaceTrace,
  type HeadlessApiSurfacePresentationCard,
} from '../headless/playability/playerSurfaceCapture';

function entryRef(index: number): string {
  return `entry-${String(index).padStart(6, '0')}`;
}

function choiceRef(entryIndex: number, choiceIndex: number): string {
  return `choice-${String(entryIndex).padStart(6, '0')}-${String(choiceIndex).padStart(2, '0')}`;
}

function presentationFields(
  card: HeadlessApiSurfacePresentationCard | undefined,
): Pick<ObservableEntry, 'visibleOutcome' | 'visibleFeedbackLines'> {
  if (!card) return {};
  return {
    ...(card.body !== undefined ? { visibleOutcome: card.body } : {}),
    ...(card.metaLines !== undefined ? { visibleFeedbackLines: [...card.metaLines] } : {}),
  };
}

function mapNonStoryKind(kind: HeadlessApiPlayerSurfaceStep['kind']): ObservableEntryKind {
  switch (kind) {
    case 'active_action_result':
      return 'active_action';
    case 'period_summary':
      return 'summary';
    case 'disturbance':
    case 'passive_narrative':
      return 'other';
    case 'story_event':
      return 'story_event';
    default:
      return 'other';
  }
}

export function projectHeadlessApiPlayerObservablePayload(
  source: HeadlessApiPlayerSurfaceTrace,
): ObservablePayload {
  if (source.schemaVersion !== HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION) {
    throw new Error(`unsupported player surface source version: ${String(source.schemaVersion)}`);
  }

  const entries: ObservableEntry[] = [];

  for (const step of source.steps) {
    if (step.kind === 'story_event') {
      if (!step.storyEvent) {
        throw new Error(`story_event source step ${step.sequence} is missing storyEvent`);
      }

      const nextEntryIndex = entries.length + 1;
      const internalToOpaque = new Map<string, string>();
      const visibleChoices: ObservableChoice[] | undefined = step.storyEvent.choices?.map((choice, index) => {
        const ref = choiceRef(nextEntryIndex, index + 1);
        internalToOpaque.set(choice.id, ref);
        return {
          choiceRef: ref,
          label: choice.text,
          ...(choice.description !== undefined ? { description: choice.description } : {}),
        };
      });

      let selectedChoiceRef: string | undefined;
      if (step.selectedChoiceId !== undefined) {
        selectedChoiceRef = internalToOpaque.get(step.selectedChoiceId);
        if (!selectedChoiceRef) {
          throw new Error(
            `selected choice ${step.selectedChoiceId} is not present in the player-visible choice set`,
          );
        }
      }

      const primaryPresentation = step.presentationCards?.[0];
      entries.push({
        entryId: entryRef(nextEntryIndex),
        kind: 'story_event',
        title: step.storyEvent.title,
        body: step.storyEvent.text,
        ...(visibleChoices !== undefined ? { visibleChoices } : {}),
        ...(selectedChoiceRef !== undefined ? { selectedChoiceRef } : {}),
        ...presentationFields(primaryPresentation),
      });

      for (const extraCard of step.presentationCards?.slice(1) ?? []) {
        const extraIndex = entries.length + 1;
        entries.push({
          entryId: entryRef(extraIndex),
          kind: 'other',
          title: extraCard.title,
          ...(extraCard.body !== undefined ? { body: extraCard.body } : {}),
          ...(extraCard.metaLines !== undefined
            ? { visibleFeedbackLines: [...extraCard.metaLines] }
            : {}),
        });
      }
      continue;
    }

    for (const card of step.presentationCards ?? []) {
      const nextEntryIndex = entries.length + 1;
      entries.push({
        entryId: entryRef(nextEntryIndex),
        kind: mapNonStoryKind(step.kind),
        title: card.title,
        ...(card.body !== undefined ? { visibleOutcome: card.body } : {}),
        ...(card.metaLines !== undefined ? { visibleFeedbackLines: [...card.metaLines] } : {}),
      });
    }
  }

  return {
    transcriptVersion: PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
    surfaceId: HEADLESS_API_PLAYER_SURFACE_ID,
    transcriptId: 'transcript-0001',
    entries,
  };
}
