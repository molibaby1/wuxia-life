import assert from 'node:assert/strict';
import { cp, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  runReviewContinuationReplay,
  runReviewContinuationReplayCli,
} from '../../scripts/evolution/replay/runReviewContinuationReplay';
import type {
  WorkspaceAgentJobInput,
  WorkspaceAgentParticipantOptions,
} from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { validateReviewContinuation } from '../../src/evolution/reviewContinuationContract';
import { validateSolutionDecision } from '../../src/evolution/solutionDecisionContract';

const repositoryRoot = process.cwd();
const fixedCasesRoot = join(repositoryRoot, 'artifacts/evolution/fixed-cases');

function fixedCase(caseId: string): string {
  return join(fixedCasesRoot, caseId);
}

function createParticipant(outputs: {
  solution: unknown;
  reviewer: unknown;
}, state: { calls: number; roles: string[] }): WorkspaceAgentParticipantOptions {
  return {
    executable: process.execPath,
    buildArgs: (input: WorkspaceAgentJobInput) => {
      state.calls += 1;
      state.roles.push(input.role);
      const output = input.role === 'solution' ? outputs.solution : outputs.reviewer;
      return ['-e', 'process.stdout.write(process.argv[1]);', JSON.stringify(output)];
    },
  };
}

async function readHistorical(caseId: string, file: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(join(fixedCase(caseId), 'historical', file), 'utf8')) as Record<string, unknown>;
}

