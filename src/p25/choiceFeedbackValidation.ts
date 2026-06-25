import goldenLineSpine from '../data/golden-line-spine.json';
import goldenLinePayoffMap from '../data/golden-line-payoff-map.json';
import { eventLoader } from '../core/EventLoader';
import type { EventChoice } from '../types/eventTypes';
import { isBannedVagueFeedback } from '../data/golden-line-feedback-patterns';

export interface KeyChoiceFeedbackIssue {
  eventId: string;
  choiceId: string;
  reason: string;
}

function choiceHasPlayerFacingNarrative(choice: EventChoice): boolean {
  if (choice.outcomes?.some(o => typeof o.text === 'string' && o.text.trim().length > 0)) return true;
  if (typeof choice.description === 'string' && choice.description.trim().length > 0) return true;
  if (typeof choice.text === 'string' && choice.text.trim().length > 0 && !isBannedVagueFeedback(choice.text)) {
    return true;
  }
  return false;
}

function choiceWritesVisibleState(choice: EventChoice): boolean {
  const topEffects = choice.effects ?? [];
  const outcomeEffects = (choice.outcomes ?? []).flatMap(o => o.effects ?? []);
  const effects = [...topEffects, ...outcomeEffects];
  return effects.some(
    e =>
      e.type === 'stat_modify' ||
      e.type === 'flag_set' ||
      e.type === 'relation_change' ||
      e.type === 'route_change',
  );
}

/** Validates golden-spine key choices have narrative + durable writes per P25 US-004. */
export function validateKeyChoiceFeedbackCoverage(): KeyChoiceFeedbackIssue[] {
  const issues: KeyChoiceFeedbackIssue[] = [];
  const keyIds = new Set(goldenLineSpine.keyChoiceEventIds as string[]);

  for (const eventId of keyIds) {
    const event = eventLoader.getEventById(eventId);
    if (!event?.choices?.length) {
      issues.push({ eventId, choiceId: '*', reason: 'missing_event_or_choices' });
      continue;
    }
    for (const choice of event.choices) {
      const choiceId = choice.id ?? choice.text ?? 'unknown';
      if (!choiceHasPlayerFacingNarrative(choice)) {
        issues.push({ eventId, choiceId, reason: 'missing_player_facing_narrative' });
      }
      if (!choiceWritesVisibleState(choice)) {
        issues.push({ eventId, choiceId, reason: 'hidden_only_no_visible_state' });
      }
    }
  }

  return issues;
}

export function validateKeyChoicePayoffCoverage(): string[] {
  const missing: string[] = [];
  const entries = goldenLinePayoffMap.entries as Array<{
    keyChoiceEventId: string;
    durableWrites?: string[];
    payoffs?: unknown[];
  }>;
  for (const entry of entries) {
    if (!entry.durableWrites?.length) {
      missing.push(entry.keyChoiceEventId);
    }
    if (!entry.payoffs?.length) {
      missing.push(`${entry.keyChoiceEventId}:no_payoff`);
    }
  }
  return missing;
}
