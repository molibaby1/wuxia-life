import { execSync } from 'child_process';

/** ponytail: shared npm gate runner for P25 baseline scripts (3 callers). */
export function runNpmGate(label: string, command: string): 'PASS' | 'FAIL' {
  try {
    execSync(command, { stdio: 'pipe', cwd: process.cwd() });
    return 'PASS';
  } catch {
    console.error(`${label} failed`);
    return 'FAIL';
  }
}
