import { EventPriority, EventCategory, type EventDefinition } from '../../src/types/eventTypes';
import { createWeightOverlayRuntimeCatalog } from '../../src/core/WeightOverlayRuntimeCatalog';
import { captureCatalogSnapshot } from '../../scripts/b1/catalogSnapshot';
import { createWeightOverlayFromIntents, type WeightOverlay, type WeightPatchIntent } from '../../scripts/b1/types';
import { validateWeightOverlay } from '../../scripts/b1/scopeValidator';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertBlocked(
  catalog: ReturnType<typeof createCatalog>,
  overlay: unknown,
  code: string,
  message: string,
): void {
  const result = validateWeightOverlay(catalog, overlay);
  assert(result.status === 'blocked', `${message}: expected blocked, got ${result.status}`);
  assert(result.code === code, `${message}: expected ${code}, got ${result.code}`);
}

function createEvent(
  id: string,
  weight = 10,
  options: Partial<EventDefinition> = {},
): EventDefinition {
  return {
    id,
    version: '1.0.0',
    category: EventCategory.SIDE_QUEST,
    priority: EventPriority.NORMAL,
    weight,
    ageRange: { min: 18, max: 18 },
    triggers: [],
    maxTriggers: 1,
    eventType: 'auto',
    content: { title: id, text: id },
    metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: [] },
    ...options,
  };
}

function createCatalog(events: EventDefinition[] = [createEvent('regular', 10)]): {
  getAllEvents(): readonly EventDefinition[];
  getEventsByAge(age: number): readonly EventDefinition[];
  getEventById(id: string): EventDefinition | undefined;
  getWeightForAge(event: EventDefinition, age: number): number;
} {
  return {
    getAllEvents: () => events,
    getEventsByAge: age => age === 18 ? events : [],
    getEventById: id => events.find(event => event.id === id),
    getWeightForAge: event => event.weight,
  };
}

function overlayFor(
  catalog: ReturnType<typeof createCatalog>,
  patches: WeightOverlay['patches'],
): WeightOverlay {
  return {
    schemaVersion: 'b1-weight-overlay-v1',
    baseCatalogHash: captureCatalogSnapshot(catalog).baseCatalogHash,
    patches,
  };
}

function validPatch(eventId = 'regular'): WeightOverlay['patches'][number] {
  return { eventId, baselineWeight: 10, candidateWeight: 11 };
}

