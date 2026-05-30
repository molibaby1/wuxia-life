#!/usr/bin/env tsx

import * as path from 'node:path';
import {
  formatMidlifeGateFailure,
  runMidlifeGate,
  writeMidlifeGateReport,
} from './midlifeGate';

async function main(): Promise<void> {
  const quiet = process.argv.includes('--quiet');
  const result = await runMidlifeGate({ quiet });
  const reportPath = writeMidlifeGateReport(result);

  console.log('\n=== P3 Midlife Gate (US-024) ===');
  console.log(`Decision: ${result.pass ? 'PASS' : 'FAIL'}`);
  console.log(`Priority routes checked: ${result.simulations.length}`);
  console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);

  if (result.failures.length > 0) {
    console.log('\nFailures:');
    for (const finding of result.failures) {
      console.log(`- ${formatMidlifeGateFailure(finding)}`);
    }
  }

  if (!result.pass) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error('[midlife-gate] failed:', error);
  process.exit(1);
});
