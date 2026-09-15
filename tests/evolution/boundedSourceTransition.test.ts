import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runBoundedSourceTransition } from '../../scripts/evolution/runBoundedSourceTransition';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';

const participant: WorkspaceAgentParticipantOptions = { executable: 'test-participant', buildArgs: () => [] };

export async function runBoundedSourceTransitionTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'bounded-source-transition-'));
  const artifacts = { problemPackagePath: join(root, 'problem-package.json'), solutionPath: join(root, 'solution.json'), reviewPath: join(root, 'review.json') };
  for (const path of Object.values(artifacts)) await writeFile(path, '{}');
  const transitionRoot = join(root, 'transition');
  let rerunCalls = 0;
  const result = await runBoundedSourceTransition({
    authoritativeRoot: root,
    transitionRoot,
    sourceRoot: root,
    sourceRunRef: 'cohort-run-000001',
    acceptedCandidateArtifacts: artifacts,
    participant,
    dependencies: {
      executeConfiguration: async () => ({ status: 'completed', changedFiles: ['src/data/config.json'], verificationResults: [{ name: 'config', status: 'passed', details: 'ok' }], deviations: [] }),
      verifyScope: async () => ({ status: 'passed' }),
      rerunSource: async () => { rerunCalls += 1; return { runRef: 'cohort-run-000002', sourceRoot: join(root, 'source-b') }; },
      validateSealedSource: async () => undefined,
    },
  });
  assert.equal(result.status, 'succeeded');
  assert.equal(rerunCalls, 1);

  const failed = await runBoundedSourceTransition({
    authoritativeRoot: root,
    transitionRoot: join(root, 'transition-failed'),
    sourceRoot: root,
    sourceRunRef: 'cohort-run-000001',
    acceptedCandidateArtifacts: artifacts,
    participant,
    dependencies: {
      executeConfiguration: async () => ({ status: 'completed', changedFiles: ['src/runtime.ts'], verificationResults: [{ name: 'scope', status: 'passed', details: 'ok' }], deviations: [] }),
      verifyScope: async () => ({ status: 'scope_violation', unauthorizedFiles: ['src/runtime.ts'] }),
      rerunSource: async () => ({ runRef: 'never', sourceRoot: root }),
    },
  });
  assert.equal(failed.status, 'failed');
  assert.match(failed.failureReason, /scope/);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBoundedSourceTransitionTests()
    .then(() => console.log('boundedSourceTransition.test.ts: ok'))
    .catch(error => { console.error(error); process.exit(1); });
}
