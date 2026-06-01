/**
 * Deterministic 0-50 replay parity samples (P5 US-023).
 */

import { runDualTrackParity, P5_PARITY_SAMPLES } from '../../src/headless/parity/dualTrackParityHarness';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export async function runParitySamplesTests(): Promise<void> {
  for (const sample of P5_PARITY_SAMPLES) {
    const report = await runDualTrackParity(sample);
    if (!report.passed) {
      const detail = report.mismatches
        .map(m => `${m.category}:${m.field}@${m.step}`)
        .join(', ');
      throw new Error(`Parity mismatch for ${sample.id}: ${detail}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runParitySamplesTests()
    .then(() => console.log('paritySamples.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
