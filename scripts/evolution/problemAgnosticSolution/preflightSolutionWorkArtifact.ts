import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateSolutionWork } from '../../../src/evolution/solutionWorkContract';
import { ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH } from '../../../src/evolution/artifactBackedStructuredFinalResultContract';

const PASS_MARKER = 'ROLE_SCHEMA_PREFLIGHT_PASS';

async function main(): Promise<void> {
  if (process.argv.length > 2) {
    throw new Error('SolutionWork artifact preflight does not accept arguments');
  }

  const artifactPath = resolve(process.cwd(), ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH);
  const rawBytes = await readFile(artifactPath);
  const parsed: unknown = JSON.parse(rawBytes.toString('utf8'));
  validateSolutionWork(parsed);
  process.stdout.write(`${PASS_MARKER}\n`);
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
