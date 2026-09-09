import assert from 'node:assert/strict';
import {
  WORKSPACE_STATE_FINGERPRINT_METHOD,
  WORKSPACE_STATE_PROVENANCE_SCHEMA_VERSION,
  compareWorkspaceStateContinuity,
  parseWorkspaceStateProvenance,
  projectWorkspaceStateProvenance,
  workspaceStateConsistencyWarnings,
  type WorkspaceStateProvenanceV1,
} from '../../scripts/evolution/workspaceStateProvenance';

const available = (fingerprintSha256: string) => ({
  status: 'available' as const,
  fingerprintSha256,
});

function provenance(overrides: Partial<WorkspaceStateProvenanceV1> = {}): WorkspaceStateProvenanceV1 {
  return {
    schemaVersion: WORKSPACE_STATE_PROVENANCE_SCHEMA_VERSION,
    fingerprintMethod: WORKSPACE_STATE_FINGERPRINT_METHOD,
    workspaceRootRef: 'evolution-workspace/evolution',
    start: available('a'.repeat(64)),
    executionBoundary: {
      before: available('a'.repeat(64)),
      after: available('b'.repeat(64)),
    },
    end: available('b'.repeat(64)),
    consistencyWarnings: [],
    ...overrides,
  };
}

export function runWorkspaceStateProvenanceTests(): void {
  const parsed = parseWorkspaceStateProvenance(JSON.parse(JSON.stringify(provenance())));
  assert.deepEqual(parsed, provenance());

  const projection = projectWorkspaceStateProvenance(parsed);
  assert.equal(projection.predecessorRef, null);
  assert.equal(projection.continuity, 'UNKNOWN');

  assert.equal(
    compareWorkspaceStateContinuity(
      available('a'.repeat(64)),
      available('a'.repeat(64)),
      WORKSPACE_STATE_FINGERPRINT_METHOD,
      WORKSPACE_STATE_FINGERPRINT_METHOD,
    ),
    'MATCH',
  );
  assert.equal(
    compareWorkspaceStateContinuity(
      available('a'.repeat(64)),
      available('b'.repeat(64)),
      WORKSPACE_STATE_FINGERPRINT_METHOD,
      WORKSPACE_STATE_FINGERPRINT_METHOD,
    ),
    'MISMATCH',
  );
  assert.equal(
    compareWorkspaceStateContinuity(
      null,
      available('a'.repeat(64)),
      WORKSPACE_STATE_FINGERPRINT_METHOD,
      WORKSPACE_STATE_FINGERPRINT_METHOD,
    ),
    'UNKNOWN',
  );

  assert.deepEqual(
    workspaceStateConsistencyWarnings({
      before: available('a'.repeat(64)),
      after: available('a'.repeat(64)),
      actualChangedFiles: ['src/data/lines/family-life.json'],
    }),
    ['ACTUAL_CHANGED_FILES_WITH_UNCHANGED_FINGERPRINT'],
  );
  assert.deepEqual(
    workspaceStateConsistencyWarnings({
      before: available('a'.repeat(64)),
      after: available('b'.repeat(64)),
      actualChangedFiles: [],
    }),
    ['FINGERPRINT_CHANGED_WITHOUT_ACTUAL_CHANGED_FILES'],
  );

  assert.throws(
    () => parseWorkspaceStateProvenance({ ...provenance(), start: { status: 'available', fingerprintSha256: 'not-a-hash' } }),
    /invalid workspace state provenance/,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runWorkspaceStateProvenanceTests();
    console.log('workspaceStateProvenance.test.ts: ok');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
