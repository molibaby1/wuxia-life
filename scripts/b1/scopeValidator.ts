import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog';
import { EventPriority, type EventDefinition } from '../../src/types/eventTypes';
import { captureCatalogSnapshot, deepClone } from './catalogSnapshot';
import { stableJsonHash } from './hash';
import type { WeightOverlay } from './types';

export type WeightOverlayValidation =
  | { status: 'valid'; baseCatalogHash: string; overlayHash: string; candidateCatalogHash: string; differenceHash: string }
  | { status: 'blocked'; code: string; eventId?: string; path?: string };

const overlayKeys = ['baseCatalogHash', 'patches', 'schemaVersion'];
const patchKeys = ['baselineWeight', 'candidateWeight', 'eventId'];

function blocked(code: string, eventId?: string, path?: string): WeightOverlayValidation {
  return { status: 'blocked', code, eventId, path };
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function protectedEvent(event: EventDefinition): boolean {
  const tags = (event.metadata?.tags ?? []).map(tag => tag.toLowerCase());
  return event.priority === EventPriority.CRITICAL ||
    tags.includes('critical') || tags.includes('mandatory') || tags.includes('mainline');
}

function applyPatches(events: readonly EventDefinition[], patches: WeightOverlay['patches']): EventDefinition[] {
  const weights = new Map(patches.map(patch => [patch.eventId, patch.candidateWeight]));
  return events.map(event => {
    const candidateWeight = weights.get(event.id);
    return candidateWeight === undefined ? deepClone(event) : { ...deepClone(event), weight: candidateWeight };
  });
}

function changedPaths(base: unknown, candidate: unknown, path = ''): string[] {
  if (Object.is(base, candidate)) return [];
  if (!base || !candidate || typeof base !== 'object' || typeof candidate !== 'object') return [path || '$'];
  if (Array.isArray(base) || Array.isArray(candidate)) {
    if (!Array.isArray(base) || !Array.isArray(candidate) || base.length !== candidate.length) return [path || '$'];
    return base.flatMap((value, index) => changedPaths(value, candidate[index], `${path}[${index}]`));
  }
  const baseRecord = base as Record<string, unknown>;
  const candidateRecord = candidate as Record<string, unknown>;
  const keys = new Set([...Object.keys(baseRecord), ...Object.keys(candidateRecord)]);
  return [...keys].sort().flatMap(key => changedPaths(baseRecord[key], candidateRecord[key], path ? `${path}.${key}` : key));
}

/** Validates every B1 white-list invariant without mutating or repairing the supplied overlay. */
export function validateWeightOverlay(catalog: RuntimeEventCatalog, overlay: unknown): WeightOverlayValidation {
  if (!overlay || typeof overlay !== 'object' || Array.isArray(overlay)) return blocked('INVALID_OVERLAY');
  const rawOverlay = overlay as Record<string, unknown>;
  if (!exactKeys(rawOverlay, overlayKeys)) return blocked('OVERLAY_FIELD_NOT_ALLOWED');
  if (rawOverlay.schemaVersion !== 'b1-weight-overlay-v1') return blocked('INVALID_OVERLAY_SCHEMA');
  if (!Array.isArray(rawOverlay.patches)) return blocked('INVALID_PATCHES');
  if (rawOverlay.patches.length > 8) return blocked('PATCH_LIMIT_EXCEEDED');

  const snapshot = captureCatalogSnapshot(catalog);
  if (rawOverlay.baseCatalogHash !== snapshot.baseCatalogHash) return blocked('BASE_CATALOG_HASH_MISMATCH');
  const patches: WeightOverlay['patches'] = [];
  const eventIds = new Set<string>();

  for (let index = 0; index < rawOverlay.patches.length; index += 1) {
    const rawPatch = rawOverlay.patches[index];
    if (!rawPatch || typeof rawPatch !== 'object' || Array.isArray(rawPatch)) return blocked('INVALID_PATCH', undefined, `patches[${index}]`);
    if (!exactKeys(rawPatch as Record<string, unknown>, patchKeys)) return blocked('PATCH_FIELD_NOT_ALLOWED', undefined, `patches[${index}]`);
    const patch = rawPatch as WeightOverlay['patches'][number];
    if (typeof patch.eventId !== 'string' || patch.eventId.length === 0) return blocked('INVALID_EVENT_ID', undefined, `patches[${index}].eventId`);
    if (eventIds.has(patch.eventId)) return blocked('DUPLICATE_EVENT_ID', patch.eventId);
    eventIds.add(patch.eventId);
    const event = snapshot.events.find(item => item.id === patch.eventId);
    if (!event) return blocked('UNKNOWN_EVENT_ID', patch.eventId);
    if (!Number.isFinite(patch.baselineWeight) || patch.baselineWeight !== event.weight) return blocked('BASELINE_WEIGHT_MISMATCH', patch.eventId, 'weight');
    if (!Number.isFinite(patch.candidateWeight)) return blocked('NON_FINITE_CANDIDATE_WEIGHT', patch.eventId, 'weight');
    if (patch.candidateWeight < 1) return blocked('CANDIDATE_WEIGHT_BELOW_MINIMUM', patch.eventId, 'weight');
    const ratio = patch.candidateWeight / patch.baselineWeight;
    if (!Number.isFinite(ratio) || ratio < 0.8 || ratio > 1.2) return blocked('CANDIDATE_RATIO_OUT_OF_RANGE', patch.eventId, 'weight');
    if (protectedEvent(event)) return blocked('PROTECTED_EVENT', patch.eventId);
    patches.push({ ...patch });
  }

  const candidateEvents = applyPatches(snapshot.events, patches);
  const diffs = changedPaths(snapshot.events, candidateEvents);
  const expectedDiffs = new Set(patches.map(patch => `${snapshot.events.findIndex(event => event.id === patch.eventId)}.weight`));
  const invalidDiff = diffs.find(path => !expectedDiffs.has(path.replace(/^\[(\d+)\]/, '$1')));
  if (invalidDiff) return blocked('NON_WEIGHT_CATALOG_DIFFERENCE', undefined, invalidDiff);

  const normalizedOverlay: WeightOverlay = {
    schemaVersion: 'b1-weight-overlay-v1',
    baseCatalogHash: snapshot.baseCatalogHash,
    patches: patches.sort((left, right) => left.eventId.localeCompare(right.eventId)),
  };
  return {
    status: 'valid',
    baseCatalogHash: snapshot.baseCatalogHash,
    overlayHash: stableJsonHash(normalizedOverlay),
    candidateCatalogHash: stableJsonHash(candidateEvents),
    differenceHash: stableJsonHash(diffs),
  };
}
