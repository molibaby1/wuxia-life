import { existsSync } from 'node:fs';
import { runRealControlCheck } from './roles/realControlRunner';

function parseArgs(argv: string[]): { outRoot: string; runId?: string } {
  let outRoot = '.tmp/b0';
  let runId: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out' && argv[i + 1]) outRoot = argv[++i];
    else if (argv[i] === '--run-id' && argv[i + 1]) runId = argv[++i];
  }
  return { outRoot, runId };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const result = await runRealControlCheck(args);
  console.log(
    JSON.stringify(
      {
        runId: result.runId,
        outDir: result.outDir,
        passed: result.passed,
        failures: result.failures,
        cases: result.cases.map(c => ({
          personaId: c.personaId,
          seed: c.seed,
          finalAge: c.finalAge,
          projectionOk: c.projectionOk,
          hardKill: c.audit.hardKill,
          detections: c.audit.detections,
        })),
      },
      null,
      2,
    ),
  );
  if (!result.passed) process.exitCode = 1;
}

const isMain =
  process.argv[1] &&
  existsSync(process.argv[1]) &&
  (process.argv[1].endsWith('runRealControlCheck.ts') ||
    process.argv[1].includes('/runRealControlCheck.'));

if (isMain) {
  main().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}
