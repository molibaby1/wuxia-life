import { spawnSync } from 'node:child_process';

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

for (const suite of suites) {
  console.log(`\n▶ Running ${suite.name} (${suite.entry})`);
  const result = spawnSync('npx', ['tsx', suite.entry], { stdio: 'inherit' });
  if (result.status !== 0) {
    failed = true;
    console.error(`✖ ${suite.name} failed with exit code ${result.status ?? 'unknown'}`);
  } else {
    console.log(`✔ ${suite.name} passed`);
  }
}

process.exit(failed ? 1 : 0);
