/**
 * 稳定性门禁：对 `tests/testGameSimulation.ts` 批量运行，捕捉非确定性失败与「假绿」日志。
 *
 * 规则（默认 `STABILITY_RUNS=20`）：
 * - 每一轮必须进程退出码为 0。
 * - 每一轮合并 stdout/stderr 不得命中 `tests/qualityGatePolicy.ts` 中的任一 Blocker 子串。
 * - 失败时打印轮次与完整日志，便于复现与附件化证据。
 */
import { spawnSync } from 'node:child_process';
import { findBlockerKeywordInLog, gateChildEnv } from '../tests/qualityGatePolicy.ts';

const runs = Math.max(1, Number.parseInt(process.env.STABILITY_RUNS ?? '20', 10) || 20);

for (let i = 1; i <= runs; i++) {
  const result = spawnSync('npx', ['tsx', 'tests/testGameSimulation.ts'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
    env: gateChildEnv(),
  });
  const stdout = result.stdout instanceof Buffer ? result.stdout.toString('utf8') : (result.stdout ?? '');
  const stderr = result.stderr instanceof Buffer ? result.stderr.toString('utf8') : (result.stderr ?? '');
  const log = stdout + stderr;

  if (result.status !== 0) {
    console.error(`\n✖ Stability gate: run ${i}/${runs} exited with code ${result.status ?? 'unknown'}`);
    console.error('--- captured output (full) ---\n');
    console.error(log);
    process.exit(1);
  }

  const blocker = findBlockerKeywordInLog(log);
  if (blocker !== undefined) {
    console.error(`\n✖ Stability gate: run ${i}/${runs} blocker keyword: "${blocker}"`);
    console.error('--- captured output (full) ---\n');
    console.error(log);
    process.exit(1);
  }

  console.log(`✔ Stability run ${i}/${runs} ok (exit 0, no blocker in log)`);
}

console.log(`\n✔ Stability gate: all ${runs} runs passed.`);