async function buildParticipant(
  caseId: string,
  revisionStatus: 'OPTIONS' | 'INSUFFICIENT_EVIDENCE',
  rereviewDecision: 'ESCALATE' | 'REQUEST_MORE_WORK' = 'ESCALATE',
) {
  const solution = await readHistorical(caseId, 'solution-result.json');
  const review = await readHistorical(caseId, 'reviewer-result.json');
  const revision = revisionStatus === 'OPTIONS'
    ? {
      ...solution,
      summary: 'The bounded local checks requested by the historical Reviewer were investigated in the fixed workspace.',
    }
    : {
      ...solution,
      status: 'INSUFFICIENT_EVIDENCE',
      options: [],
      recommendedOptionId: undefined,
      summary: 'The requested authority boundary is unavailable in the fixed execution context.',
    };
  delete revision.recommendedOptionId;
  const rereview = {
    ...review,
    decision: rereviewDecision,
    acceptedOptionId: undefined,
    scopeAssessment: undefined,
    assessment: rereviewDecision === 'ESCALATE'
      ? 'The remaining product-authority question requires Human judgment after the bounded local checks.'
      : 'A second bounded revision would be required, but the continuation budget is exhausted.',
    concerns: rereviewDecision === 'ESCALATE'
      ? ['Human authority remains required for the unresolved product boundary.']
      : ['A second REQUEST_MORE_WORK must terminate this continuation.'],
  };
  delete rereview.acceptedOptionId;
  delete rereview.scopeAssessment;
  return { solution: revision, reviewer: rereview };
}

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function runWithOutput<T>(callback: (outputRoot: string) => Promise<T>): Promise<T> {
  const root = await mkdtemp(join(tmpdir(), 'review-continuation-replay-test-'));
  try {
    return await callback(join(root, 'output'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function copyCaseInput(caseId: string, destinationRoot: string): Promise<void> {
  const sourceRoot = fixedCase(caseId);
  await mkdir(join(destinationRoot, 'input'), { recursive: true });
  await mkdir(join(destinationRoot, 'historical'), { recursive: true });
  await writeFile(join(destinationRoot, 'case.json'), await readFile(join(sourceRoot, 'case.json')));
  await writeFile(
    join(destinationRoot, 'input/problem-package.json'),
    await readFile(join(sourceRoot, 'input/problem-package.json')),
  );
}

async function copyFullCase(caseId: string): Promise<{ root: string; caseRoot: string }> {
  const root = await mkdtemp(join(tmpdir(), 'review-continuation-replay-full-case-'));
  const caseRoot = join(root, 'case');
  await cp(fixedCase(caseId), caseRoot, { recursive: true, dereference: false });
  return { root, caseRoot };
}

export async function runReviewContinuationReplayTests(): Promise<void> {
  await runWithOutput(async outputRoot => {
    const state = { calls: 0, roles: [] as string[] };
    const outputs = await buildParticipant('ordinary-run-20260910-000006-round-1', 'OPTIONS');
    const nestedOutputRoot = join(outputRoot, 'nested', 'output');
    const result = await runReviewContinuationReplay({
      caseRoot: fixedCase('ordinary-run-20260910-000006-round-1'),
      outputRoot: nestedOutputRoot,
      participant: createParticipant(outputs, state),
      repositoryRoot,
    });

    assert.equal(result.continuationInvoked, true);
    assert.equal(state.calls, 2);
    assert.equal(await exists(join(nestedOutputRoot, 'replay-report.json')), true);
  });

  await runWithOutput(async outputRoot => {
    const state = { calls: 0, roles: [] as string[] };
    const outputs = await buildParticipant('ordinary-run-20260910-000006-round-1', 'OPTIONS');
    const result = await runReviewContinuationReplay({
      caseRoot: fixedCase('ordinary-run-20260910-000006-round-1'),
      outputRoot,
      participant: createParticipant(outputs, state),
      repositoryRoot,
    });

    assert.equal(result.baseHistoricalRoute, 'DEFER_MORE_WORK_REQUESTED');
    assert.equal(result.continuationInvoked, true);
    assert.equal(result.continuationParticipantCount, 2);
    assert.equal(result.revisionStatus, 'OPTIONS');
    assert.equal(result.reReviewDecision, 'ESCALATE');
    assert.equal(result.effectiveRoute, 'ESCALATE_HUMAN');
    assert.equal(result.requestedWorkInvestigated, 'NOT_ESTABLISHED');
    assert.equal(result.unavailableEvidenceFabricated, 'NOT_ESTABLISHED');
    assert.equal(result.humanAuthorityBypassed, 'NOT_ESTABLISHED');
    assert.match(result.unavailableEvidenceFabricatedReason, /does not establish|semantic audit/i);
    assert.match(result.humanAuthorityBypassedReason, /does not establish|semantic audit/i);
    assert.equal(state.calls, 2);
    assert.deepEqual(state.roles, ['solution', 'reviewer']);
    assert.equal(await exists(join(outputRoot, 'review-continuation-000001/continuation.json')), true);
    assert.equal(await exists(join(outputRoot, 'review-continuation-000001/solution-revision/result.json')), true);
    assert.equal(await exists(join(outputRoot, 'review-continuation-000001/reviewer-agent/review.json')), true);
    assert.equal(await exists(join(outputRoot, 'review-continuation-000001/decision.json')), true);
    assert.deepEqual(
      validateReviewContinuation(JSON.parse(await readFile(join(outputRoot, 'review-continuation-000001/continuation.json'), 'utf8'))),
      JSON.parse(await readFile(join(outputRoot, 'review-continuation-000001/continuation.json'), 'utf8')),
    );
    assert.deepEqual(
      validateSolutionDecision(JSON.parse(await readFile(join(outputRoot, 'review-continuation-000001/decision.json'), 'utf8'))),
      JSON.parse(await readFile(join(outputRoot, 'review-continuation-000001/decision.json'), 'utf8')),
    );
    assert.equal(await exists(join(outputRoot, 'replay-report.json')), true);
  });

  await runWithOutput(async outputRoot => {
    const cloned = await copyFullCase('ordinary-run-20260910-000006-round-1');
    try {
      const invocationPath = join(cloned.caseRoot, 'historical/solution-invocation.json');
      const invocation = JSON.parse(await readFile(invocationPath, 'utf8')) as Record<string, unknown>;
      invocation.role = 'reviewer';
      await writeFile(invocationPath, `${JSON.stringify(invocation)}\n`);
      const state = { calls: 0, roles: [] as string[] };

      await assert.rejects(
        () => runReviewContinuationReplay({
          caseRoot: cloned.caseRoot,
          outputRoot,
          participant: createParticipant({ solution: {}, reviewer: {} }, state),
          repositoryRoot,
        }),
        /invocation.*identity|invocation.*role/i,
      );
      assert.equal(state.calls, 0);
      assert.equal(await exists(outputRoot), false);
    } finally {
      await rm(cloned.root, { recursive: true, force: true });
    }
  });

  await runWithOutput(async outputRoot => {
    const cloned = await copyFullCase('ordinary-run-20260910-000006-round-1');
    try {
      const workspaceFile = join(cloned.caseRoot, 'workspaces/solution/src/App.vue');
      await writeFile(workspaceFile, 'tampered historical workspace\n');
      const state = { calls: 0, roles: [] as string[] };

      await assert.rejects(
        () => runReviewContinuationReplay({
          caseRoot: cloned.caseRoot,
          outputRoot,
          participant: createParticipant({ solution: {}, reviewer: {} }, state),
          repositoryRoot,
        }),
        /workspace fingerprint mismatch/i,
      );
      assert.equal(state.calls, 0);
      assert.equal(await exists(outputRoot), false);
    } finally {
      await rm(cloned.root, { recursive: true, force: true });
    }
  });

  await runWithOutput(async outputRoot => {
    const cloned = await copyFullCase('ordinary-run-20260910-000006-round-1');
    try {
      const inputArtifact = join(
        cloned.caseRoot,
        'input/artifacts/source/observable-payload.json',
      );
      await writeFile(inputArtifact, 'tampered fixed-case input artifact\n');
      const state = { calls: 0, roles: [] as string[] };

      await assert.rejects(
        () => runReviewContinuationReplay({
          caseRoot: cloned.caseRoot,
          outputRoot,
          participant: createParticipant({ solution: {}, reviewer: {} }, state),
          repositoryRoot,
        }),
        /declared artifact hash mismatch/i,
      );
      assert.equal(state.calls, 0);
      assert.equal(await exists(outputRoot), false);
    } finally {
      await rm(cloned.root, { recursive: true, force: true });
    }
  });

  await runWithOutput(async outputRoot => {
    const cloned = await copyFullCase('ordinary-run-20260910-000006-round-1');
    try {
      const historicalResult = join(
        cloned.caseRoot,
        'historical/solution-result.json',
      );
      const solution = JSON.parse(await readFile(historicalResult, 'utf8')) as Record<string, unknown>;
      solution.summary = 'tampered historical Solution result';
      await writeFile(historicalResult, `${JSON.stringify(solution)}\n`);
      const state = { calls: 0, roles: [] as string[] };

      await assert.rejects(
        () => runReviewContinuationReplay({
          caseRoot: cloned.caseRoot,
          outputRoot,
          participant: createParticipant({ solution: {}, reviewer: {} }, state),
          repositoryRoot,
        }),
        /historical artifact hash mismatch/i,
      );
      assert.equal(state.calls, 0);
      assert.equal(await exists(outputRoot), false);
    } finally {
      await rm(cloned.root, { recursive: true, force: true });
    }
  });

  for (const historicalRelativePath of [
    'historical/reviewer-result.json',
    'historical/decision.json',
  ]) {
    await runWithOutput(async outputRoot => {
      const cloned = await copyFullCase('ordinary-run-20260910-000006-round-1');
      try {
        const historicalResult = join(cloned.caseRoot, historicalRelativePath);
        const value = JSON.parse(await readFile(historicalResult, 'utf8')) as Record<string, unknown>;
        value.tampered = true;
        await writeFile(historicalResult, `${JSON.stringify(value)}\n`);
        const state = { calls: 0, roles: [] as string[] };

        await assert.rejects(
          () => runReviewContinuationReplay({
            caseRoot: cloned.caseRoot,
            outputRoot,
            participant: createParticipant({ solution: {}, reviewer: {} }, state),
            repositoryRoot,
          }),
          /historical artifact hash mismatch/i,
        );
        assert.equal(state.calls, 0);
        assert.equal(await exists(outputRoot), false);
      } finally {
        await rm(cloned.root, { recursive: true, force: true });
      }
    });
  }

  await runWithOutput(async outputRoot => {
    const cloned = await copyFullCase('ordinary-run-20260910-000006-round-1');
    try {
      const workspaceManifestPath = join(
        cloned.caseRoot,
        'workspaces/solution/.agent-workspace-manifest.json',
      );
      const workspaceManifest = JSON.parse(await readFile(workspaceManifestPath, 'utf8')) as Record<string, unknown>;
      workspaceManifest.authoritativeFingerprintSha256 = '0'.repeat(64);
      await writeFile(workspaceManifestPath, `${JSON.stringify(workspaceManifest)}\n`);
      const state = { calls: 0, roles: [] as string[] };

      await assert.rejects(
        () => runReviewContinuationReplay({
          caseRoot: cloned.caseRoot,
          outputRoot,
          participant: createParticipant({ solution: {}, reviewer: {} }, state),
          repositoryRoot,
        }),
        /authoritative fingerprint mismatch/i,
      );
      assert.equal(state.calls, 0);
      assert.equal(await exists(outputRoot), false);
    } finally {
      await rm(cloned.root, { recursive: true, force: true });
    }
  });

  await runWithOutput(async outputRoot => {
    const state = { calls: 0, roles: [] as string[] };
    const outputs = await buildParticipant('ordinary-run-20260910-000007-round-1', 'INSUFFICIENT_EVIDENCE');
    const result = await runReviewContinuationReplay({
      caseRoot: fixedCase('ordinary-run-20260910-000007-round-1'),
      outputRoot,
      participant: createParticipant(outputs, state),
      repositoryRoot,
    });

    assert.equal(result.baseHistoricalRoute, 'DEFER_MORE_WORK_REQUESTED');
    assert.equal(result.continuationInvoked, true);
    assert.equal(result.continuationParticipantCount, 1);
    assert.equal(result.revisionStatus, 'INSUFFICIENT_EVIDENCE');
    assert.equal(result.reReviewDecision, null);
    assert.equal(result.effectiveRoute, 'DEFER');
    assert.equal(result.requestedWorkInvestigated, 'NOT_ESTABLISHED');
    assert.equal(result.unavailableEvidenceFabricated, 'NOT_ESTABLISHED');
    assert.equal(result.humanAuthorityBypassed, 'NOT_ESTABLISHED');
    assert.match(result.unavailableEvidenceFabricatedReason, /does not establish|semantic audit/i);
    assert.match(result.humanAuthorityBypassedReason, /does not establish|semantic audit/i);
    assert.equal(state.calls, 1);
    assert.deepEqual(state.roles, ['solution']);
    assert.equal(await exists(join(outputRoot, 'review-continuation-000001/reviewer-agent/review.json')), false);
  });

  await runWithOutput(async outputRoot => {
    const state = { calls: 0, roles: [] as string[] };
    const outputs = await buildParticipant(
      'ordinary-run-20260910-000006-round-1',
      'OPTIONS',
      'REQUEST_MORE_WORK',
    );
    const result = await runReviewContinuationReplay({
      caseRoot: fixedCase('ordinary-run-20260910-000006-round-1'),
      outputRoot,
      participant: createParticipant(outputs, state),
      repositoryRoot,
    });

    assert.equal(result.continuationParticipantCount, 2);
    assert.equal(result.reReviewDecision, 'REQUEST_MORE_WORK');
    assert.equal(result.effectiveRoute, 'DEFER_MORE_WORK_REQUESTED');
    assert.equal(state.calls, 2);
    assert.deepEqual(state.roles, ['solution', 'reviewer']);
    assert.equal(await exists(join(outputRoot, 'review-continuation-000002')), false);
  });

  await runWithOutput(async outputRoot => {
    const state = { calls: 0, roles: [] as string[] };
    const result = await runReviewContinuationReplay({
      caseRoot: fixedCase('ordinary-run-20260910-000006-round-1'),
      outputRoot,
      participant: createParticipant({ solution: { invalid: true }, reviewer: {} }, state),
      repositoryRoot,
    });

    assert.equal(result.continuationInvoked, true);
    assert.equal(result.continuationParticipantCount, 1);
    assert.equal(result.revisionStatus, 'participant_failure');
    assert.equal(result.reReviewDecision, null);
    assert.equal(result.effectiveRoute, 'PARTICIPANT_FAILURE');
    assert.equal(state.calls, 1);
    assert.deepEqual(state.roles, ['solution']);
    assert.equal(await exists(join(outputRoot, 'review-continuation-000001/decision.json')), false);
    assert.equal(await exists(join(outputRoot, 'review-continuation-000001/solution-revision/failure.json')), true);
  });

  await runWithOutput(async outputRoot => {
    const state = { calls: 0, roles: [] as string[] };
    const result = await runReviewContinuationReplay({
      caseRoot: fixedCase('ordinary-run-20260910-000005-round-1'),
      outputRoot,
      participant: createParticipant({ solution: {}, reviewer: {} }, state),
      repositoryRoot,
    });

    assert.equal(result.baseHistoricalRoute, 'ESCALATE_HUMAN');
    assert.equal(result.continuationInvoked, false);
    assert.equal(result.continuationParticipantCount, 0);
    assert.equal(result.revisionStatus, null);
    assert.equal(result.reReviewDecision, null);
    assert.equal(result.effectiveRoute, 'ESCALATE_HUMAN');
    assert.equal(result.requestedWorkInvestigated, 'NOT_ESTABLISHED');
    assert.equal(result.unavailableEvidenceFabricated, 'NO');
    assert.equal(result.humanAuthorityBypassed, 'NO');
    assert.match(result.unavailableEvidenceFabricatedReason, /no .*fabricated|no continuation participant/i);
    assert.match(result.humanAuthorityBypassedReason, /no .*created|no continuation participant/i);
    assert.equal(state.calls, 0);
    assert.equal(await exists(join(outputRoot, 'review-continuation-000001')), false);
    assert.equal(await exists(join(outputRoot, 'replay-report.json')), true);
  });

  await runWithOutput(async outputRoot => {
    const root = await mkdtemp(join(tmpdir(), 'review-continuation-replay-invalid-'));
    try {
      await copyCaseInput('ordinary-run-20260910-000006-round-1', root);
      const packagePath = join(root, 'input/problem-package.json');
      const packageValue = JSON.parse(await readFile(packagePath, 'utf8')) as Record<string, unknown>;
      packageValue.problemId = 'tampered-before-participant';
      await writeFile(packagePath, `${JSON.stringify(packageValue)}\n`);
      const state = { calls: 0, roles: [] as string[] };

      await assert.rejects(
        () => runReviewContinuationReplay({
          caseRoot: root,
          outputRoot,
          participant: createParticipant({ solution: {}, reviewer: {} }, state),
          repositoryRoot,
        }),
        /Problem Package hash mismatch|problem package hash/i,
      );
      assert.equal(state.calls, 0);
      assert.equal(await exists(outputRoot), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  await runWithOutput(async outputRoot => {
    const root = await mkdtemp(join(tmpdir(), 'review-continuation-replay-unapproved-'));
    try {
      await copyCaseInput('ordinary-run-20260910-000006-round-1', root);
      const casePath = join(root, 'case.json');
      const manifest = JSON.parse(await readFile(casePath, 'utf8')) as Record<string, unknown>;
      manifest.caseId = 'ordinary-run-not-approved-round-1';
      await writeFile(casePath, `${JSON.stringify(manifest)}\n`);
      const state = { calls: 0, roles: [] as string[] };

      await assert.rejects(
        () => runReviewContinuationReplay({
          caseRoot: root,
          outputRoot,
          participant: createParticipant({ solution: {}, reviewer: {} }, state),
          repositoryRoot,
        }),
        /approved fixed case/i,
      );
      assert.equal(state.calls, 0);
      assert.equal(await exists(outputRoot), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  await runWithOutput(async outputRoot => {
    const root = await mkdtemp(join(tmpdir(), 'review-continuation-replay-path-'));
    try {
      await copyCaseInput('ordinary-run-20260910-000006-round-1', root);
      const casePath = join(root, 'case.json');
      const manifest = JSON.parse(await readFile(casePath, 'utf8')) as Record<string, unknown>;
      const solution = manifest.solution as Record<string, unknown>;
      solution.workspaceRef = '../outside-workspace';
      await writeFile(casePath, `${JSON.stringify(manifest)}\n`);
      const state = { calls: 0, roles: [] as string[] };

      await assert.rejects(
        () => runReviewContinuationReplay({
          caseRoot: root,
          outputRoot,
          participant: createParticipant({ solution: {}, reviewer: {} }, state),
          repositoryRoot,
        }),
        /escapes case root|workspace ref|fixed case manifest hash mismatch/i,
      );
      assert.equal(state.calls, 0);
      assert.equal(await exists(outputRoot), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  await runWithOutput(async outputRoot => {
    const root = await mkdtemp(join(tmpdir(), 'review-continuation-replay-output-isolation-'));
    try {
      await copyCaseInput('ordinary-run-20260910-000006-round-1', root);
      const nestedOutputRoot = join(root, 'nested-output');
      const state = { calls: 0, roles: [] as string[] };

      await assert.rejects(
        () => runReviewContinuationReplay({
          caseRoot: root,
          outputRoot: nestedOutputRoot,
          participant: createParticipant({ solution: {}, reviewer: {} }, state),
          repositoryRoot,
        }),
        /output.*fixed case|inside.*case/i,
      );
      assert.equal(state.calls, 0);
      assert.equal(await exists(nestedOutputRoot), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  {
    const cloned = await copyFullCase('ordinary-run-20260910-000006-round-1');
    try {
      const linkedParent = join(cloned.root, 'linked-output-parent');
      await symlink(cloned.caseRoot, linkedParent);
      const outputRoot = join(linkedParent, 'new-output');
      const state = { calls: 0, roles: [] as string[] };

      await assert.rejects(
        () => runReviewContinuationReplay({
          caseRoot: cloned.caseRoot,
          outputRoot,
          participant: createParticipant({ solution: {}, reviewer: {} }, state),
          repositoryRoot,
        }),
        /output.*fixed case|symlink/i,
      );
      assert.equal(state.calls, 0);
    } finally {
      await rm(cloned.root, { recursive: true, force: true });
    }
  }

  await assert.rejects(
    () => runReviewContinuationReplayCli([]),
    /missing required argument: --case-root/i,
  );
  await assert.rejects(
    () => runReviewContinuationReplayCli([
      '--case-root', 'case',
      '--output', 'output',
      '--participant-binding', 'DEEPSEEK',
    ]),
    /unsupported binding|PARTICIPANT_BINDING_UNAVAILABLE/i,
  );
}

runReviewContinuationReplayTests()
  .then(() => console.log('reviewContinuationReplay.test.ts: ok'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
