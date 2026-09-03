/**
 * PD-110 — Active Formal Random Trigger Retirement
 *
 * Invariant: runtime-loaded active catalog has no unsupported random trigger.
 * Deferred / unwired repository source may still contain random metadata.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { eventLoader } from '../src/core/EventLoader';

const AFFECTED_EVENTS: ReadonlyArray<{
  id: string;
  weight: number;
  priority: number;
  ageRange: { min: number; max: number };
  remainingTriggers: Array<{ type: string; value: number }>;
}> = [
  {
    id: 'commoner_year_farming',
    weight: 60,
    priority: 30,
    ageRange: { min: 18, max: 65 },
    remainingTriggers: [{ type: 'age_reach', value: 18 }],
  },
  {
    id: 'commoner_year_apprentice',
    weight: 50,
    priority: 35,
    ageRange: { min: 15, max: 25 },
    remainingTriggers: [{ type: 'age_reach', value: 15 }],
  },
  {
    id: 'commoner_year_neighbor',
    weight: 55,
    priority: 25,
    ageRange: { min: 20, max: 60 },
    remainingTriggers: [{ type: 'age_reach', value: 20 }],
  },
  {
    id: 'merchant_year_trade',
    weight: 70,
    priority: 50,
    ageRange: { min: 20, max: 60 },
    remainingTriggers: [{ type: 'age_reach', value: 20 }],
  },
  {
    id: 'merchant_year_crisis',
    weight: 50,
    priority: 45,
    ageRange: { min: 25, max: 55 },
    remainingTriggers: [{ type: 'age_reach', value: 25 }],
  },
  {
    id: 'merchant_year_network',
    weight: 60,
    priority: 40,
    ageRange: { min: 22, max: 50 },
    remainingTriggers: [{ type: 'age_reach', value: 22 }],
  },
  {
    id: 'jianghu_year_patrol',
    weight: 70,
    priority: 55,
    ageRange: { min: 20, max: 55 },
    remainingTriggers: [{ type: 'age_reach', value: 20 }],
  },
  {
    id: 'jianghu_year_training',
    weight: 75,
    priority: 60,
    ageRange: { min: 18, max: 50 },
    remainingTriggers: [{ type: 'age_reach', value: 18 }],
  },
  {
    id: 'jianghu_year_disciple',
    weight: 55,
    priority: 45,
    ageRange: { min: 30, max: 60 },
    remainingTriggers: [{ type: 'age_reach', value: 30 }],
  },
  {
    id: 'scholar_year_study',
    weight: 70,
    priority: 55,
    ageRange: { min: 15, max: 50 },
    remainingTriggers: [{ type: 'age_reach', value: 15 }],
  },
  {
    id: 'scholar_year_social',
    weight: 60,
    priority: 45,
    ageRange: { min: 20, max: 55 },
    remainingTriggers: [{ type: 'age_reach', value: 20 }],
  },
  {
    id: 'scholar_year_write',
    weight: 55,
    priority: 50,
    ageRange: { min: 25, max: 60 },
    remainingTriggers: [{ type: 'age_reach', value: 25 }],
  },
  {
    id: 'relationship_life_saving',
    weight: 55,
    priority: 76,
    ageRange: { min: 20, max: 50 },
    remainingTriggers: [{ type: 'age_reach', value: 20 }],
  },
  {
    id: 'relationship_debt_return',
    weight: 50,
    priority: 74,
    ageRange: { min: 25, max: 55 },
    remainingTriggers: [{ type: 'age_reach', value: 25 }],
  },
  {
    id: 'refugee_sect_story',
    weight: 40,
    priority: 50,
    ageRange: { min: 16, max: 35 },
    remainingTriggers: [{ type: 'age_reach', value: 16 }],
  },
  {
    id: 'merchant_shop_failure',
    weight: 40,
    priority: 94,
    ageRange: { min: 17, max: 24 },
    remainingTriggers: [{ type: 'age_reach', value: 17 }],
  },
];

function testActiveCatalogHasNoRandomTriggers(): void {
  const events = eventLoader.getAllEvents();
  assert.ok(events.length > 0, 'active catalog must load successfully');

  const offenders = events.filter(event =>
    (event.triggers ?? []).some(trigger => trigger.type === 'random'),
  );
  assert.deepEqual(
    offenders.map(event => event.id),
    [],
    'runtime-loaded active catalog must contain no triggers.random',
  );
}

function testAffectedEventsPreserveSupportedSchedulingMetadata(): void {
  assert.equal(AFFECTED_EVENTS.length, 16);

  for (const expected of AFFECTED_EVENTS) {
    const event = eventLoader.getEventById(expected.id);
    assert.ok(event, `${expected.id} must remain present in active catalog`);
    assert.equal(event.weight, expected.weight, `${expected.id} weight must remain unchanged`);
    assert.equal(event.priority, expected.priority, `${expected.id} priority must remain unchanged`);
    assert.deepEqual(event.ageRange, expected.ageRange, `${expected.id} ageRange must remain unchanged`);
    assert.deepEqual(
      event.triggers,
      expected.remainingTriggers,
      `${expected.id} must keep non-random triggers only`,
    );
    assert.equal(
      (event.triggers ?? []).some(trigger => trigger.type === 'random'),
      false,
      `${expected.id} must not retain random trigger`,
    );
  }
}

function testDeferredRandomMayStillExistOutsideActiveCatalog(): void {
  const deferredPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '../src/data/lines/relationship-person-legacy-deferred.json',
  );
  const deferred = readFileSync(deferredPath, 'utf8');
  assert.match(
    deferred,
    /"type"\s*:\s*"random"/,
    'deferred source may still contain random metadata (not a failure)',
  );
  assert.equal(
    eventLoader.getEventById('relationship_sworn_help'),
    undefined,
    'deferred relationship_sworn_help must remain outside active catalog',
  );
}

testActiveCatalogHasNoRandomTriggers();
testAffectedEventsPreserveSupportedSchedulingMetadata();
testDeferredRandomMayStillExistOutsideActiveCatalog();
console.log('activeFormalRandomTriggerRetirement.test.ts: ok');
