import { compareParityFields } from '../../src/headless/parity/parityModel';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runParityHarnessTests(): void {
  const report = compareParityFields(
    'harness-smoke',
    {
      snapshotHash: 'a',
      feedbackDigest: 'f1',
      routeStateJson: '{}',
      lifeMemoryJson: '{}',
      eventHistoryDigest: '[]',
    },
    {
      snapshotHash: 'b',
      feedbackDigest: 'f2',
      routeStateJson: '{}',
      lifeMemoryJson: '[]',
      eventHistoryDigest: '[]',
    },
  );
  assert(!report.passed, 'should detect snapshot hash mismatch');
  assert(report.mismatches.length >= 1, 'should include mismatch entries');
  assert(report.mismatches[0]?.field.length > 0, 'should name mismatch field');
}
