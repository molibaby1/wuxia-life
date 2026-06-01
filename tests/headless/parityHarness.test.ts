import { buildParityFingerprint, compareParityFields } from '../../src/headless/parity/parityModel';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const baseDigest = {
  routeStateJson: '{}',
  lifeMemoryJson: '{}',
  eventHistoryDigest: '[]',
};

export function runParityHarnessTests(): void {
  const snapshotReport = compareParityFields(
    'harness-snapshot',
    { ...baseDigest, snapshotHash: 'ref-hash', feedbackDigest: 'same' },
    { ...baseDigest, snapshotHash: 'headless-hash', feedbackDigest: 'same' },
  );
  assert(!snapshotReport.passed, 'should detect snapshot hash mismatch');
  assert(
    snapshotReport.mismatches.some(m => m.category === 'snapshot_hash'),
    'should include snapshot_hash mismatch',
  );

  const feedbackReport = compareParityFields(
    'harness-feedback',
    { ...baseDigest, snapshotHash: 'same', feedbackDigest: 'feedback-a' },
    { ...baseDigest, snapshotHash: 'same', feedbackDigest: 'feedback-b' },
  );
  assert(!feedbackReport.passed, 'should detect feedback digest mismatch');
  assert(
    feedbackReport.mismatches.some(m => m.category === 'feedback'),
    'should include feedback mismatch',
  );

  const passReport = compareParityFields(
    'harness-pass',
    { ...baseDigest, snapshotHash: 'same', feedbackDigest: 'same' },
    { ...baseDigest, snapshotHash: 'same', feedbackDigest: 'same' },
  );
  assert(passReport.passed, 'identical digests should pass');
  assert(passReport.mismatches.length === 0, 'should have no mismatches');

  const fingerprint = buildParityFingerprint({
    ...baseDigest,
    snapshotHash: '',
    feedbackDigest: 'fb',
  });
  assert(fingerprint.length === 64, 'fingerprint should be sha256 hex');
}