export function runWeightOverlayScopeTests(): void {
  const catalog = createCatalog();
  const validOverlay = overlayFor(catalog, [validPatch()]);
  const valid = validateWeightOverlay(catalog, validOverlay);
  assert(valid.status === 'valid', 'valid patch is accepted');

  assertBlocked(catalog, overlayFor(catalog, [validPatch('missing')]), 'UNKNOWN_EVENT_ID', 'unknown event ID');
  assertBlocked(catalog, overlayFor(catalog, [validPatch(), validPatch()]), 'DUPLICATE_EVENT_ID', 'duplicate event ID');
  assertBlocked(
    catalog,
    overlayFor(catalog, Array.from({ length: 9 }, (_, index) => validPatch(`extra-${index}`))),
    'PATCH_LIMIT_EXCEEDED',
    'nine patches',
  );
  assertBlocked(catalog, overlayFor(catalog, [{ ...validPatch(), candidateWeight: 7.9 }]), 'CANDIDATE_RATIO_OUT_OF_RANGE', '0.79 multiplier');
  assertBlocked(catalog, overlayFor(catalog, [{ ...validPatch(), candidateWeight: 12.1 }]), 'CANDIDATE_RATIO_OUT_OF_RANGE', '1.21 multiplier');
  assertBlocked(catalog, overlayFor(catalog, [{ ...validPatch(), candidateWeight: 0.6 }]), 'CANDIDATE_WEIGHT_BELOW_MINIMUM', 'candidate below one');
  assertBlocked(catalog, overlayFor(catalog, [{ ...validPatch(), baselineWeight: 9 }]), 'BASELINE_WEIGHT_MISMATCH', 'baseline mismatch');
  assertBlocked(catalog, { ...validOverlay, baseCatalogHash: 'wrong-base-hash' }, 'BASE_CATALOG_HASH_MISMATCH', 'base catalog hash mismatch');

  for (const [name, event] of [
    ['critical', createEvent('critical', 10, { priority: EventPriority.CRITICAL })],
    ['mandatory', createEvent('mandatory', 10, { metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: ['mandatory'] } })],
    ['mainline', createEvent('mainline', 10, { metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: ['mainline'] } })],
  ] as const) {
    const protectedCatalog = createCatalog([event]);
    assertBlocked(protectedCatalog, overlayFor(protectedCatalog, [validPatch(event.id)]), 'PROTECTED_EVENT', `${name} event`);
  }

  assertBlocked(
    catalog,
    { ...validOverlay, patches: [{ ...validPatch(), content: { text: 'tampered' } }] },
    'PATCH_FIELD_NOT_ALLOWED',
    'non-weight patch field',
  );
  assertBlocked(catalog, { ...validOverlay, events: [createEvent('new')] }, 'OVERLAY_FIELD_NOT_ALLOWED', 'new event object');
  assertBlocked(catalog, { ...validOverlay, eventOrder: ['regular'] }, 'OVERLAY_FIELD_NOT_ALLOWED', 'event reordering');

  const badIntent = (intent: Partial<WeightPatchIntent>, code: string, message: string): void => {
    const result = createWeightOverlayFromIntents(catalog, [{
      eventId: 'regular',
      direction: 'increase',
      deltaRatio: 0.1,
      rationale: 'reduce repetition',
      expectedMetricEffects: ['lower concentration'],
      ...intent,
    } as WeightPatchIntent]);
    assert(result.status === 'blocked', `${message}: expected blocked`);
    assert(result.code === code, `${message}: expected ${code}, got ${result.code}`);
  };

  badIntent({ direction: 'sideways' as WeightPatchIntent['direction'] }, 'INVALID_INTENT_DIRECTION', 'illegal intent direction');
  badIntent({ deltaRatio: Number.POSITIVE_INFINITY }, 'INVALID_INTENT_DELTA', 'non-finite intent delta');
  badIntent({ deltaRatio: 0 }, 'INVALID_INTENT_DELTA', 'zero intent delta');
  badIntent({ rationale: '   ' }, 'EMPTY_INTENT_RATIONALE', 'empty rationale');
  badIntent({ expectedMetricEffects: [] }, 'MISSING_EXPECTED_METRICS', 'missing expected metrics');

  const runtimeCatalog = createWeightOverlayRuntimeCatalog(catalog, validOverlay);
  assert(runtimeCatalog.getEventById('regular')?.weight === 11, 'candidate catalog changes only the target weight');
  assert(catalog.getEventById('regular')?.weight === 10, 'base catalog remains unchanged');
  assert(runtimeCatalog.getAllEvents() !== runtimeCatalog.getAllEvents(), 'reads return array copies');
  assert(Object.isFrozen(runtimeCatalog.getEventById('regular')), 'candidate event is frozen');

  const ageWeightedEvent = createEvent('age-weighted', 10, {
    ageWeights: [{ min: 18, max: 18, weight: 40 }],
  });
  const ageWeightedBase = createCatalog([ageWeightedEvent]);
  const ageWeightedOverlay = overlayFor(ageWeightedBase, [validPatch('age-weighted')]);
  const ageWeightedCandidate = createWeightOverlayRuntimeCatalog(ageWeightedBase, ageWeightedOverlay);
  const candidateAgeWeightedEvent = ageWeightedCandidate.getEventById('age-weighted');
  assert(candidateAgeWeightedEvent?.weight === 11, 'age-weighted candidate changes top-level weight');
  assert(candidateAgeWeightedEvent?.ageWeights?.[0].weight === 40, 'ageWeights fields stay unchanged');
  assert(ageWeightedCandidate.getWeightForAge(candidateAgeWeightedEvent!, 18) === 44, 'age-weighted candidate applies the patch ratio during scheduling');
  assert(ageWeightedEvent.weight === 10 && ageWeightedEvent.ageWeights?.[0].weight === 40, 'base event fields remain unchanged');
  const { weight: ignoredBaseWeight, ...baseFields } = ageWeightedEvent;
  const { weight: ignoredCandidateWeight, ...candidateFields } = candidateAgeWeightedEvent!;
  void ignoredBaseWeight;
  void ignoredCandidateWeight;
  assert(JSON.stringify(candidateFields) === JSON.stringify(baseFields), 'candidate catalog differs from base only at top-level weight');

  const mutableBaseEvents = [createEvent('mutable', 10)];
  const mutableBase = createCatalog(mutableBaseEvents);
  const mutableOverlay = overlayFor(mutableBase, [validPatch('mutable')]);
  const detachedCatalog = createWeightOverlayRuntimeCatalog(mutableBase, mutableOverlay);
  mutableBaseEvents[0].weight = 99;
  mutableOverlay.patches[0].candidateWeight = 2;
  assert(detachedCatalog.getEventById('mutable')?.weight === 11, 'later base and overlay mutations cannot alter the candidate snapshot');

  const snapshotOne = captureCatalogSnapshot(catalog);
  const snapshotTwo = captureCatalogSnapshot(createCatalog([createEvent('regular', 10)]));
  assert(snapshotOne.baseCatalogHash === snapshotTwo.baseCatalogHash, 'base catalog hash is reproducible');
  assert(valid.status === 'valid' && valid.overlayHash === validateWeightOverlay(catalog, validOverlay).overlayHash, 'overlay hash is reproducible');

  const twoEventCatalog = createCatalog([createEvent('first', 10), createEvent('second', 10)]);
  const forward = validateWeightOverlay(twoEventCatalog, overlayFor(twoEventCatalog, [validPatch('first'), validPatch('second')]));
  const reverse = validateWeightOverlay(twoEventCatalog, overlayFor(twoEventCatalog, [validPatch('second'), validPatch('first')]));
  assert(forward.status === 'valid' && reverse.status === 'valid' && forward.overlayHash === reverse.overlayHash, 'overlay hash ignores input patch ordering');

  const orderedBase = createCatalog([createEvent('z-last', 10), createEvent('a-first', 10)]);
  const orderedCandidate = createWeightOverlayRuntimeCatalog(
    orderedBase,
    overlayFor(orderedBase, [{ eventId: 'a-first', baselineWeight: 10, candidateWeight: 11 }]),
  );
  assert(
    orderedCandidate.getAllEvents().map(event => event.id).join(',') === 'z-last,a-first',
    'candidate runtime catalog must preserve baseline event order',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWeightOverlayScopeTests();
  console.log('weightOverlayScope.test.ts: ok');
}
