import { spawnSync } from 'node:child_process';

function run(command: string, args: string[]): number {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  return result.status ?? 1;
}

const steps: Array<{ name: string; command: string; args: string[] }> = [
  { name: 'typecheck', command: 'npm', args: ['run', 'typecheck'] },
  { name: 'build', command: 'npm', args: ['run', 'build'] },
  { name: 'contracts', command: 'npm', args: ['run', 'test:contracts'] },
  { name: 'headless', command: 'npm', args: ['run', 'test:headless'] },
  { name: 'p5-gate', command: 'npm', args: ['run', 'gate:p5'] },
  { name: 'p6b-server', command: 'npm', args: ['run', 'test:p6b'] },
  { name: 'golden-line', command: 'npm', args: ['run', 'gate:golden-line'] },
  { name: 'midlife', command: 'npm', args: ['run', 'gate:midlife'] },
  { name: 'experience', command: 'npm', args: ['run', 'gate:experience'] },
];

let failed = 0;
for (const step of steps) {
  console.log(`\n=== P6B gate: ${step.name} ===`);
  const code = run(step.command, step.args);
  if (code !== 0) {
    console.error(`P6B gate failed at step: ${step.name}`);
    failed = code;
    break;
  }
}

process.exit(failed === 0 ? 0 : 1);
