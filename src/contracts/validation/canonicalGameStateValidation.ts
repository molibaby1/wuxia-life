import type { GameState } from '../../types/eventTypes';
import {
  GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
  type GameStateSnapshot,
  type SourcePlatform,
} from '../gameStateSnapshot';
import {
  HEALTH_STATUS_VALUES,
  LIFE_STATE_KEYS,
  STATUS_ID_VALUES,
} from '../../types/eventTypes';

export interface CanonicalValidationIssue {
  path: string;
  code: 'required' | 'forbidden' | 'invalid_type' | 'invalid_value';
  message: string;
}

export class CanonicalValidationError extends Error {
  constructor(readonly issues: CanonicalValidationIssue[]) {
    super(issues.map(issue => `${issue.path}: ${issue.message}`).join('; '));
    this.name = 'CanonicalValidationError';
  }
}

const SOURCE_PLATFORMS: readonly SourcePlatform[] = [
  'web-browser', 'node-headless', 'export-json', 'api-server', 'mini-program',
];
const TRAIT_IDS = new Set([
  'martial_born', 'keen_mind', 'social_gift', 'iron_abacus', 'unyielding', 'heroic_heart',
  'cold_reader', 'perfect_memory', 'frail', 'slow_witted', 'lazy', 'soft_eared',
  'unstable_mood', 'grand_dreams_poor_followthrough', 'loner', 'fear_of_responsibility',
  'competitive', 'affectionate', 'profit_driven', 'orderly', 'adventurous', 'risk_averse',
  'disciplined', 'indulgent',
]);
const RELATIONSHIP_ROLES = new Set(['master', 'lover', 'sworn', 'rival', 'friend', 'family', 'enemy', 'patron']);
const LIFE_STAGES = new Set(['growth', 'development', 'achievement', 'legacy']);
const CRITICAL_CHOICE_VALUES = {
  sect_choice: new Set(['orthodox', 'unconventional', 'neutral', 'none']),
  life_goal: new Set(['hero', 'merchant', 'scholar', 'hermit']),
  marriage_choice: new Set(['arranged', 'love', 'single']),
  midlife_choice: new Set(['sect_leader', 'hermit', 'wanderer']),
  war_choice: new Set(['traditional', 'reformist', 'neutral', 'pacifist']),
} as const;
const LEGACY_HABIT_FLAGS = new Set(['training' + '_habit', 'study' + '_habit', 'business' + '_habit']);
const ROUTE_LIFECYCLE_KEYS = new Set(['routeStates', 'routeHistory', 'roadCommitments']);
const SNAPSHOT_METADATA_KEYS = new Set([
  'schemaVersion', 'engineVersion', 'eventCatalogVersion', 'createdAt', 'updatedAt', 'sourcePlatform',
  'snapshotId', 'lifeMemorySchemaVersion', 'contentHash',
]);
const SNAPSHOT_STATE_KEYS = new Set([
  'player', 'facts', 'flags', 'relations', 'eventHistory', 'currentTime', 'lifePath', 'identity', 'karma',
  'criticalChoices', 'achievements', 'inventory', 'ending', 'saveVersion', 'lastSavedAt', 'gameTimestamp',
  'pendingStoryEventId', 'triggeredEvents', 'events', 'actionHistory', 'actionFocusStreak', 'p16TendencyShaping',
]);
const RUNTIME_STATE_KEYS = new Set([
  ...SNAPSHOT_STATE_KEYS, 'statistics', 'selfAwareness', 'playerFeedbackMessage', 'p16RareLineLog',
]);
const PLAYER_KEYS = new Set([
  'age', 'gender', 'name', 'martialPower', 'chivalry',
  'constitution', 'comprehension', 'sect', 'title', 'reputation', 'money', 'knowledge', 'charisma',
  'businessAcumen', 'influence', 'wealth', 'connections', 'martialHeritage', 'scholarlyHeritage',
  'merchantNetwork', 'investments', 'items',
  'flags', 'events', 'children', 'spouse', 'relationships', 'alive', 'deathReason', 'timeUnit',
  'monthProgress', 'dayProgress', 'traits', 'healthStatus', 'statuses', 'lifeStates',
]);
const REQUIRED_PLAYER_KEYS = [
  'name', 'age', 'gender', 'alive', 'martialPower',
  'chivalry', 'constitution', 'comprehension', 'sect', 'title', 'reputation', 'money', 'knowledge', 'charisma',
  'businessAcumen', 'influence', 'connections', 'martialHeritage', 'scholarlyHeritage', 'merchantNetwork',
  'investments', 'flags', 'children', 'spouse', 'traits', 'healthStatus', 'statuses', 'lifeStates',
];
const REQUIRED_STATE_KEYS = ['player', 'facts', 'flags', 'relations', 'eventHistory', 'actionHistory', 'actionFocusStreak'];
const INVESTMENT_KEYS = ['martial', 'statecraft', 'official', 'hermit'];
const EVENT_RECORD_KEYS = new Set([
  'eventId', 'gameTime', 'realTime', 'age', 'timestamp', 'triggeredAt', 'selectedChoice', 'stateSnapshot', 'appliedEffects',
]);
const CURRENT_TIME_KEYS = new Set(['year', 'month', 'day']);
const ACTION_HISTORY_KEYS = new Set(['actionId', 'category', 'duration', 'deltas', 'sourceKind', 'age', 'timestamp', 'narrativeShownToPlayer']);
const ACTION_DURATION_KEYS = new Set(['value', 'unit']);
const TENDENCY_KEYS = new Set(['discipline', 'endurance', 'caution', 'empathy', 'ambition', 'socialEase']);
const STATISTICS_KEYS = new Set(['totalEvents', 'totalChoices', 'playTime', 'totalYears']);

