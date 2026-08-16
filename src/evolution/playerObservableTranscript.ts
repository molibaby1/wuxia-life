export const PLAYER_OBSERVABLE_TRANSCRIPT_VERSION = 'player-observable-v1' as const;
export const HEADLESS_API_PLAYER_SURFACE_ID = 'headless-api-player-v1' as const;

export type ObservableEntryKind =
  | 'story_event'
  | 'choice'
  | 'active_action'
  | 'summary'
  | 'acknowledgement'
  | 'other';

export interface ObservableChoice {
  choiceRef: string;
  label: string;
  description?: string;
}

export interface ObservableEntry {
  entryId: string;
  kind: ObservableEntryKind;
  age?: number;
  title?: string;
  body?: string;
  visibleChoices?: ObservableChoice[];
  selectedChoiceRef?: string;
  visibleOutcome?: string;
  visibleFeedbackLines?: string[];
}

export interface ObservablePayload {
  transcriptVersion: typeof PLAYER_OBSERVABLE_TRANSCRIPT_VERSION;
  surfaceId: typeof HEADLESS_API_PLAYER_SURFACE_ID;
  transcriptId: string;
  entries: ObservableEntry[];
}

const PAYLOAD_KEYS = ['transcriptVersion', 'surfaceId', 'transcriptId', 'entries'] as const;
const ENTRY_KEYS = [
  'entryId',
  'kind',
  'age',
  'title',
  'body',
  'visibleChoices',
  'selectedChoiceRef',
  'visibleOutcome',
  'visibleFeedbackLines',
] as const;
const CHOICE_KEYS = ['choiceRef', 'label', 'description'] as const;

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object and must not be null`);
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      throw new Error(`${label} contains unknown field: ${key}`);
    }
  }
}

function assertNoNull(value: unknown, path: string): void {
  if (value === null) {
    throw new Error(`${path} must not contain null`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoNull(item, `${path}[${index}]`));
    return;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      assertNoNull(child, `${path}.${key}`);
    }
  }
}

function serializeChoice(choice: ObservableChoice, path: string): Record<string, unknown> {
  assertObject(choice, path);
  assertExactKeys(choice, CHOICE_KEYS, path);
  const serialized: Record<string, unknown> = {
    choiceRef: choice.choiceRef,
    label: choice.label,
  };
  if (choice.description !== undefined) serialized.description = choice.description;
  return serialized;
}

function serializeEntry(entry: ObservableEntry, index: number): Record<string, unknown> {
  const path = `payload.entries[${index}]`;
  assertObject(entry, path);
  assertExactKeys(entry, ENTRY_KEYS, path);

  const serialized: Record<string, unknown> = {
    entryId: entry.entryId,
    kind: entry.kind,
  };
  if (entry.age !== undefined) serialized.age = entry.age;
  if (entry.title !== undefined) serialized.title = entry.title;
  if (entry.body !== undefined) serialized.body = entry.body;
  if (entry.visibleChoices !== undefined) {
    serialized.visibleChoices = entry.visibleChoices.map((choice, choiceIndex) =>
      serializeChoice(choice, `${path}.visibleChoices[${choiceIndex}]`));
  }
  if (entry.selectedChoiceRef !== undefined) serialized.selectedChoiceRef = entry.selectedChoiceRef;
  if (entry.visibleOutcome !== undefined) serialized.visibleOutcome = entry.visibleOutcome;
  if (entry.visibleFeedbackLines !== undefined) {
    serialized.visibleFeedbackLines = [...entry.visibleFeedbackLines];
  }
  return serialized;
}

export function serializeObservablePayload(payload: ObservablePayload): string {
  assertObject(payload, 'payload');
  assertNoNull(payload, 'payload');
  assertExactKeys(payload, PAYLOAD_KEYS, 'payload');

  if (payload.transcriptVersion !== PLAYER_OBSERVABLE_TRANSCRIPT_VERSION) {
    throw new Error(`unsupported transcriptVersion: ${String(payload.transcriptVersion)}`);
  }
  if (payload.surfaceId !== HEADLESS_API_PLAYER_SURFACE_ID) {
    throw new Error(`unsupported surfaceId: ${String(payload.surfaceId)}`);
  }
  if (!Array.isArray(payload.entries)) {
    throw new Error('payload.entries must be an array');
  }

  return JSON.stringify({
    transcriptVersion: payload.transcriptVersion,
    surfaceId: payload.surfaceId,
    transcriptId: payload.transcriptId,
    entries: payload.entries.map(serializeEntry),
  });
}
