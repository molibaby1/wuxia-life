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
  { name: 'AllTests', entry: 'tests/AllTests.ts' },
  { name: 'IntegrationTests', entry: 'tests/IntegrationTests.ts' },
  { name: 'testGameSimulation', entry: 'tests/testGameSimulation.ts' },
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
