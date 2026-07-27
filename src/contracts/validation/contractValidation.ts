/**
 * Lightweight contract validation helpers (P4 US-023).
 *
 * Used by contract tests and reports only — not imported by gameplay runtime.
 */

import type { ChoiceExecutionRequest, ChoiceExecutionResponse } from '../choiceExecution';
import type { EventCatalogValidationSummary, EventBundleResponse } from '../eventCatalog';
import {
  GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
  type GameStateSnapshot,
  type GameStateSnapshotMetadata,
} from '../gameStateSnapshot';
import type { EffectDefinition, EventCondition, PlayerLifeStates } from '../../types/eventTypes';
import { EffectType, isHealthStatus, isStatusId, LIFE_STATE_KEYS } from '../../types/eventTypes';
import type { ReplayLog, ReplayLogEntry } from '../replayLog';

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export interface ValidationFailure {
  ok: false;
  errors: string[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validateHealthStatusEffect(effect: unknown): ValidationResult<EffectDefinition> {
  if (!isPlainObject(effect)) return fail(['effect must be an object']);
  if (effect.type === EffectType.HEALTH_STATUS_SET) {
    if (!isHealthStatus(effect.value)) return fail(['health_status_set.value must be a valid HealthStatus']);
    return pass(effect as unknown as EffectDefinition);
  }
  if (effect.type === EffectType.STATUS_ADD || effect.type === EffectType.STATUS_REMOVE) {
    if (!isStatusId(effect.status)) return fail([`${effect.type}.status must be a valid StatusId`]);
    return pass(effect as unknown as EffectDefinition);
  }
  return fail(['unsupported health/status effect type']);
}

export function validateStatusCondition(condition: unknown): ValidationResult<EventCondition> {
  if (!isPlainObject(condition) || condition.type !== 'status_has') {
    return fail(['condition.type must be status_has']);
  }
  if (!isStatusId(condition.status)) return fail(['status_has.status must be a valid StatusId']);
  return pass(condition as unknown as EventCondition);
}

function fail(errors: string[]): ValidationFailure {
  return { ok: false, errors };
}

function pass<T>(value: T): ValidationSuccess<T> {
  return { ok: true, value };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validatePlayerLifeStates(value: unknown): ValidationResult<PlayerLifeStates> {
  if (!isPlainObject(value)) return fail(['player.lifeStates must be an object']);

  const errors: string[] = [];
  const expected = new Set<string>(LIFE_STATE_KEYS);
  for (const key of LIFE_STATE_KEYS) {
    if (!(key in value)) {
      errors.push(`player.lifeStates.${key} required`);
    }
  }
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) {
      errors.push(`player.lifeStates.${key} is forbidden`);
    }
  }
  for (const key of LIFE_STATE_KEYS) {
    const stateValue = value[key];
    if (typeof stateValue !== 'number' || !Number.isFinite(stateValue)) {
      errors.push(`player.lifeStates.${key} must be a finite number`);
    } else if (stateValue < 0 || stateValue > 5) {
      errors.push(`player.lifeStates.${key} must be between 0 and 5`);
    }
  }
  if (errors.length > 0) return fail(errors);
  return pass(value as unknown as PlayerLifeStates);
}

const REQUIRED_SNAPSHOT_METADATA: (keyof GameStateSnapshotMetadata)[] = [
  'schemaVersion',
  'engineVersion',
  'eventCatalogVersion',
  'createdAt',
  'updatedAt',
  'sourcePlatform',
];

const FORBIDDEN_SNAPSHOT_STATE_KEYS = [
  'statistics',
  'lifeMemorySummary',
  'currentEvent',
  'availableChoices',
  'lastChoiceFeedback',
  'engineState',
] as const;

const REQUIRED_SNAPSHOT_PLAYER_KEYS = [
  'name',
  'age',
  'gender',
  'alive',
  'investments',
  'healthStatus',
  'statuses',
] as const;

export const FORBIDDEN_HABIT_FLAG_KEYS = ['training_habit', 'study_habit', 'business_habit'] as const;

export function findForbiddenHabitFlagPaths(value: unknown, rootPath: string): string[] {
  const paths: string[] = [];
  const visit = (current: unknown, currentPath: string): void => {
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${currentPath}[${index}]`));
      return;
    }
    if (!isPlainObject(current)) return;
    for (const [key, child] of Object.entries(current)) {
      const childPath = currentPath ? `${currentPath}.${key}` : key;
      if ((FORBIDDEN_HABIT_FLAG_KEYS as readonly string[]).includes(key)) paths.push(childPath);
      visit(child, childPath);
    }
  };
  visit(value, rootPath);
  return paths;
}

export function validateGameStateSnapshot(snapshot: unknown): ValidationResult<GameStateSnapshot> {
  const errors: string[] = [];
  if (!isPlainObject(snapshot)) {
    return fail(['snapshot must be an object']);
  }
  const s = snapshot;
  if (!isPlainObject(s.metadata)) {
    errors.push('metadata required');
  } else {
    const m = s.metadata;
    if (m.schemaVersion !== GAME_STATE_SNAPSHOT_SCHEMA_VERSION) {
      errors.push(`metadata.schemaVersion must be ${GAME_STATE_SNAPSHOT_SCHEMA_VERSION}`);
    }
    for (const key of REQUIRED_SNAPSHOT_METADATA) {
      if (m[key] === undefined || m[key] === null || m[key] === '') {
        errors.push(`metadata.${key} required`);
      }
    }
  }
  if (!isPlainObject(s.state)) {
    errors.push('state required');
  } else {
    const st = s.state;
    errors.push(...findForbiddenHabitFlagPaths(st.flags, 'state.flags').map(path => `forbidden ${path}`));
    errors.push(...findForbiddenHabitFlagPaths(st.player, 'state.player').map(path => `forbidden ${path}`));
    errors.push(...findForbiddenHabitFlagPaths(st.eventHistory, 'state.eventHistory').map(path => `forbidden ${path}`));
    for (const key of ['player', 'flags', 'relations', 'eventHistory']) {
      if (!(key in st)) errors.push(`state.${key} required`);
    }
    if (!isPlainObject(st.player)) {
      errors.push('state.player required');
    } else {
      const player = st.player;
      if ('energy' in player) errors.push('forbidden state.player.energy');
      if ('health' in player) errors.push('forbidden state.player.health');
      for (const key of REQUIRED_SNAPSHOT_PLAYER_KEYS) {
        if (player[key] === undefined || player[key] === null || player[key] === '') {
          errors.push(`state.player.${key} required`);
        }
      }
      if (player.lifeStates !== undefined) {
        const lifeStatesResult = validatePlayerLifeStates(player.lifeStates);
        if ('errors' in lifeStatesResult) errors.push(...lifeStatesResult.errors);
      }
    }
    for (const key of FORBIDDEN_SNAPSHOT_STATE_KEYS) {
      if (key in st) errors.push(`forbidden state.${key}`);
    }
  }
  if (errors.length > 0) return fail(errors);
  return pass(snapshot as unknown as GameStateSnapshot);
}

export function validateChoiceExecutionRequest(
  request: unknown,
): ValidationResult<ChoiceExecutionRequest> {
  const errors: string[] = [];
  if (typeof request !== 'object' || request === null) {
    return fail(['request must be an object']);
  }
  const r = request as Record<string, unknown>;
  if (r.requestVersion !== '1.0.0') errors.push('requestVersion must be 1.0.0');
  const ref = r.snapshotRef as Record<string, unknown> | undefined;
  if (!ref || (!ref.snapshotId && !ref.snapshot)) {
    errors.push('snapshotRef.snapshotId or snapshotRef.snapshot required');
  }
  const action = r.action as Record<string, unknown> | undefined;
  if (!action?.eventId) errors.push('action.eventId required');
  if (!action?.choiceId) errors.push('action.choiceId required');
  if (errors.length > 0) return fail(errors);
  return pass(request as ChoiceExecutionRequest);
}

export function validateChoiceExecutionResponse(
  response: unknown,
): ValidationResult<ChoiceExecutionResponse> {
  const errors: string[] = [];
  if (!isPlainObject(response)) {
    return fail(['response must be an object']);
  }
  const r = response;
  if (r.responseVersion !== '1.0.0') errors.push('responseVersion must be 1.0.0');
  if (r.status === 'success') {
    if (!isPlainObject(r.nextSnapshot)) {
      errors.push('nextSnapshot required on success');
    } else {
      const snapshotValidation = validateGameStateSnapshot(r.nextSnapshot);
      if ('errors' in snapshotValidation) {
        errors.push(...snapshotValidation.errors.map((e) => `nextSnapshot.${e}`));
      }
    }
    if (!r.feedback) errors.push('feedback required on success');
    if (!isPlainObject(r.append)) {
      errors.push('append required on success');
    } else {
      if (!Array.isArray(r.append.eventHistory)) errors.push('append.eventHistory must be an array');
      if (!Array.isArray(r.append.generatedLogs)) errors.push('append.generatedLogs must be an array');
    }
    if (!isPlainObject(r.deltas)) errors.push('deltas required on success');
    if (!isPlainObject(r.hints)) errors.push('hints required on success');
    if (!isPlainObject(r.diagnostics)) {
      errors.push('diagnostics required on success');
    } else {
      if (!r.diagnostics.engineVersion) errors.push('diagnostics.engineVersion required on success');
      if (!r.diagnostics.eventCatalogVersion) {
        errors.push('diagnostics.eventCatalogVersion required on success');
      }
    }
  } else if (r.status === 'failure') {
    const err = isPlainObject(r.error) ? r.error : undefined;
    if (!err?.code) errors.push('error.code required on failure');
  } else {
    errors.push('status must be success or failure');
  }
  if (errors.length > 0) return fail(errors);
  return pass(response as unknown as ChoiceExecutionResponse);
}

const REQUIRED_REPLAY_METADATA = [
  'replayVersion',
  'engineVersion',
  'eventCatalogVersion',
  'initialSeed',
  'startSnapshotHash',
  'platform',
  'createdAt',
] as const;

export function validateReplayLog(log: unknown): ValidationResult<ReplayLog> {
  const errors: string[] = [];
  if (!isPlainObject(log)) return fail(['log must be an object']);
  const l = log;
  const meta = isPlainObject(l.metadata) ? l.metadata : undefined;
  if (!meta) {
    errors.push('metadata required');
  } else {
    for (const key of REQUIRED_REPLAY_METADATA) {
      if (meta[key] === undefined || meta[key] === '') errors.push(`metadata.${key} required`);
    }
  }
  if (!Array.isArray(l.entries)) {
    errors.push('entries must be an array');
  } else {
    let prevSequence = 0;
    let prevSnapshotHashAfter: string | null = null;
    let prevRandomDrawIndex: number | null = null;
    let terminalFound = false;

    l.entries.forEach((entry, i) => {
      const e = entry as ReplayLogEntry;

      if (terminalFound) {
        errors.push(`entries[${i}] must not exist after terminal entry`);
      }

      if (e.sequence === undefined || e.sequence === null) {
        errors.push(`entries[${i}].sequence required`);
      } else if (!Number.isInteger(e.sequence)) {
        errors.push(`entries[${i}].sequence must be an integer`);
      } else if (e.sequence <= prevSequence) {
        errors.push(`entries[${i}].sequence must be strictly increasing`);
      } else {
        prevSequence = e.sequence;
      }

      if (!e.actionType) errors.push(`entries[${i}].actionType required`);
      if (e.age === undefined || e.age === null) {
        errors.push(`entries[${i}].age required`);
      } else if (typeof e.age !== 'number' || Number.isNaN(e.age)) {
        errors.push(`entries[${i}].age must be a number`);
      }
      if (!isPlainObject(e.timestamp)) {
        errors.push(`entries[${i}].timestamp required`);
      } else {
        if (typeof e.timestamp.year !== 'number') errors.push(`entries[${i}].timestamp.year required`);
        if (typeof e.timestamp.month !== 'number') errors.push(`entries[${i}].timestamp.month required`);
        if (typeof e.timestamp.day !== 'number') errors.push(`entries[${i}].timestamp.day required`);
      }
      if (!e.snapshotHashBefore) errors.push(`entries[${i}].snapshotHashBefore required`);
      if (!e.snapshotHashAfter) errors.push(`entries[${i}].snapshotHashAfter required`);

      if (meta) {
        if (i === 0 && e.snapshotHashBefore !== meta.startSnapshotHash) {
          errors.push(`entries[${i}].snapshotHashBefore must match metadata.startSnapshotHash`);
        }
        if (i > 0 && prevSnapshotHashAfter !== null && e.snapshotHashBefore !== prevSnapshotHashAfter) {
          errors.push(`entries[${i}].snapshotHashBefore must match previous snapshotHashAfter`);
        }
      }
      prevSnapshotHashAfter = e.snapshotHashAfter ?? null;

      if (e.randomDrawIndex !== undefined) {
        if (!Number.isInteger(e.randomDrawIndex)) {
          errors.push(`entries[${i}].randomDrawIndex must be an integer`);
        } else if (prevRandomDrawIndex !== null && e.randomDrawIndex <= prevRandomDrawIndex) {
          errors.push(`entries[${i}].randomDrawIndex must be strictly increasing`);
        } else {
          prevRandomDrawIndex = e.randomDrawIndex;
        }
      }

      if ((e.actionType === 'choice' || e.actionType === 'auto_event') && !e.eventId) {
        errors.push(`entries[${i}].eventId required`);
      }
      if (e.actionType === 'choice' && !e.choiceId) {
        errors.push(`entries[${i}].choiceId required`);
      }
      if (e.actionType === 'terminal') {
        terminalFound = true;
      }
    });
  }
  if (errors.length > 0) return fail(errors);
  return pass(log as unknown as ReplayLog);
}

export function validateEventCatalogBundle(
  bundle: unknown,
): ValidationResult<EventBundleResponse> {
  const errors: string[] = [];
  if (!isPlainObject(bundle)) return fail(['bundle must be an object']);
  const b = bundle;
  if (!isPlainObject(b.metadata)) {
    errors.push('metadata required');
  } else {
    const m = b.metadata;
    for (const key of [
      'catalogVersion',
      'contractVersion',
      'publishedAt',
      'eventCount',
      'activeCount',
      'deferredCount',
    ] as const) {
      if (m[key] === undefined || m[key] === null || m[key] === '') {
        errors.push(`metadata.${key} required`);
      }
    }
  }
  if (!Array.isArray(b.events)) {
    errors.push('events must be an array');
  } else {
    b.events.forEach((entry, i) => {
      if (!isPlainObject(entry)) {
        errors.push(`events[${i}] must be an object`);
        return;
      }
      if (!entry.eventId) errors.push(`events[${i}].eventId required`);
      if (!entry.status) errors.push(`events[${i}].status required`);
      if (!entry.validationState) errors.push(`events[${i}].validationState required`);
    });
  }
  if (errors.length > 0) return fail(errors);
  return pass(bundle as unknown as EventBundleResponse);
}

export function validateEventCatalogSummary(
  summary: unknown,
): ValidationResult<EventCatalogValidationSummary> {
  const errors: string[] = [];
  if (!isPlainObject(summary)) return fail(['summary must be an object']);
  const s = summary;
  if (!s.catalogVersion) errors.push('catalogVersion required');
  if (!isPlainObject(s.counts)) errors.push('counts required');
  if (!Array.isArray(s.misfitEventIds)) errors.push('misfitEventIds must be an array');
  if (!Array.isArray(s.serverOnlyFields)) errors.push('serverOnlyFields must be an array');
  if (!Array.isArray(s.diagnosticOnlyFields)) errors.push('diagnosticOnlyFields must be an array');
  if (errors.length > 0) return fail(errors);
  return pass(summary as unknown as EventCatalogValidationSummary);
}
