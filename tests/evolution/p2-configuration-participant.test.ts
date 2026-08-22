import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runConfigurationExecutionParticipant } from '../../scripts/evolution/configurationExecutionParticipant';

async function main(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'p2-config-participant-'));
  const workspaceRoot = join(root, 'workspace');
  const destinationRoot = join(root, 'execution');
  await import('node:fs/promises').then(({ mkdir }) => mkdir(workspaceRoot, { recursive: true }));
  const problemPackagePath = join(root, 'problem-package.json');
  await writeFile(problemPackagePath, '{}\n');
  const result = await runConfigurationExecutionParticipant({
    invocationRef: 'configuration-execution-000001',
    destinationRoot,
    workspaceRoot,
    problemPackagePath,
    problemPackage: {
      schemaVersion: 'problem-package-v1',
      problemId: 'problem-000001',
      source: { runRef: 'run-000001', observablePayloadRef: 'payload.json', externalFeedbackRef: 'feedback.json', improvementHypothesisRef: 'hypothesis.json' },
      problem: { hypothesisId: 'hypothesis-000001', statement: 'A bounded configuration issue.', observedBasis: 'A sealed run.', feedbackRefs: [], evidenceRefs: [], unknowns: [], productSignificance: 'Player-visible.' },
      authorityRefs: [], productSourceFingerprintSha256: 'a'.repeat(64),
      permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
    },
    solutionWork: {
      schemaVersion: 'solution-work-v1', status: 'OPTIONS', problemId: 'problem-000001',
      options: [{ optionId: 'option-000001', proposedChange: 'Change data.', rationale: 'Narrow.', repoRefs: ['src/data/lines/family-life.json'], artifactRefs: [], changeScope: 'configuration', expectedPlayerObservableDifference: 'Executable data.', risks: [], unknowns: [] }],
      summary: 'One option.', repoRefs: [], artifactRefs: [],
    },
    solutionReview: { schemaVersion: 'solution-review-v1', problemId: 'problem-000001', decision: 'ACCEPT_OPTION', acceptedOptionId: 'option-000001', scopeAssessment: 'config_only', assessment: 'Accepted.', repoRefs: [], artifactRefs: [], concerns: [] },
    acceptedOptionId: 'option-000001',
    allowedWritePaths: ['src/data/lines/family-life.json'],
    authorityRefs: [],
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify({ schemaVersion: 'configuration-execution-result-v1', status: 'completed', changedFiles: ['src/data/lines/family-life.json'], verificationResults: [], deviations: [] }))})`],
    },
  });
  assert.equal(result.status, 'completed');
  assert.equal(result.resultPath !== null, true);
  assert.equal(result.failurePath, null);
  console.log('p2-configuration-participant.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
