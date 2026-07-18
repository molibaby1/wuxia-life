import {
  runInfantPassiveChainVerification,
  type InfantPassiveChainVerificationReport,
} from '../src/p16/infantPassiveChainVerification';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export async function runInfantPassiveChainVerificationTests(): Promise<InfantPassiveChainVerificationReport> {
  const report = await runInfantPassiveChainVerification();

  assert(report.acX1.pass, `AC-X-1 failed: ${JSON.stringify(report.acX1.violations)}`);
  assert(report.acX2.pass, `AC-X-2 failed: ${JSON.stringify(report.acX2.traces)}`);
  assert(report.acX3.pass, `AC-X-3 failed: worst=${JSON.stringify(report.acX3.worstPair)}`);
  assert(report.acX4.pass, `AC-X-4 failed: ${JSON.stringify(report.acX4.traces)}`);

  for (const trace of report.selectorTraces) {
    assert(trace.chainNodeIds.length >= 5, `${trace.label}: expected 5 chain nodes, got ${trace.chainNodeIds.length}`);
    assert(trace.orderViolations.length === 0, `${trace.label}: ${trace.orderViolations.join('; ')}`);
    assert(trace.chainComplete, `${trace.label}: chain should complete by age 2`);
    assert(trace.exclusivityViolations.length === 0, `${trace.label}: foreign ids ${trace.exclusivityViolations.join(', ')}`);
  }

  for (const trace of report.headlessTraces) {
    assert(trace.passivePeriods === 3, `${trace.label}: expected phase checks at ages 0/1/2`);
    assert(trace.planningViolations === 0, `${trace.label}: planning violations`);
    assert(trace.emptyNarrativeBeforeContinue === 0, `${trace.label}: empty narrative before continue`);
  }

  for (const trace of report.selectorTraces) {
    assert(trace.passiveIds.length === 6, `${trace.label}: expected 6 annual-memory beats`);
  }

  return report;
}

async function main(): Promise<void> {
  const report = await runInfantPassiveChainVerificationTests();
  console.log(`✔ infantPassiveChainVerificationTests passed (${report.decision})`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
