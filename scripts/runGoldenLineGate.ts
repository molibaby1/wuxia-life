#!/usr/bin/env tsx

import * as path from 'node:path';
import {
  runGoldenLineExperienceGates,
  writeGoldenLineGateReport,
  type GoldenLineGateFinding,
} from './goldenLineGate';

function printFindings(findings: GoldenLineGateFinding[]): void {
  const failures = findings.filter(
    finding => finding.status === 'fail' || finding.status === 'warning',
  );
  for (const finding of failures) {
    const location = [finding.sampleId, finding.eventId, finding.choiceId]
      .filter(Boolean)
      .join(' / ');
    console.log(`- [${finding.gate}] ${finding.severity} ${location}: ${finding.detail}`);
  }
}

async function main(): Promise<void> {
  const quiet = process.argv.includes('--quiet');
  const result = await runGoldenLineExperienceGates({ quiet });
  const reportPath = writeGoldenLineGateReport(result);

  console.log('\n=== Golden Line Gate (PXG4) ===');
  console.log(`Decision: ${result.pass ? 'PASS' : 'FAIL'}`);
  console.log(`Active-scope blockers: ${result.activeScope.activeBlockerCount}`);
  console.log(`Feedback issues: ${result.feedbackIssueCount}`);
  const payoff = result.payoffEvaluation.summary;
  console.log(
    `Payoff: static=${(payoff.staticPayoffRate * 100).toFixed(1)}% simulated gaps=${payoff.missedOpportunityCount}`,
  );
  console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);

  const simulatedGaps = result.payoffEvaluation.missedOpportunities.filter(
    gap => gap.findingType === 'simulated_gap',
  );
  if (simulatedGaps.length > 0 && !quiet) {
    console.log('\nMissed payoff opportunities:');
    for (const gap of simulatedGaps) {
      console.log(
        `  - ${gap.sampleId}: choice=${gap.choiceId} expected=${gap.expectedPayoffEventIds.join('|')} blockReason=${gap.blockReason}`,
      );
    }
  }

  if (!quiet) {
    printFindings(result.findings);
  }

  if (!result.pass) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error('[golden-line-gate] failed:', error);
  process.exit(1);
});