export const CANONICAL_SNAPSHOT_PLAYER_KEYS = [...PLAYER_KEYS] as const;
export const CANONICAL_SNAPSHOT_STATE_KEYS = [...SNAPSHOT_STATE_KEYS] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function addContainerIssue(
  issues: CanonicalValidationIssue[],
  path: string,
  message: string,
): void {
  addIssue(issues, path, 'invalid_type', message);
}

function validateJsonContainer(
  value: unknown,
  path: string,
  issues: CanonicalValidationIssue[],
  active = new WeakSet<object>(),
  visited = new WeakSet<object>(),
): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) addContainerIssue(issues, path, 'must be a finite number');
    return;
  }
  if (typeof value === 'undefined') { addContainerIssue(issues, path, 'undefined is not valid JSON'); return; }
  if (typeof value === 'bigint') { addContainerIssue(issues, path, 'bigint is not valid JSON'); return; }
  if (typeof value === 'function') { addContainerIssue(issues, path, 'function is not valid JSON'); return; }
  if (typeof value === 'symbol') { addContainerIssue(issues, path, 'symbol is not valid JSON'); return; }
  if (typeof value !== 'object') { addContainerIssue(issues, path, 'must be JSON data'); return; }

  if (active.has(value)) {
    addContainerIssue(issues, path, 'circular reference is not valid canonical JSON');
    return;
  }
  if (visited.has(value)) return;
  active.add(value);
  visited.add(value);

  const expectedPrototype = Array.isArray(value) ? Array.prototype : Object.prototype;
  if (Object.getPrototypeOf(value) !== expectedPrototype) {
    addContainerIssue(issues, path, 'must be a plain JSON object with Object.prototype');
    active.delete(value);
    return;
  }

  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === 'length') continue;
    if (typeof key === 'symbol') {
      addContainerIssue(issues, `${path}[symbol]`, 'symbol keys are not valid canonical JSON');
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable) {
      addContainerIssue(issues, `${path}.${key}`, 'non-enumerable properties are not valid canonical JSON');
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
      addContainerIssue(issues, `${path}.${key}`, 'getter/setter properties are not valid canonical JSON');
      continue;
    }
    if (Array.isArray(value)) {
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0 || index >= value.length || String(index) !== key) {
        addContainerIssue(issues, `${path}.${key}`, 'array properties must be dense JSON indices');
        continue;
      }
    }
    validateJsonContainer(descriptor.value, Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`, issues, active, visited);
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!hasOwn(value as unknown as Record<string, unknown>, String(index))) {
        addContainerIssue(issues, `${path}[${index}]`, 'sparse arrays are not valid canonical JSON');
      }
    }
  }
  active.delete(value);
}

function cloneValidatedJsonValue<T>(value: T, active = new WeakMap<object, unknown>()): T {
  if (value === null || typeof value !== 'object') return value;
  const existing = active.get(value);
  if (existing !== undefined) return existing as T;
  if (Array.isArray(value)) {
    const result: unknown[] = new Array(value.length);
    active.set(value, result);
    for (let index = 0; index < value.length; index += 1) result[index] = cloneValidatedJsonValue(value[index], active);
    return result as T;
  }
  const result: Record<string, unknown> = {};
  active.set(value, result);
  for (const key of Object.keys(value)) {
    Object.defineProperty(result, key, {
      value: cloneValidatedJsonValue(value[key], active),
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  return result as T;
}

export function cloneCanonicalJsonValue<T>(value: T): T {
  const issues: CanonicalValidationIssue[] = [];
  validateJsonContainer(value, 'value', issues);
  if (issues.length > 0) throw new CanonicalValidationError(issues);
  return cloneValidatedJsonValue(value);
}

function addIssue(issues: CanonicalValidationIssue[], path: string, code: CanonicalValidationIssue['code'], message: string): void {
  issues.push({ path, code, message });
}

function objectAt(value: unknown, path: string, issues: CanonicalValidationIssue[]): value is Record<string, unknown> {
  if (!isObject(value)) {
    addIssue(issues, path, 'invalid_type', 'must be an object');
    return false;
  }
  return true;
}

function exactKeys(value: Record<string, unknown>, path: string, allowed: ReadonlySet<string>, issues: CanonicalValidationIssue[]): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) addIssue(issues, `${path}.${key}`, 'forbidden', 'unknown field');
  }
}

function required(value: Record<string, unknown>, path: string, keys: readonly string[], issues: CanonicalValidationIssue[]): void {
  for (const key of keys) {
    if (!hasOwn(value, key)) addIssue(issues, `${path}.${key}`, 'required', 'field is required');
  }
}

function finite(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) addIssue(issues, path, 'invalid_type', 'must be a finite number');
}

function stringValue(value: unknown, path: string, issues: CanonicalValidationIssue[], nonEmpty = false): void {
  if (typeof value !== 'string' || (nonEmpty && value.length === 0)) addIssue(issues, path, 'invalid_type', nonEmpty ? 'must be a non-empty string' : 'must be a string');
}

function booleanValue(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (typeof value !== 'boolean') addIssue(issues, path, 'invalid_type', 'must be a boolean');
}

function jsonValue(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') { finite(value, path, issues); return; }
  if (Array.isArray(value)) { value.forEach((item, index) => jsonValue(item, `${path}[${index}]`, issues)); return; }
  if (isObject(value)) {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) { addIssue(issues, path, 'invalid_type', 'must be a plain JSON object'); return; }
    Object.entries(value).forEach(([key, item]) => jsonValue(item, `${path}.${key}`, issues)); return;
  }
  addIssue(issues, path, 'invalid_type', 'must be JSON data');
}

function validateFacts(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return;
  for (const [key, item] of Object.entries(value)) {
    if (item === null || Array.isArray(item) || isObject(item) || typeof item === 'function' || typeof item === 'symbol' || item === undefined) {
      addIssue(issues, `${path}.${key}`, 'invalid_type', 'fact must be boolean, string, or finite number');
    } else if (typeof item === 'number') finite(item, `${path}.${key}`, issues);
    else if (typeof item !== 'boolean' && typeof item !== 'string') addIssue(issues, `${path}.${key}`, 'invalid_type', 'fact must be boolean, string, or finite number');
  }
}

function validateFlags(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return;
  for (const [key, item] of Object.entries(value)) {
    if (LEGACY_HABIT_FLAGS.has(key)) addIssue(issues, `${path}.${key}`, 'forbidden', 'legacy habit flag is not persisted');
    jsonValue(item, `${path}.${key}`, issues);
  }
}

function validateRelations(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return;
  for (const [key, item] of Object.entries(value)) finite(item, `${path}.${key}`, issues);
}

function validateInvestments(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return;
  required(value, path, INVESTMENT_KEYS, issues);
  exactKeys(value, path, new Set(INVESTMENT_KEYS), issues);
  for (const key of INVESTMENT_KEYS) {
    finite(value[key], `${path}.${key}`, issues);
    if (typeof value[key] === 'number' && value[key] < 0) addIssue(issues, `${path}.${key}`, 'invalid_value', 'must be non-negative');
  }
}

function validateLifeStates(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return;
  required(value, path, LIFE_STATE_KEYS, issues);
  exactKeys(value, path, new Set(LIFE_STATE_KEYS), issues);
  for (const key of LIFE_STATE_KEYS) {
    finite(value[key], `${path}.${key}`, issues);
    if (typeof value[key] === 'number' && (value[key] < 0 || value[key] > 5)) addIssue(issues, `${path}.${key}`, 'invalid_value', 'must be between 0 and 5');
  }
}

function validateCurrentTime(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return;
  required(value, path, ['year', 'month', 'day'], issues);
  exactKeys(value, path, CURRENT_TIME_KEYS, issues);
  finite(value.year, `${path}.year`, issues); finite(value.month, `${path}.month`, issues); finite(value.day, `${path}.day`, issues);
}

function validateStringArray(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!Array.isArray(value)) { addIssue(issues, path, 'invalid_type', 'must be an array'); return; }
  value.forEach((item, index) => stringValue(item, `${path}[${index}]`, issues));
}

function validateRelationships(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!Array.isArray(value)) { addIssue(issues, path, 'invalid_type', 'must be an array'); return; }
  const allowed = new Set(['id', 'role', 'name', 'affinity', 'status']);
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!objectAt(item, itemPath, issues)) return;
    exactKeys(item, itemPath, allowed, issues);
    required(item, itemPath, ['id', 'role', 'name', 'affinity'], issues);
    stringValue(item.id, `${itemPath}.id`, issues, true); if (!RELATIONSHIP_ROLES.has(item.role as string)) addIssue(issues, `${itemPath}.role`, 'invalid_value', 'unknown relationship role'); stringValue(item.name, `${itemPath}.name`, issues, true); finite(item.affinity, `${itemPath}.affinity`, issues);
    if (hasOwn(item, 'status')) stringValue(item.status, `${itemPath}.status`, issues);
  });
}

function validateIdentity(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return;
  exactKeys(value, path, new Set(['identities', 'primary', 'title', 'acquiredAt', 'achievements']), issues);
  required(value, path, ['identities', 'primary'], issues); validateStringArray(value.identities, `${path}.identities`, issues); stringValue(value.primary, `${path}.primary`, issues, true);
  if (hasOwn(value, 'title')) stringValue(value.title, `${path}.title`, issues);
  if (hasOwn(value, 'acquiredAt')) finite(value.acquiredAt, `${path}.acquiredAt`, issues);
  if (hasOwn(value, 'achievements')) validateStringArray(value.achievements, `${path}.achievements`, issues);
}

function validateLifePath(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return;
  exactKeys(value, path, new Set(['primaryIdentity', 'faction', 'lifeStage', 'achievements', 'relationships', 'commitments']), issues);
  required(value, path, ['primaryIdentity', 'faction', 'lifeStage', 'achievements', 'relationships', 'commitments'], issues);
  stringValue(value.primaryIdentity, `${path}.primaryIdentity`, issues, true); stringValue(value.faction, `${path}.faction`, issues); if (!LIFE_STAGES.has(value.lifeStage as string)) addIssue(issues, `${path}.lifeStage`, 'invalid_value', 'unknown life stage'); validateStringArray(value.achievements, `${path}.achievements`, issues);
  for (const key of ['relationships', 'commitments'] as const) {
    const itemPath = `${path}.${key}`; const item = value[key];
    if (!objectAt(item, itemPath, issues)) continue;
    const keys = key === 'relationships' ? ['allies', 'enemies', 'mentors', 'disciples'] : ['cannotJoin', 'mustProtect', 'swornEnemies'];
    exactKeys(item, itemPath, new Set(keys), issues); required(item, itemPath, keys, issues); keys.forEach(child => validateStringArray(item[child], `${itemPath}.${child}`, issues));
  }
}

function validateKarma(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return;
  exactKeys(value, path, new Set(['good_karma', 'evil_karma', 'history']), issues); required(value, path, ['good_karma', 'evil_karma', 'history'], issues); finite(value.good_karma, `${path}.good_karma`, issues); finite(value.evil_karma, `${path}.evil_karma`, issues);
  if (!Array.isArray(value.history)) addIssue(issues, `${path}.history`, 'invalid_type', 'must be an array');
  else value.history.forEach((entry, index) => { const p = `${path}.history[${index}]`; if (!objectAt(entry, p, issues)) return; exactKeys(entry, p, new Set(['amount', 'reason', 'timestamp']), issues); required(entry, p, ['amount', 'reason', 'timestamp'], issues); finite(entry.amount, `${p}.amount`, issues); stringValue(entry.reason, `${p}.reason`, issues); finite(entry.timestamp, `${p}.timestamp`, issues); });
}

function validateCriticalChoices(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return;
  const keys = Object.keys(CRITICAL_CHOICE_VALUES);
  exactKeys(value, path, new Set(keys), issues); for (const key of keys) if (hasOwn(value, key)) { stringValue(value[key], `${path}.${key}`, issues, true); if (!CRITICAL_CHOICE_VALUES[key as keyof typeof CRITICAL_CHOICE_VALUES].has(value[key] as string)) addIssue(issues, `${path}.${key}`, 'invalid_value', 'unknown critical choice'); }
}

function validateInventory(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!Array.isArray(value)) { addIssue(issues, path, 'invalid_type', 'must be an array'); return; }
  value.forEach((entry, index) => { const p = `${path}[${index}]`; if (!objectAt(entry, p, issues)) return; exactKeys(entry, p, new Set(['id', 'name', 'quantity']), issues); required(entry, p, ['id', 'name', 'quantity'], issues); stringValue(entry.id, `${p}.id`, issues, true); stringValue(entry.name, `${p}.name`, issues, true); finite(entry.quantity, `${p}.quantity`, issues); });
}

function validateActionHistory(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!Array.isArray(value)) { addIssue(issues, path, 'invalid_type', 'must be an array'); return; }
  const categories = new Set(['training', 'study', 'socializing', 'travel', 'business', 'health', 'romance', 'jianghu']);
  const units = new Set(['month', 'quarter', 'short_stage', 'year', 'milestone']);
  const sources = new Set(['active_action', 'story_event', 'random_disturbance', 'automatic_progression']);
  value.forEach((entry, index) => { const p = `${path}[${index}]`; if (!objectAt(entry, p, issues)) return; exactKeys(entry, p, ACTION_HISTORY_KEYS, issues); required(entry, p, ['actionId', 'category', 'duration', 'deltas', 'sourceKind', 'age', 'timestamp'], issues); stringValue(entry.actionId, `${p}.actionId`, issues, true); if (!categories.has(entry.category as string)) addIssue(issues, `${p}.category`, 'invalid_value', 'unknown action category'); if (!sources.has(entry.sourceKind as string)) addIssue(issues, `${p}.sourceKind`, 'invalid_value', 'unknown action source'); finite(entry.age, `${p}.age`, issues); validateCurrentTime(entry.timestamp, `${p}.timestamp`, issues); if (objectAt(entry.duration, `${p}.duration`, issues)) { exactKeys(entry.duration, `${p}.duration`, ACTION_DURATION_KEYS, issues); required(entry.duration, `${p}.duration`, ['value', 'unit'], issues); finite(entry.duration.value, `${p}.duration.value`, issues); if (!units.has(entry.duration.unit as string)) addIssue(issues, `${p}.duration.unit`, 'invalid_value', 'unknown duration unit'); } if (!objectAt(entry.deltas, `${p}.deltas`, issues)) return; for (const [key, delta] of Object.entries(entry.deltas)) finite(delta, `${p}.deltas.${key}`, issues); if (hasOwn(entry, 'narrativeShownToPlayer')) booleanValue(entry.narrativeShownToPlayer, `${p}.narrativeShownToPlayer`, issues); });
}

function validateActionFocusStreak(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return; exactKeys(value, path, new Set(['category', 'count']), issues); required(value, path, ['category', 'count'], issues); finite(value.count, `${path}.count`, issues); const categories = new Set(['training', 'study', 'socializing', 'travel', 'business', 'health', 'romance', 'jianghu']); if (value.category !== null && !categories.has(value.category as string)) addIssue(issues, `${path}.category`, 'invalid_value', 'unknown action category');
}

function validateStatistics(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return;
  exactKeys(value, path, STATISTICS_KEYS, issues);
  required(value, path, ['totalEvents', 'totalChoices'], issues);
  for (const key of STATISTICS_KEYS) if (hasOwn(value, key)) finite(value[key], `${path}.${key}`, issues);
}

function validateTendency(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return; exactKeys(value, path, TENDENCY_KEYS, issues); required(value, path, [...TENDENCY_KEYS], issues); for (const key of TENDENCY_KEYS) finite(value[key], `${path}.${key}`, issues);
}

function validateEventRecord(value: unknown, path: string, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, path, issues)) return; exactKeys(value, path, EVENT_RECORD_KEYS, issues); required(value, path, ['eventId'], issues); stringValue(value.eventId, `${path}.eventId`, issues, true);
  for (const key of ['gameTime', 'realTime', 'age'] as const) if (hasOwn(value, key)) finite(value[key], `${path}.${key}`, issues);
  for (const key of ['timestamp', 'triggeredAt'] as const) if (hasOwn(value, key)) { if (typeof value[key] === 'number') finite(value[key], `${path}.${key}`, issues); else validateCurrentTime(value[key], `${path}.${key}`, issues); }
  if (hasOwn(value, 'selectedChoice')) stringValue(value.selectedChoice, `${path}.selectedChoice`, issues);
  if (hasOwn(value, 'stateSnapshot')) validateState(value.stateSnapshot, `${path}.stateSnapshot`, issues, true, true);
  if (hasOwn(value, 'appliedEffects')) { if (!Array.isArray(value.appliedEffects)) addIssue(issues, `${path}.appliedEffects`, 'invalid_type', 'must be an array'); else value.appliedEffects.forEach((effect, index) => { if (!objectAt(effect, `${path}.appliedEffects[${index}]`, issues)) return; jsonValue(effect, `${path}.appliedEffects[${index}]`, issues); }); }
}

function validatePlayer(value: unknown, path: string, issues: CanonicalValidationIssue[], partial: boolean): void {
  if (!objectAt(value, path, issues)) return; exactKeys(value, path, PLAYER_KEYS, issues); if (!partial) required(value, path, REQUIRED_PLAYER_KEYS, issues);
  if (hasOwn(value, 'name')) stringValue(value.name, `${path}.name`, issues, true); if (hasOwn(value, 'age')) finite(value.age, `${path}.age`, issues); if (hasOwn(value, 'gender') && !['male', 'female'].includes(value.gender as string)) addIssue(issues, `${path}.gender`, 'invalid_value', 'unknown gender'); if (hasOwn(value, 'alive')) booleanValue(value.alive, `${path}.alive`, issues);
  const numericKeys = ['martialPower', 'chivalry', 'constitution', 'comprehension', 'reputation', 'money', 'knowledge', 'charisma', 'businessAcumen', 'influence', 'wealth', 'connections', 'martialHeritage', 'scholarlyHeritage', 'merchantNetwork', 'children', 'monthProgress', 'dayProgress']; numericKeys.forEach(key => { if (hasOwn(value, key)) finite(value[key], `${path}.${key}`, issues); });
  for (const key of ['sect', 'title', 'spouse'] as const) if (hasOwn(value, key) && value[key] !== null) stringValue(value[key], `${path}.${key}`, issues);
  if (hasOwn(value, 'deathReason')) stringValue(value.deathReason, `${path}.deathReason`, issues); if (hasOwn(value, 'timeUnit') && !['year', 'month', 'day'].includes(value.timeUnit as string)) addIssue(issues, `${path}.timeUnit`, 'invalid_value', 'unknown time unit');
  if (hasOwn(value, 'investments')) validateInvestments(value.investments, `${path}.investments`, issues); if (hasOwn(value, 'flags')) validateFlags(value.flags, `${path}.flags`, issues); if (hasOwn(value, 'traits')) { if (!Array.isArray(value.traits)) addIssue(issues, `${path}.traits`, 'invalid_type', 'must be an array'); else value.traits.forEach((trait, index) => { if (typeof trait !== 'string' || !TRAIT_IDS.has(trait)) addIssue(issues, `${path}.traits[${index}]`, 'invalid_value', 'unknown trait'); }); }
  if (hasOwn(value, 'healthStatus') && !HEALTH_STATUS_VALUES.includes(value.healthStatus as never)) addIssue(issues, `${path}.healthStatus`, 'invalid_value', 'unknown health status'); if (hasOwn(value, 'statuses')) { if (!Array.isArray(value.statuses)) addIssue(issues, `${path}.statuses`, 'invalid_type', 'must be an array'); else { const seen = new Set<unknown>(); value.statuses.forEach((status, index) => { if (!STATUS_ID_VALUES.includes(status as never)) addIssue(issues, `${path}.statuses[${index}]`, 'invalid_value', 'unknown status'); if (seen.has(status)) addIssue(issues, `${path}.statuses[${index}]`, 'invalid_value', 'duplicate status'); seen.add(status); }); } }
  if (hasOwn(value, 'items')) jsonValue(value.items, `${path}.items`, issues); if (hasOwn(value, 'events')) { if (!Array.isArray(value.events)) addIssue(issues, `${path}.events`, 'invalid_type', 'must be an array'); else value.events.forEach((event, index) => validateEventRecord(event, `${path}.events[${index}]`, issues)); } if (hasOwn(value, 'relationships')) validateRelationships(value.relationships, `${path}.relationships`, issues); if (hasOwn(value, 'lifeStates')) validateLifeStates(value.lifeStates, `${path}.lifeStates`, issues);
  if (hasOwn(value, 'energy')) addIssue(issues, `${path}.energy`, 'forbidden', 'legacy energy is not persisted'); if (hasOwn(value, 'health')) addIssue(issues, `${path}.health`, 'forbidden', 'legacy health is not persisted');
}

function validateState(value: unknown, path: string, issues: CanonicalValidationIssue[], partial: boolean, snapshotShape: boolean): void {
  if (!objectAt(value, path, issues)) return; exactKeys(value, path, snapshotShape ? SNAPSHOT_STATE_KEYS : RUNTIME_STATE_KEYS, issues); if (!partial) required(value, path, REQUIRED_STATE_KEYS, issues);
  if (hasOwn(value, 'player')) validatePlayer(value.player, `${path}.player`, issues, partial); if (hasOwn(value, 'facts')) validateFacts(value.facts, `${path}.facts`, issues); if (hasOwn(value, 'flags')) validateFlags(value.flags, `${path}.flags`, issues); if (hasOwn(value, 'relations')) validateRelations(value.relations, `${path}.relations`, issues);
  if (hasOwn(value, 'eventHistory')) { if (!Array.isArray(value.eventHistory)) addIssue(issues, `${path}.eventHistory`, 'invalid_type', 'must be an array'); else value.eventHistory.forEach((event, index) => validateEventRecord(event, `${path}.eventHistory[${index}]`, issues)); }
  if (hasOwn(value, 'currentTime')) validateCurrentTime(value.currentTime, `${path}.currentTime`, issues); if (hasOwn(value, 'identity')) validateIdentity(value.identity, `${path}.identity`, issues); if (hasOwn(value, 'lifePath')) validateLifePath(value.lifePath, `${path}.lifePath`, issues); if (hasOwn(value, 'karma')) validateKarma(value.karma, `${path}.karma`, issues); if (hasOwn(value, 'criticalChoices')) validateCriticalChoices(value.criticalChoices, `${path}.criticalChoices`, issues);
  if (hasOwn(value, 'achievements')) validateStringArray(value.achievements, `${path}.achievements`, issues); if (hasOwn(value, 'inventory')) validateInventory(value.inventory, `${path}.inventory`, issues); if (hasOwn(value, 'ending')) jsonValue(value.ending, `${path}.ending`, issues); if (hasOwn(value, 'triggeredEvents')) validateStringArray(value.triggeredEvents, `${path}.triggeredEvents`, issues); if (hasOwn(value, 'events')) { if (!Array.isArray(value.events)) addIssue(issues, `${path}.events`, 'invalid_type', 'must be an array'); else value.events.forEach((event, index) => validateEventRecord(event, `${path}.events[${index}]`, issues)); }
  if (hasOwn(value, 'statistics')) validateStatistics(value.statistics, `${path}.statistics`, issues);
  for (const key of ['lastSavedAt', 'gameTimestamp', 'selfAwareness'] as const) if (hasOwn(value, key)) finite(value[key], `${path}.${key}`, issues); if (hasOwn(value, 'saveVersion')) stringValue(value.saveVersion, `${path}.saveVersion`, issues); if (hasOwn(value, 'pendingStoryEventId')) stringValue(value.pendingStoryEventId, `${path}.pendingStoryEventId`, issues); if (hasOwn(value, 'playerFeedbackMessage')) stringValue(value.playerFeedbackMessage, `${path}.playerFeedbackMessage`, issues); if (hasOwn(value, 'p16RareLineLog')) validateStringArray(value.p16RareLineLog, `${path}.p16RareLineLog`, issues);
  if (hasOwn(value, 'actionHistory')) validateActionHistory(value.actionHistory, `${path}.actionHistory`, issues); if (hasOwn(value, 'actionFocusStreak')) validateActionFocusStreak(value.actionFocusStreak, `${path}.actionFocusStreak`, issues); if (hasOwn(value, 'p16TendencyShaping')) validateTendency(value.p16TendencyShaping, `${path}.p16TendencyShaping`, issues);
  if (snapshotShape) for (const key of ROUTE_LIFECYCLE_KEYS) if (hasOwn(value, key)) addIssue(issues, `${path}.${key}`, 'forbidden', 'retired route lifecycle field is not persisted');
}

function validateSnapshot(value: unknown, issues: CanonicalValidationIssue[]): void {
  if (!objectAt(value, 'snapshot', issues)) return; exactKeys(value, 'snapshot', new Set(['metadata', 'state']), issues); required(value, 'snapshot', ['metadata', 'state'], issues); if (!objectAt(value.metadata, 'snapshot.metadata', issues)) return; exactKeys(value.metadata, 'snapshot.metadata', SNAPSHOT_METADATA_KEYS, issues); required(value.metadata, 'snapshot.metadata', ['schemaVersion', 'engineVersion', 'eventCatalogVersion', 'createdAt', 'updatedAt', 'sourcePlatform'], issues); if (value.metadata.schemaVersion !== GAME_STATE_SNAPSHOT_SCHEMA_VERSION) addIssue(issues, 'snapshot.metadata.schemaVersion', 'invalid_value', `must be ${GAME_STATE_SNAPSHOT_SCHEMA_VERSION}`); stringValue(value.metadata.engineVersion, 'snapshot.metadata.engineVersion', issues, true); stringValue(value.metadata.eventCatalogVersion, 'snapshot.metadata.eventCatalogVersion', issues, true); finite(value.metadata.createdAt, 'snapshot.metadata.createdAt', issues); finite(value.metadata.updatedAt, 'snapshot.metadata.updatedAt', issues); if (!SOURCE_PLATFORMS.includes(value.metadata.sourcePlatform as SourcePlatform)) addIssue(issues, 'snapshot.metadata.sourcePlatform', 'invalid_value', 'unknown source platform'); for (const key of ['snapshotId', 'lifeMemorySchemaVersion', 'contentHash'] as const) if (hasOwn(value.metadata, key)) stringValue(value.metadata[key], `snapshot.metadata.${key}`, issues);
  validateState(value.state, 'snapshot.state', issues, false, true);
}

export function validateCanonicalSnapshot(value: unknown): CanonicalValidationIssue[] { const issues: CanonicalValidationIssue[] = []; validateJsonContainer(value, 'snapshot', issues); if (issues.length === 0) validateSnapshot(value, issues); return issues; }
export function assertCanonicalSnapshot(value: unknown): asserts value is GameStateSnapshot { const issues = validateCanonicalSnapshot(value); if (issues.length > 0) throw new CanonicalValidationError(issues); }
export function validateCanonicalGameState(value: unknown): CanonicalValidationIssue[] { const issues: CanonicalValidationIssue[] = []; validateJsonContainer(value, 'state', issues); if (issues.length === 0) validateState(value, 'state', issues, false, false); return issues; }
export function assertCanonicalGameState(value: unknown): asserts value is GameState { const issues = validateCanonicalGameState(value); if (issues.length > 0) throw new CanonicalValidationError(issues); }
export function cloneCanonicalGameState(value: GameState): GameState {
  assertCanonicalGameState(value);
  return cloneCanonicalJsonValue(value);
}

export function assertCanonicalSaveData(value: unknown): asserts value is {
  id: string;
  name: string;
  timestamp: number;
  snapshot: GameStateSnapshot;
  metadata: { playerAge: number; playerName: string; eventCount: number; playTime: number };
} {
  const issues: CanonicalValidationIssue[] = [];
  validateJsonContainer(value, 'save', issues);
  if (issues.length > 0) throw new CanonicalValidationError(issues);
  if (!objectAt(value, 'save', issues)) throw new CanonicalValidationError(issues);
  exactKeys(value, 'save', new Set(['id', 'name', 'timestamp', 'snapshot', 'metadata']), issues);
  required(value, 'save', ['id', 'name', 'timestamp', 'snapshot', 'metadata'], issues);
  stringValue(value.id, 'save.id', issues, true); stringValue(value.name, 'save.name', issues, true); finite(value.timestamp, 'save.timestamp', issues);
  validateSnapshot(value.snapshot, issues);
  if (objectAt(value.metadata, 'save.metadata', issues)) {
    exactKeys(value.metadata, 'save.metadata', new Set(['playerAge', 'playerName', 'eventCount', 'playTime']), issues);
    required(value.metadata, 'save.metadata', ['playerAge', 'playerName', 'eventCount', 'playTime'], issues);
    finite(value.metadata.playerAge, 'save.metadata.playerAge', issues); stringValue(value.metadata.playerName, 'save.metadata.playerName', issues, true); finite(value.metadata.eventCount, 'save.metadata.eventCount', issues); finite(value.metadata.playTime, 'save.metadata.playTime', issues);
  }
  if (issues.length > 0) throw new CanonicalValidationError(issues);
}

export function assertCanonicalSaveExport(value: unknown): asserts value is {
  version: typeof GAME_STATE_SNAPSHOT_SCHEMA_VERSION;
  exportTime: number;
  save: unknown;
} {
  const issues: CanonicalValidationIssue[] = [];
  validateJsonContainer(value, 'export', issues);
  if (issues.length > 0) throw new CanonicalValidationError(issues);
  if (!objectAt(value, 'export', issues)) throw new CanonicalValidationError(issues);
  exactKeys(value, 'export', new Set(['version', 'exportTime', 'save']), issues); required(value, 'export', ['version', 'exportTime', 'save'], issues);
  if (value.version !== GAME_STATE_SNAPSHOT_SCHEMA_VERSION) addIssue(issues, 'export.version', 'invalid_value', `must be ${GAME_STATE_SNAPSHOT_SCHEMA_VERSION}`); finite(value.exportTime, 'export.exportTime', issues); assertCanonicalSaveData(value.save);
  if (issues.length > 0) throw new CanonicalValidationError(issues);
}
