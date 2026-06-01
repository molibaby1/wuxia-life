/**
 * P4: Event catalog contract tests.
 */

import { assert, assertDeepEqual } from '../GameTestFramework';
import {
  eventCatalogBundleFixture,
  eventCatalogSummaryFixture,
  serializeEventCatalogFixtures,
} from '../../src/contracts/fixtures/eventCatalogFixtures';
import {
  validateEventCatalogBundle,
  validateEventCatalogSummary,
} from '../../src/contracts/validation/contractValidation';

console.log('=== P4: Event Catalog Contract Tests ===\n');

{
  const { bundle, summary } = serializeEventCatalogFixtures();
  const parsedBundle = JSON.parse(bundle);
  const parsedSummary = JSON.parse(summary);

  assertDeepEqual(parsedBundle, eventCatalogBundleFixture, 'catalog bundle fixture round-trips');
  assertDeepEqual(parsedSummary, eventCatalogSummaryFixture, 'catalog summary fixture round-trips');
  console.log('✓ catalog fixtures JSON round trip');
}

{
  const bundleResult = validateEventCatalogBundle(eventCatalogBundleFixture);
  assert(bundleResult.ok, `valid bundle passes: ${!bundleResult.ok ? bundleResult.errors.join(', ') : ''}`);

  const summaryResult = validateEventCatalogSummary(eventCatalogSummaryFixture);
  assert(
    summaryResult.ok,
    `valid summary passes: ${!summaryResult.ok ? summaryResult.errors.join(', ') : ''}`,
  );
  console.log('✓ catalog validator accepts valid fixtures');
}

{
  const badBundle = {
    ...eventCatalogBundleFixture,
    metadata: {
      ...eventCatalogBundleFixture.metadata,
      activeCount: undefined,
    },
    events: [
      {
        ...eventCatalogBundleFixture.events[0],
        validationState: '',
      },
    ],
  };
  const badBundleResult = validateEventCatalogBundle(badBundle);
  assert(!badBundleResult.ok, 'invalid bundle rejected');
  assert(
    badBundleResult.errors.some((e) => e.includes('metadata.activeCount required')),
    'invalid metadata detected',
  );
  assert(
    badBundleResult.errors.some((e) => e.includes('events[0].validationState required')),
    'invalid event entry detected',
  );

  const badSummary = {
    ...eventCatalogSummaryFixture,
    counts: null,
    diagnosticOnlyFields: 'not-array',
  };
  const badSummaryResult = validateEventCatalogSummary(badSummary);
  assert(!badSummaryResult.ok, 'invalid summary rejected');
  assert(badSummaryResult.errors.some((e) => e.includes('counts required')), 'invalid counts detected');
  assert(
    badSummaryResult.errors.some((e) => e.includes('diagnosticOnlyFields must be an array')),
    'invalid diagnosticOnlyFields detected',
  );
  console.log('✓ catalog validator rejects invalid payloads');
}

console.log('\n✅ All event catalog contract tests passed');
