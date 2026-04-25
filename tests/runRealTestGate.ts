import { spawnSync } from 'node:child_process';

/** 子进程不继承 NODE_OPTIONS，避免宿主/IDE 注入的 `--localstorage-file` 等污染门禁日志 */
function gateChildEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.NODE_OPTIONS;
  return env;
}

type Suite = {
  name: string;
  entry: string;
};

/**
 * Blocker substrings: if any appear in combined gate output, the gate fails
 * even when all suite exit codes are 0 (false-green prevention).
 */
export const GATE_BLOCKER_SUBSTRINGS = [
  'Failed to evaluate expression',
  'ReferenceError',
  'Unknown stat',
  'localstorage-file invalid path',
] as const;

export function findBlockerKeywordInLog(log: string): (typeof GATE_BLOCKER_SUBSTRINGS)[number] | undefined {
  for (const s of GATE_BLOCKER_SUBSTRINGS) {
    if (log.includes(s)) return s;
  }
  return undefined;
}

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
