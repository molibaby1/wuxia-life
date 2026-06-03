/** Prefix for simulator/replay active-action pseudo event ids. */
export const ACTIVE_ACTION_EVENT_PREFIX = 'active_action:';

const LEGACY_ACTIVE_ACTION_IDS: Record<string, string> = {
  active_action_training: 'action_training_basic',
};

export function isActiveActionReplayEventId(eventId: string): boolean {
  return (
    eventId.startsWith(ACTIVE_ACTION_EVENT_PREFIX) ||
    eventId in LEGACY_ACTIVE_ACTION_IDS
  );
}

export function resolveActiveActionIdFromReplayEvent(eventId: string): string | null {
  if (eventId.startsWith(ACTIVE_ACTION_EVENT_PREFIX)) {
    return eventId.slice(ACTIVE_ACTION_EVENT_PREFIX.length);
  }
  return LEGACY_ACTIVE_ACTION_IDS[eventId] ?? null;
}

export function toActiveActionReplayEventId(actionId: string): string {
  return `${ACTIVE_ACTION_EVENT_PREFIX}${actionId}`;
}

/** Deterministic random for parity replay (matches GameProcessSimulator default). */
export const ACTIVE_ACTION_REPLAY_RANDOM = (): number => 0.37;
