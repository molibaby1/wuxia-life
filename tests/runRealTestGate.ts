import { spawnSync } from 'node:child_process';
import {
  GATE_BLOCKER_SUBSTRINGS,
  findBlockerKeywordInLog,
  gateChildEnv,
} from './qualityGatePolicy.ts';

export { GATE_BLOCKER_SUBSTRINGS, findBlockerKeywordInLog } from './qualityGatePolicy.ts';

type Suite = {
  name: string;
  entry: string;
};

const suites: Suite[] = [
  { name: 'p8PlayabilityTests', entry: 'tests/p8PlayabilityTests.ts' },
  { name: 'p9PlayabilityTests', entry: 'tests/p9PlayabilityTests.ts' },
  { name: 'p11SchedulingTests', entry: 'tests/p11SchedulingTests.ts' },
  { name: 'p12ProfileTests', entry: 'tests/p12ProfileTests.ts' },
  { name: 'p16OriginDestinyTests', entry: 'tests/p16OriginDestinyTests.ts' },
  { name: 'p17ConsequenceTests', entry: 'tests/p17ConsequenceTests.ts' },
  { name: 'p18LegacyTests', entry: 'tests/p18LegacyTests.ts' },
  { name: 'p19EndgameTests', entry: 'tests/p19EndgameTests.ts' },
  { name: 'AllTests', entry: 'tests/AllTests.ts' },
  { name: 'IntegrationTests', entry: 'tests/IntegrationTests.ts' },
  { name: 'testGameSimulation', entry: 'tests/testGameSimulation.ts' },
  { name: 'testLifeMemorySummary', entry: 'tests/testLifeMemorySummary.ts' },
];

let failed = false;
let aggregatedLog = '';

for (const suite of suites) {
  console.log(`\n▶ Running ${suite.name} (${suite.entry})`);
  const result = spawnSync('npx', ['tsx', suite.entry], {
    stdio: ['inherit', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
    env: gateChildEnv(),
  });
  const stdout = result.stdout instanceof Buffer ? result.stdout.toString('utf8') : (result.stdout ?? '');
  const stderr = result.stderr instanceof Buffer ? result.stderr.toString('utf8') : (result.stderr ?? '');
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  aggregatedLog += stdout + stderr;

  if (result.status !== 0) {
    failed = true;
    console.error(`✖ ${suite.name} failed with exit code ${result.status ?? 'unknown'}`);
  } else {
    console.log(`✔ ${suite.name} passed`);
  }
}

const blockerHit = findBlockerKeywordInLog(aggregatedLog);
if (blockerHit !== undefined) {
  console.error(
    `\n✖ Log-aware gate: blocker keyword detected in output: "${blockerHit}"\n` +
      '  Policy: any of these substrings in gate logs fails the run regardless of exit codes:\n' +
      `  ${GATE_BLOCKER_SUBSTRINGS.map((s) => `  - ${s}`).join('\n')}`,
  );
  failed = true;
}

process.exit(failed ? 1 : 0);
