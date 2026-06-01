/**
 * P5 extraction gate (P5 US-025).
 */

import { spawnSync } from 'node:child_process';

const steps: Array<{ name: string; command: string; args: string[] }> = [
  { name: 'typecheck', command: 'npm', args: ['run', 'typecheck'] },
  { name: 'contracts', command: 'npm', args: ['run', 'test:contracts'] },
  { name: 'headless', command: 'npm', args: ['run', 'test:headless'] },
  { name: 'headless:parity', command: 'npm', args: ['run', 'test:headless:parity'] },
  { name: 'tests', command: 'npm', args: ['test'] },
  { name: 'gate:golden-line', command: 'npm', args: ['run', 'gate:golden-line', '--', '--quiet'] },
  { name: 'gate:midlife', command: 'npm', args: ['run', 'gate:midlife', '--', '--quiet'] },
  { name: 'gate:experience', command: 'npm', args: ['run', 'gate:experience', '--', '--quiet'] },
];

let failed = false;
for (const step of steps) {
  const result = spawnSync(step.command, step.args, { stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    console.error(`P5 gate failed at step: ${step.name}`);
    failed = true;
    break;
  }
}

process.exit(failed ? 1 : 0);
