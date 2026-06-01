/**
 * P4 US-024: Save schema policy contract smoke test.
 */

import { assert } from '../GameTestFramework';
import {
  GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
  gameStateSnapshotAge50,
} from '../../src/contracts';

const SUPPORTED_SAVE_VERSION = '2.0.0-p2';

console.log('=== P4 Save Schema Contract Smoke Test ===\n');

{
  assert(
    gameStateSnapshotAge50.metadata.schemaVersion === GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
    'snapshot schemaVersion matches contract constant',
  );
  assert(
    gameStateSnapshotAge50.state.saveVersion === SUPPORTED_SAVE_VERSION,
    'fixture saveVersion matches P2 client tag',
  );
  assert(
    typeof gameStateSnapshotAge50.metadata.eventCatalogVersion === 'string',
    'eventCatalogVersion pinned on snapshot metadata',
  );
  console.log('✓ save schema versioning fields present on snapshot fixture');
}

console.log('\n✅ Save schema contract smoke test passed');
