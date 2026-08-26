import assert from 'node:assert/strict';
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  preflightFixedSource,
  runProblemAgnosticAgentSolutionLoop,
  type FixedSourcePreflight,
  type RunProblemAgnosticAgentSolutionLoopOptions,
} from '../../scripts/evolution/runProblemAgnosticAgentSolutionLoop';
import {
  PHASE0_REQUIRED_SEALED_ARTIFACTS,
  sealPhase0Run,
  sha256Hex,
} from '../../scripts/evolution/phase0/provenance';
import {
  type WorkspaceAgentJobInput,
  type WorkspaceAgentParticipantOptions,
} from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { runSolutionAgent } from '../../scripts/evolution/problemAgnosticSolution/runSolutionAgent';

const fakeWorkspaceAgentParticipant: WorkspaceAgentParticipantOptions = {
  executable: 'fake-workspace-agent',
  buildArgs: () => [],
};

function createRecoveryCapableSolutionParticipant(
  solutionPayload: Record<string, unknown>,
): WorkspaceAgentParticipantOptions {
  const attempt0Raw = `Here is the result:\n${JSON.stringify(solutionPayload)}`;
  const attempt1Raw = JSON.stringify(solutionPayload);
  const threadRef = { provider: 'test-provider', opaqueId: 'thread-000001' };
  return {
    executable: process.execPath,
    buildArgs: () => ['-e', 'process.stdout.write(process.argv[1]);', attempt0Raw],
    interpretCompletedOutput: ({ stdout, expectedThreadRef }) => ({
      ok: true as const,
      rawOutput: stdout,
      threadRef: expectedThreadRef ?? threadRef,
    }),
    sameThreadContinuation: {
      provider: threadRef.provider,
      buildArgs: (_job: WorkspaceAgentJobInput) => [
        '-e',
        'process.stdout.write(process.argv[1]);',
        attempt1Raw,
      ],
    },
  };
}

async function writeRecoveryWorkflowFixtures(root: string): Promise<void> {
  await writeAuthorityRefFixtures(root);
  const canonicalSkillPath = 'skills/repository-grounded-investigation/SKILL.md';
  const canonicalSkillContent = await readFile(join(process.cwd(), canonicalSkillPath), 'utf8');
  await mkdir(join(root, 'skills/repository-grounded-investigation'), { recursive: true });
  await mkdir(join(root, 'src'), { recursive: true });
  await writeFile(join(root, canonicalSkillPath), canonicalSkillContent);
  await writeFile(join(root, 'src/example.ts'), 'export const example = true;');
}

const DEFAULT_TEST_AUTHORITY_REFS = [
  'docs/product/player-model.md',
  'docs/product/auto-evolution-model.md',
  'docs/governance/project-convergence.md',
  'docs/governance/product-decisions.md',
  'docs/governance/current-product-stage.md',
  'docs/governance/ai-collaboration-workflow.md',
];

async function writeAuthorityRefFixtures(root: string): Promise<void> {
  for (const reference of DEFAULT_TEST_AUTHORITY_REFS) {
    const path = join(root, reference);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `authority fixture: ${reference}\n`);
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function createPreflightFixture(): Promise<{
  root: string;
  sourceRoot: string;
  experimentRoot: string;
  preflight: FixedSourcePreflight;
}> {
  const root = await mkdtemp(join(tmpdir(), 'problem-agnostic-failure-loop-'));
  await writeAuthorityRefFixtures(root);
  const sourceRoot = join(root, 'sealed-source');
  const experimentRoot = join(root, '.tmp/evolution/problem-agnostic-agent-solution-loop');
  await mkdir(join(sourceRoot, 'reviewer-input'), { recursive: true });
  await writeFile(join(sourceRoot, 'reviewer-input/observable-payload.json'), '{}');
  return {
    root,
    sourceRoot,
    experimentRoot,
    preflight: {
      sourceRunRef: 'cohort-run-000001',
      sourceRoot,
      experimentRootHash: 'experiment-root-hash',
      observablePayloadHash: 'observable-payload-hash',
      sourceFingerprintSha256: 'source-fingerprint-hash',
    },
  };
}

async function writeLegacyFailureArtifact(input: {
  experimentRoot: string;
  stage: 'EXTERNAL_FEEDBACK' | 'IMPROVEMENT_HYPOTHESIS';
  errorKind: string;
  participantProvider?: string;
  invocationRefFlavor?: 'deepseek' | 'local';
}): Promise<void> {
  const directory = input.stage === 'EXTERNAL_FEEDBACK' ? 'feedback-runs' : 'hypothesis-runs';
  const runDirectory = join(input.experimentRoot, directory, 'cohort-run-000001');
  const invocationRefFlavor = input.invocationRefFlavor ?? 'deepseek';
  const invocationPrefix = invocationRefFlavor === 'local' ? 'local' : 'deepseek';
  await mkdir(runDirectory, { recursive: true });
  await writeFile(join(runDirectory, 'invocation.json'), JSON.stringify({
    schemaVersion: input.stage === 'EXTERNAL_FEEDBACK'
      ? 'minimal-external-feedback-invocation-v1'
      : 'improvement-hypothesis-invocation-v1',
    runRef: 'cohort-run-000001',
    ...(input.stage === 'EXTERNAL_FEEDBACK'
      ? { invocationRef: `cohort-run-000001-${invocationPrefix}-player-feedback-001` }
      : {
        feedbackInvocationRef: `cohort-run-000001-${invocationPrefix}-player-feedback-001`,
        hypothesisInvocationRef: `cohort-run-000001-${invocationPrefix}-improvement-hypothesis-001`,
      }),
    ...(input.participantProvider === undefined
      ? {}
      : { participant: { provider: input.participantProvider } }),
    status: 'failed',
    errorKind: input.errorKind,
  }));
  await writeFile(join(runDirectory, 'human-review.md'), 'failure evidence');
}

async function writeValidHypothesisArtifact(
  experimentRoot: string,
  runRef = 'cohort-run-000001',
): Promise<string> {
  const hypothesisDir = join(experimentRoot, `hypothesis-runs/${runRef}`);
  await mkdir(hypothesisDir, { recursive: true });
  await writeFile(join(hypothesisDir, 'hypotheses.json'), JSON.stringify({ hypotheses: [{
    hypothesis: 'A generic observed problem.',
    observedBasis: 'Observed in the fixed source.',
    feedbackRefs: ['overallImpression'],
    evidenceRefs: [],
    unknowns: ['Cause remains unknown.'],
    productSignificance: 'It may affect the player experience.',
  }] }));
  return hypothesisDir;
}

async function createSealedSourceFixture(input: {
  root: string;
  directoryName: string;
  runRef: string;
}): Promise<{ sourceRoot: string; observablePayloadHash: string; experimentRootHash: string }> {
  const sourceRoot = join(input.root, input.directoryName);
  for (const artifactPath of PHASE0_REQUIRED_SEALED_ARTIFACTS) {
    const artifact = join(sourceRoot, artifactPath);
    await mkdir(dirname(artifact), { recursive: true });
    await writeFile(artifact, '{}');
  }
  const { experimentRootHash } = await sealPhase0Run(sourceRoot, input.runRef);
  return {
    sourceRoot,
    observablePayloadHash: sha256Hex('{}'),
    experimentRootHash,
  };
}

export async function runMissingFixedSourceBindingTests(): Promise<void> {
  const fixture = await createPreflightFixture();
  let feedbackCalls = 0;
  let hypothesisCalls = 0;
  const options = {
    repositoryRoot: fixture.root,
    experimentRoot: fixture.experimentRoot,
    apiKey: 'test-key',
    workspaceAgentParticipant: fakeWorkspaceAgentParticipant,
    dependencies: {
      preflightFixedSource: async () => fixture.preflight,
      runExternalFeedback: async () => {
        feedbackCalls += 1;
        throw new Error('feedback must not run without fixed source binding');
      },
      runImprovementHypothesis: async () => {
        hypothesisCalls += 1;
        throw new Error('hypothesis must not run without fixed source binding');
      },
    },
  } as RunProblemAgnosticAgentSolutionLoopOptions;

  await assert.rejects(
    () => runProblemAgnosticAgentSolutionLoop(options),
    /fixedSourceRoot must be explicitly provided by the execution host/,
  );
  assert.equal(feedbackCalls, 0);
  assert.equal(hypothesisCalls, 0);
}

export async function runManifestAuthoritativeSourceBindingTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'problem-agnostic-authoritative-source-'));
  await writeAuthorityRefFixtures(root);
  const sourceRunRef = 'authoritative-run-ref';
  const directoryName = 'some-directory-name';
  const sealed = await createSealedSourceFixture({ root, directoryName, runRef: sourceRunRef });
  const preflight = await preflightFixedSource({ repositoryRoot: root, fixedSourceRoot: sealed.sourceRoot });
  assert.equal(preflight.sourceRunRef, sourceRunRef);

  const historical = await createSealedSourceFixture({
    root,
    directoryName: 'historical-directory-name',
    runRef: 'cohort-run-000001',
  });
  const historicalPreflight = await preflightFixedSource({
    repositoryRoot: root,
    fixedSourceRoot: historical.sourceRoot,
  });
  assert.equal(historicalPreflight.sourceRunRef, 'cohort-run-000001');

  const experimentRoot = join(root, '.tmp/evolution/problem-agnostic-agent-solution-loop');
  const result = await runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: root,
    fixedSourceRoot: sealed.sourceRoot,
    experimentRoot,
    apiKey: 'test-key',
    workspaceAgentParticipant: fakeWorkspaceAgentParticipant,
    dependencies: {
      runExternalFeedback: async options => {
        const feedbackDir = join(options.outRoot!, `feedback-runs/${options.runRef}`);
        await mkdir(feedbackDir, { recursive: true });
        return {
          runRef: options.runRef,
          invocationRef: 'feedback-000001',
          phase0RunPath: sealed.sourceRoot,
          feedbackDir,
          humanReportPath: join(feedbackDir, 'human-review.md'),
          observablePayloadHash: sealed.observablePayloadHash,
          experimentRootHash: sealed.experimentRootHash,
        };
      },
      runImprovementHypothesis: async options => {
        const hypothesisDir = await writeValidHypothesisArtifact(options.outRoot!, options.runRef);
        return {
          runRef: options.runRef,
          feedbackInvocationRef: 'feedback-000001',
          hypothesisInvocationRef: 'hypothesis-000001',
          hypothesisDir,
          humanReportPath: join(hypothesisDir, 'human-review.md'),
          experimentRootHash: sealed.experimentRootHash,
          observablePayloadHash: sealed.observablePayloadHash,
          feedbackHash: 'feedback-hash',
        };
      },
      runSolutionAgent: async input => ({
        ok: true,
        result: {
          schemaVersion: 'solution-work-v1',
          problemId: 'problem-hypothesis-000001',
          status: 'INSUFFICIENT_EVIDENCE',
          options: [],
          summary: 'Evidence remains insufficient.',
          repoRefs: [],
          artifactRefs: [],
        },
        invocationPath: join(input.destinationRoot, 'invocation.json'),
        rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
        resultPath: join(input.destinationRoot, 'result.json'),
      }),
    },
  });

  assert.equal(result.sourceRunRef, sourceRunRef);
  const problemPackage = JSON.parse(await readFile(join(experimentRoot, 'problem-package.json'), 'utf8'));
  assert.equal(problemPackage.source.runRef, sourceRunRef);
  assert.equal(problemPackage.source.externalFeedbackRef, `feedback-runs/${sourceRunRef}/feedback.json`);
  assert.equal(problemPackage.source.improvementHypothesisRef, `hypothesis-runs/${sourceRunRef}/hypotheses.json`);
  assert.match(await readFile(result.humanReviewPackagePath, 'utf8'), new RegExp(`source run: ${sourceRunRef}`));
  assert.equal(await pathExists(join(experimentRoot, 'game-runs', sourceRunRef)), true);
  assert.equal(await pathExists(join(experimentRoot, 'game-runs', directoryName)), false);
  assert.equal(await pathExists(join(experimentRoot, 'feedback-runs', sourceRunRef)), true);
  assert.equal(await pathExists(join(experimentRoot, 'hypothesis-runs', sourceRunRef)), true);
}

export async function runMissingWorkspaceAgentBindingTests(): Promise<void> {
  const fixture = await createPreflightFixture();
  let feedbackCalls = 0;
  let hypothesisCalls = 0;

  await assert.rejects(
    () => runProblemAgnosticAgentSolutionLoop({
      repositoryRoot: fixture.root,
      experimentRoot: fixture.experimentRoot,
      fixedSourceRoot: fixture.sourceRoot,
      apiKey: 'test-key',
      dependencies: {
        preflightFixedSource: async () => fixture.preflight,
        runExternalFeedback: async () => {
          feedbackCalls += 1;
          throw new Error('feedback must not run without host binding');
        },
        runImprovementHypothesis: async () => {
          hypothesisCalls += 1;
          throw new Error('hypothesis must not run without host binding');
        },
      },
    }),
    /workspaceAgentParticipant must be explicitly provided by the execution host/,
  );
  assert.equal(feedbackCalls, 0);
  assert.equal(hypothesisCalls, 0);
}

export async function runProblemAgnosticAgentSolutionLoopTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'problem-agnostic-loop-'));
  await writeAuthorityRefFixtures(root);
  const sourceRoot = join(root, 'sealed-source');
  const experimentRoot = join(root, 'experiment');
  await mkdir(join(sourceRoot, 'reviewer-input'), { recursive: true });
  await writeFile(join(sourceRoot, 'reviewer-input/observable-payload.json'), '{}');
  const preflight: FixedSourcePreflight = {
    sourceRunRef: 'cohort-run-000001',
    sourceRoot,
    experimentRootHash: 'experiment-root-hash',
    observablePayloadHash: 'observable-payload-hash',
    sourceFingerprintSha256: 'source-fingerprint-hash',
  };
  let solutionCalls = 0;
  let reviewerCalls = 0;
  const result = await runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: root,
    experimentRoot,
    apiKey: 'test-key',
    workspaceAgentParticipant: fakeWorkspaceAgentParticipant,
    authorityRefs: ['docs/product/missing-authority.md'],
    fixedSourceRoot: sourceRoot,
    dependencies: {
      preflightFixedSource: async () => preflight,
      runExternalFeedback: async options => {
        await mkdir(join(options.outRoot!, 'feedback-runs/cohort-run-000001'), { recursive: true });
        return {
          runRef: options.runRef,
          invocationRef: 'feedback-000001',
          phase0RunPath: sourceRoot,
          feedbackDir: join(options.outRoot!, 'feedback-runs/cohort-run-000001'),
          humanReportPath: join(options.outRoot!, 'feedback-runs/cohort-run-000001/human-review.md'),
          observablePayloadHash: preflight.observablePayloadHash,
          experimentRootHash: preflight.experimentRootHash,
        };
      },
      runImprovementHypothesis: async options => {
        assert.equal(options.sourceRoot, experimentRoot);
        assert.equal(
          await readFile(join(options.sourceRoot!, 'game-runs/cohort-run-000001/reviewer-input/observable-payload.json'), 'utf8'),
          '{}',
        );
        const hypothesisDir = join(options.outRoot!, 'hypothesis-runs/cohort-run-000001');
        await mkdir(hypothesisDir, { recursive: true });
        await writeFile(join(hypothesisDir, 'hypotheses.json'), JSON.stringify({ hypotheses: [] }));
        return {
          runRef: options.runRef,
          feedbackInvocationRef: 'feedback-000001',
          hypothesisInvocationRef: 'hypothesis-000001',
          hypothesisDir,
          humanReportPath: join(hypothesisDir, 'human-review.md'),
          experimentRootHash: preflight.experimentRootHash,
          observablePayloadHash: preflight.observablePayloadHash,
          feedbackHash: 'feedback-hash',
        };
      },
      runSolutionAgent: async () => {
        solutionCalls += 1;
        throw new Error('solution must not run for zero hypotheses');
      },
      runSolutionReviewer: async () => {
        reviewerCalls += 1;
        throw new Error('reviewer must not run for zero hypotheses');
      },
    },
  });
  assert.equal(result.status, 'completed');
  assert.equal(result.decision.route, 'SKIP');
  assert.equal(result.decision.reasonCode, 'NO_PROBLEM_FORMED');
  assert.equal(result.actualParticipantJobs, 2);
  assert.equal(solutionCalls, 0);
  assert.equal(reviewerCalls, 0);
  assert.match(await readFile(result.humanReviewPackagePath, 'utf8'), /Human decisions/);
  assert.equal(result.oldInvestigationCalls, 0);
  assert.equal(result.oldModificationWorkCalls, 0);
  assert.equal(result.configGameplayExecutionCount, 0);
}

export async function runSuccessfulOptionsReviewerOrchestrationTests(): Promise<void> {
  const fixture = await createPreflightFixture();
  const problemId = 'problem-hypothesis-000001';
  let reviewerCalls = 0;
  const result = await runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: fixture.root,
    experimentRoot: fixture.experimentRoot,
    fixedSourceRoot: fixture.sourceRoot,
    apiKey: 'test-key',
    workspaceAgentParticipant: fakeWorkspaceAgentParticipant,
    dependencies: {
      preflightFixedSource: async () => fixture.preflight,
      runExternalFeedback: async options => ({
        runRef: options.runRef,
        invocationRef: 'feedback-000001',
        phase0RunPath: fixture.sourceRoot,
        feedbackDir: join(options.outRoot!, 'feedback-runs/cohort-run-000001'),
        humanReportPath: join(options.outRoot!, 'feedback-runs/cohort-run-000001/human-review.md'),
        observablePayloadHash: fixture.preflight.observablePayloadHash,
        experimentRootHash: fixture.preflight.experimentRootHash,
      }),
      runImprovementHypothesis: async options => {
        const hypothesisDir = await writeValidHypothesisArtifact(options.outRoot!);
        return {
          runRef: options.runRef,
          feedbackInvocationRef: 'feedback-000001',
          hypothesisInvocationRef: 'hypothesis-000001',
          hypothesisDir,
          humanReportPath: join(hypothesisDir, 'human-review.md'),
          experimentRootHash: fixture.preflight.experimentRootHash,
          observablePayloadHash: fixture.preflight.observablePayloadHash,
          feedbackHash: 'feedback-hash',
        };
      },
      runSolutionAgent: async input => {
        assert.equal(await pathExists(join(input.workspaceRoot, '..', 'reviewer')), false);
        return {
          ok: true,
          result: {
            schemaVersion: 'solution-work-v1',
            problemId,
            status: 'OPTIONS',
            options: [{
              optionId: 'option-000001',
              proposedChange: 'A bounded configuration change.',
              rationale: 'It may address the observed problem.',
              repoRefs: [],
              artifactRefs: [],
              changeScope: 'configuration',
              expectedPlayerObservableDifference: 'A visible difference.',
              risks: [],
              unknowns: [],
            }],
            recommendedOptionId: 'option-000001',
            summary: 'One option.',
            repoRefs: [],
            artifactRefs: [],
          },
          invocationPath: join(input.destinationRoot, 'invocation.json'),
          rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
          resultPath: join(input.destinationRoot, 'result.json'),
        };
      },
      runSolutionReviewer: async input => {
        reviewerCalls += 1;
        assert.equal(await pathExists(input.workspaceRoot), true);
        return {
          ok: true,
          review: {
            schemaVersion: 'solution-review-v1',
            problemId,
            decision: 'ACCEPT_OPTION',
            acceptedOptionId: 'option-000001',
            scopeAssessment: 'config_only',
            assessment: 'The option fits the bounded configuration boundary.',
            repoRefs: [],
            artifactRefs: [],
            concerns: [],
          },
          invocationPath: join(input.destinationRoot, 'invocation.json'),
          rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
          reviewPath: join(input.destinationRoot, 'review.json'),
        };
      },
    },
  });
  assert.equal(result.status, 'completed');
  assert.equal(result.decision.route, 'READY_FOR_CONFIG_EXECUTION');
  assert.equal(result.actualParticipantJobs, 4);
  assert.equal(reviewerCalls, 1);
}

export async function runAuthorityRefPreflightTests(): Promise<void> {
  async function runCase(input: {
    authorityRefs: string[];
    expectedError: RegExp;
  }): Promise<void> {
    const fixture = await createPreflightFixture();
    const authoritySnapshot = await readFile(join(fixture.root, DEFAULT_TEST_AUTHORITY_REFS[0]!), 'utf8');
    let solutionCalls = 0;
    let reviewerCalls = 0;
    const resultPromise = runProblemAgnosticAgentSolutionLoop({
      repositoryRoot: fixture.root,
      experimentRoot: fixture.experimentRoot,
      fixedSourceRoot: fixture.sourceRoot,
      apiKey: 'test-key',
      workspaceAgentParticipant: fakeWorkspaceAgentParticipant,
      authorityRefs: input.authorityRefs,
      dependencies: {
        preflightFixedSource: async () => fixture.preflight,
        runExternalFeedback: async options => ({
          runRef: options.runRef,
          invocationRef: 'feedback-000001',
          phase0RunPath: fixture.sourceRoot,
          feedbackDir: join(options.outRoot!, 'feedback-runs/cohort-run-000001'),
          humanReportPath: join(options.outRoot!, 'feedback-runs/cohort-run-000001/human-review.md'),
          observablePayloadHash: fixture.preflight.observablePayloadHash,
          experimentRootHash: fixture.preflight.experimentRootHash,
        }),
        runImprovementHypothesis: async options => {
          const hypothesisDir = await writeValidHypothesisArtifact(options.outRoot!);
          return {
            runRef: options.runRef,
            feedbackInvocationRef: 'feedback-000001',
            hypothesisInvocationRef: 'hypothesis-000001',
            hypothesisDir,
            humanReportPath: join(hypothesisDir, 'human-review.md'),
            experimentRootHash: fixture.preflight.experimentRootHash,
            observablePayloadHash: fixture.preflight.observablePayloadHash,
            feedbackHash: 'feedback-hash',
          };
        },
        runSolutionAgent: async () => {
          solutionCalls += 1;
          throw new Error('Solution must not run before authority preflight');
        },
        runSolutionReviewer: async () => {
          reviewerCalls += 1;
          throw new Error('Reviewer must not run in authority preflight test');
        },
      },
    });

    await assert.rejects(resultPromise, input.expectedError);
    assert.equal(solutionCalls, 0);
    assert.equal(reviewerCalls, 0);
    assert.equal(await pathExists(join(fixture.experimentRoot, 'problem-package.json')), false);
    assert.equal(await pathExists(join(fixture.experimentRoot, 'solution-agent')), false);
    assert.equal(await pathExists(join(fixture.experimentRoot, 'reviewer-agent')), false);
    assert.equal(await pathExists(join(fixture.experimentRoot, 'decision.json')), false);
    assert.equal(await pathExists(join(fixture.experimentRoot, 'workflow-outcome.json')), false);
    assert.equal(await pathExists(join(fixture.experimentRoot, 'human-review-package.md')), false);
    assert.equal(await readFile(join(fixture.root, DEFAULT_TEST_AUTHORITY_REFS[0]!), 'utf8'), authoritySnapshot);
  }

  await runCase({
    authorityRefs: [...DEFAULT_TEST_AUTHORITY_REFS, 'docs/product/missing-authority.md'],
    expectedError: /invalid authorityRef: docs\/product\/missing-authority\.md: .*ENOENT/i,
  });
  await runCase({
    authorityRefs: ['../authority-outside-repository.md'],
    expectedError: /invalid authorityRef: \.\.\/authority-outside-repository\.md: authorityRef escapes its allowed root/i,
  });
}

export async function runLocalParticipantModeInsufficientEvidenceTests(): Promise<void> {
  const fixture = await createPreflightFixture();
  const problemId = 'problem-hypothesis-000001';
  let localParticipantPasses = 0;
  let reviewerCalls = 0;
  const result = await runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: fixture.root,
    experimentRoot: fixture.experimentRoot,
    fixedSourceRoot: fixture.sourceRoot,
    participantMode: 'local-subagent',
    workspaceAgentParticipant: fakeWorkspaceAgentParticipant,
    dependencies: {
      preflightFixedSource: async () => fixture.preflight,
      runExternalFeedback: async options => {
        assert.equal(options.localParticipant, fakeWorkspaceAgentParticipant);
        localParticipantPasses += 1;
        return {
          runRef: options.runRef,
          invocationRef: 'local-feedback-000001',
          phase0RunPath: fixture.sourceRoot,
          feedbackDir: join(options.outRoot!, 'feedback-runs/cohort-run-000001'),
          humanReportPath: join(options.outRoot!, 'feedback-runs/cohort-run-000001/human-review.md'),
          observablePayloadHash: fixture.preflight.observablePayloadHash,
          experimentRootHash: fixture.preflight.experimentRootHash,
        };
      },
      runImprovementHypothesis: async options => {
        assert.equal(options.localParticipant, fakeWorkspaceAgentParticipant);
        localParticipantPasses += 1;
        const hypothesisDir = await writeValidHypothesisArtifact(options.outRoot!);
        return {
          runRef: options.runRef,
          feedbackInvocationRef: 'local-feedback-000001',
          hypothesisInvocationRef: 'local-hypothesis-000001',
          hypothesisDir,
          humanReportPath: join(hypothesisDir, 'human-review.md'),
          experimentRootHash: fixture.preflight.experimentRootHash,
          observablePayloadHash: fixture.preflight.observablePayloadHash,
          feedbackHash: 'feedback-hash',
        };
      },
      runSolutionAgent: async input => ({
        ok: true,
        result: {
          schemaVersion: 'solution-work-v1',
          problemId,
          status: 'INSUFFICIENT_EVIDENCE',
          options: [],
          summary: 'The evidence is insufficient for a safe proposal.',
          repoRefs: [],
          artifactRefs: [],
        },
        invocationPath: join(input.destinationRoot, 'invocation.json'),
        rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
        resultPath: join(input.destinationRoot, 'result.json'),
      }),
      runSolutionReviewer: async () => {
        reviewerCalls += 1;
        throw new Error('Reviewer must not run after local Solution insufficiency');
      },
    },
  });

  assert.equal(localParticipantPasses, 2);
  assert.equal(result.status, 'completed');
  assert.equal(result.actualParticipantJobs, 3);
  assert.equal(result.decision.route, 'DEFER');
  assert.equal(result.decision.reasonCode, 'INSUFFICIENT_EVIDENCE');
  assert.equal(reviewerCalls, 0);
  assert.equal(result.configGameplayExecutionCount, 0);
}

export async function runInsufficientEvidenceDoesNotMaterializeReviewerWorkspaceTests(): Promise<void> {
  const fixture = await createPreflightFixture();
  let reviewerCalls = 0;
  const result = await runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: fixture.root,
    experimentRoot: fixture.experimentRoot,
    fixedSourceRoot: fixture.sourceRoot,
    apiKey: 'test-key',
    workspaceAgentParticipant: fakeWorkspaceAgentParticipant,
    dependencies: {
      preflightFixedSource: async () => fixture.preflight,
      runExternalFeedback: async options => ({
        runRef: options.runRef,
        invocationRef: 'feedback-000001',
        phase0RunPath: fixture.sourceRoot,
        feedbackDir: join(options.outRoot!, 'feedback-runs/cohort-run-000001'),
        humanReportPath: join(options.outRoot!, 'feedback-runs/cohort-run-000001/human-review.md'),
        observablePayloadHash: fixture.preflight.observablePayloadHash,
        experimentRootHash: fixture.preflight.experimentRootHash,
      }),
      runImprovementHypothesis: async options => {
        const hypothesisDir = await writeValidHypothesisArtifact(options.outRoot!);
        return {
          runRef: options.runRef,
          feedbackInvocationRef: 'feedback-000001',
          hypothesisInvocationRef: 'hypothesis-000001',
          hypothesisDir,
          humanReportPath: join(hypothesisDir, 'human-review.md'),
          experimentRootHash: fixture.preflight.experimentRootHash,
          observablePayloadHash: fixture.preflight.observablePayloadHash,
          feedbackHash: 'feedback-hash',
        };
      },
      runSolutionAgent: async input => {
        assert.equal(await pathExists(join(input.workspaceRoot, '..', 'reviewer')), false);
        return {
          ok: true,
          result: {
            schemaVersion: 'solution-work-v1',
            problemId: 'hypothesis-000001',
            status: 'INSUFFICIENT_EVIDENCE',
            options: [],
            summary: 'Evidence remains insufficient.',
            repoRefs: [],
            artifactRefs: [],
          },
          invocationPath: join(input.destinationRoot, 'invocation.json'),
          rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
          resultPath: join(input.destinationRoot, 'result.json'),
        };
      },
      runSolutionReviewer: async () => {
        reviewerCalls += 1;
        throw new Error('Reviewer must not run for insufficient evidence');
      },
    },
  });
  assert.equal(result.status, 'completed');
  assert.equal(result.decision.route, 'DEFER');
  assert.equal(result.decision.reasonCode, 'INSUFFICIENT_EVIDENCE');
  assert.equal(result.actualParticipantJobs, 3);
  assert.equal(reviewerCalls, 0);
  assert.equal(await pathExists(join(fixture.experimentRoot, 'agent-workspaces/reviewer')), false);
}

export async function runParticipantFailureOrchestrationTests(): Promise<void> {
  const feedbackFixture = await createPreflightFixture();
  let hypothesisCalls = 0;
  let solutionCalls = 0;
  let reviewerCalls = 0;
  const feedbackResult = await runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: feedbackFixture.root,
    experimentRoot: feedbackFixture.experimentRoot,
    fixedSourceRoot: feedbackFixture.sourceRoot,
    participantMode: 'local-subagent',
    workspaceAgentParticipant: fakeWorkspaceAgentParticipant,
    dependencies: {
      preflightFixedSource: async () => feedbackFixture.preflight,
      runExternalFeedback: async options => {
        assert.ok(options.localParticipant);
        await writeLegacyFailureArtifact({
          experimentRoot: options.outRoot!,
          stage: 'EXTERNAL_FEEDBACK',
          errorKind: 'timeout',
          participantProvider: 'codex-local-subagent',
          invocationRefFlavor: 'local',
        });
        throw new Error('legacy feedback runner failure');
      },
      runImprovementHypothesis: async () => {
        hypothesisCalls += 1;
        throw new Error('hypothesis must not run');
      },
      runSolutionAgent: async () => {
        solutionCalls += 1;
        throw new Error('solution must not run');
      },
      runSolutionReviewer: async () => {
        reviewerCalls += 1;
        throw new Error('reviewer must not run');
      },
    },
  });
  assert.equal(feedbackResult.status, 'participant_failure');
  assert.equal(feedbackResult.outcome.failedStage, 'EXTERNAL_FEEDBACK');
  assert.equal(feedbackResult.outcome.route, 'DEFER');
  assert.equal(feedbackResult.outcome.participantErrorKind, 'timeout');
  assert.equal(feedbackResult.actualParticipantJobs, 1);
  assert.equal(feedbackResult.decisionPath, null);
  assert.equal(feedbackResult.problemPackagePath, null);
  assert.equal(feedbackResult.outcome.outcome, 'PARTICIPANT_FAILURE');
  assert.equal(hypothesisCalls, 0);
  assert.equal(solutionCalls, 0);
  assert.equal(reviewerCalls, 0);
  assert.equal(await readFile(feedbackResult.workflowOutcomePath, 'utf8').then(JSON.parse).then(value => value.route), 'DEFER');
  await assert.rejects(() => readFile(join(feedbackFixture.experimentRoot, 'decision.json')));

  const hypothesisFixture = await createPreflightFixture();
  solutionCalls = 0;
  reviewerCalls = 0;
  const hypothesisResult = await runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: hypothesisFixture.root,
    experimentRoot: hypothesisFixture.experimentRoot,
    fixedSourceRoot: hypothesisFixture.sourceRoot,
    participantMode: 'local-subagent',
    workspaceAgentParticipant: fakeWorkspaceAgentParticipant,
    dependencies: {
      preflightFixedSource: async () => hypothesisFixture.preflight,
      runExternalFeedback: async options => ({
        runRef: options.runRef,
        invocationRef: 'feedback-000001',
        phase0RunPath: hypothesisFixture.sourceRoot,
        feedbackDir: join(options.outRoot!, 'feedback-runs/cohort-run-000001'),
        humanReportPath: join(options.outRoot!, 'feedback-runs/cohort-run-000001/human-review.md'),
        observablePayloadHash: hypothesisFixture.preflight.observablePayloadHash,
        experimentRootHash: hypothesisFixture.preflight.experimentRootHash,
      }),
      runImprovementHypothesis: async options => {
        assert.ok(options.localParticipant);
        await writeLegacyFailureArtifact({
          experimentRoot: options.outRoot!,
          stage: 'IMPROVEMENT_HYPOTHESIS',
          errorKind: 'parse',
          participantProvider: 'codex-local-subagent',
          invocationRefFlavor: 'local',
        });
        throw new Error('legacy hypothesis runner failure');
      },
      runSolutionAgent: async () => {
        solutionCalls += 1;
        throw new Error('solution must not run');
      },
      runSolutionReviewer: async () => {
        reviewerCalls += 1;
        throw new Error('reviewer must not run');
      },
    },
  });
  assert.equal(hypothesisResult.status, 'participant_failure');
  assert.equal(hypothesisResult.outcome.failedStage, 'IMPROVEMENT_HYPOTHESIS');
  assert.equal(hypothesisResult.actualParticipantJobs, 2);
  assert.equal(hypothesisResult.outcome.outcome, 'PARTICIPANT_FAILURE');
  assert.equal(hypothesisResult.problemPackagePath, null);
  assert.equal(solutionCalls, 0);
  assert.equal(reviewerCalls, 0);
  await assert.rejects(() => readFile(join(hypothesisFixture.experimentRoot, 'decision.json')));

  const structuralFixture = await createPreflightFixture();
  await assert.rejects(() => runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: structuralFixture.root,
    experimentRoot: structuralFixture.experimentRoot,
    fixedSourceRoot: structuralFixture.sourceRoot,
    apiKey: 'test-key',
    workspaceAgentParticipant: fakeWorkspaceAgentParticipant,
    dependencies: {
      preflightFixedSource: async () => structuralFixture.preflight,
      runExternalFeedback: async options => ({
        runRef: options.runRef,
        invocationRef: 'feedback-000001',
        phase0RunPath: structuralFixture.sourceRoot,
        feedbackDir: join(options.outRoot!, 'feedback-runs/cohort-run-000001'),
        humanReportPath: join(options.outRoot!, 'feedback-runs/cohort-run-000001/human-review.md'),
        observablePayloadHash: structuralFixture.preflight.observablePayloadHash,
        experimentRootHash: structuralFixture.preflight.experimentRootHash,
      }),
      runImprovementHypothesis: async () => {
        throw new Error('structural hypothesis failure');
      },
    },
  }));
  await assert.rejects(() => readFile(join(structuralFixture.experimentRoot, 'workflow-outcome.json')));
}

export async function runSolutionAndReviewerFailureOrchestrationTests(): Promise<void> {
  for (const failedStage of ['SOLUTION', 'REVIEWER'] as const) {
    const fixture = await createPreflightFixture();
    const hypothesisDir = join(fixture.experimentRoot, 'hypothesis-runs/cohort-run-000001');
    let reviewerCalls = 0;
    const result = await runProblemAgnosticAgentSolutionLoop({
      repositoryRoot: fixture.root,
      experimentRoot: fixture.experimentRoot,
      fixedSourceRoot: fixture.sourceRoot,
      apiKey: 'test-key',
      workspaceAgentParticipant: fakeWorkspaceAgentParticipant,
      dependencies: {
        preflightFixedSource: async () => fixture.preflight,
        runExternalFeedback: async options => ({
          runRef: options.runRef,
          invocationRef: 'feedback-000001',
          phase0RunPath: fixture.sourceRoot,
          feedbackDir: join(options.outRoot!, 'feedback-runs/cohort-run-000001'),
          humanReportPath: join(options.outRoot!, 'feedback-runs/cohort-run-000001/human-review.md'),
          observablePayloadHash: fixture.preflight.observablePayloadHash,
          experimentRootHash: fixture.preflight.experimentRootHash,
        }),
        runImprovementHypothesis: async options => {
          await writeValidHypothesisArtifact(options.outRoot!);
          return {
            runRef: options.runRef,
            feedbackInvocationRef: 'feedback-000001',
            hypothesisInvocationRef: 'hypothesis-000001',
            hypothesisDir,
            humanReportPath: join(hypothesisDir, 'human-review.md'),
            experimentRootHash: fixture.preflight.experimentRootHash,
            observablePayloadHash: fixture.preflight.observablePayloadHash,
            feedbackHash: 'feedback-hash',
          };
        },
        runSolutionAgent: async input => {
          if (failedStage === 'SOLUTION') {
            await mkdir(input.destinationRoot, { recursive: true });
            await writeFile(join(input.destinationRoot, 'invocation.json'), '{}');
            await writeFile(join(input.destinationRoot, 'raw-output.txt'), 'invalid');
            await writeFile(join(input.destinationRoot, 'failure.json'), '{}');
            return {
              ok: false,
              errorKind: 'invalid_output',
              message: 'invalid solution output',
              invocationPath: join(input.destinationRoot, 'invocation.json'),
              rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
              failurePath: join(input.destinationRoot, 'failure.json'),
            };
          }
          return {
            ok: true,
            result: {
              schemaVersion: 'solution-work-v1',
              problemId: 'hypothesis-000001',
              status: 'OPTIONS',
              options: [{
                optionId: 'option-000001',
                proposedChange: 'A bounded configuration change.',
                rationale: 'It may address the observed problem.',
                repoRefs: [],
                artifactRefs: [],
                changeScope: 'configuration',
                expectedPlayerObservableDifference: 'A visible difference.',
                risks: [],
                unknowns: [],
              }],
              recommendedOptionId: 'option-000001',
              summary: 'One option.',
              repoRefs: [],
              artifactRefs: [],
            },
            invocationPath: join(input.destinationRoot, 'invocation.json'),
            rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
            resultPath: join(input.destinationRoot, 'result.json'),
          };
        },
        runSolutionReviewer: async input => {
          reviewerCalls += 1;
          await mkdir(input.destinationRoot, { recursive: true });
          await writeFile(join(input.destinationRoot, 'invocation.json'), '{}');
          await writeFile(join(input.destinationRoot, 'raw-output.txt'), 'invalid');
          await writeFile(join(input.destinationRoot, 'failure.json'), '{}');
          return {
            ok: false,
            errorKind: 'invalid_output',
            message: 'invalid reviewer output',
            invocationPath: join(input.destinationRoot, 'invocation.json'),
            rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
            failurePath: join(input.destinationRoot, 'failure.json'),
          };
        },
      },
    });
    assert.equal(result.status, 'participant_failure');
    assert.equal(result.outcome.failedStage, failedStage);
    assert.equal(result.outcome.route, 'DEFER');
    assert.equal(result.actualParticipantJobs, failedStage === 'SOLUTION' ? 3 : 4);
    assert.equal(failedStage === 'REVIEWER' ? reviewerCalls : 0, failedStage === 'REVIEWER' ? 1 : 0);
    await assert.rejects(() => readFile(join(fixture.experimentRoot, 'decision.json')));
  }
}

export async function runSolutionRecoveryParticipantJobAccountingTests(): Promise<void> {
  const fixture = await createPreflightFixture();
  await writeRecoveryWorkflowFixtures(fixture.root);
  const problemId = 'problem-hypothesis-000001';
  const solutionPayload = {
    schemaVersion: 'solution-work-v1',
    status: 'OPTIONS',
    problemId,
    options: [{
      optionId: 'option-000001',
      proposedChange: 'A bounded configuration change.',
      rationale: 'It may address the observed problem.',
      repoRefs: ['src/example.ts'],
      artifactRefs: ['source/observable-payload.json'],
      changeScope: 'configuration',
      expectedPlayerObservableDifference: 'A visible difference.',
      risks: [],
      unknowns: [],
    }],
    recommendedOptionId: 'option-000001',
    summary: 'One option.',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
  };
  let reviewerCalls = 0;
  const result = await runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: fixture.root,
    experimentRoot: fixture.experimentRoot,
    fixedSourceRoot: fixture.sourceRoot,
    apiKey: 'test-key',
    workspaceAgentParticipant: createRecoveryCapableSolutionParticipant(solutionPayload),
    dependencies: {
      preflightFixedSource: async () => fixture.preflight,
      runExternalFeedback: async options => ({
        runRef: options.runRef,
        invocationRef: 'feedback-000001',
        phase0RunPath: fixture.sourceRoot,
        feedbackDir: join(options.outRoot!, 'feedback-runs/cohort-run-000001'),
        humanReportPath: join(options.outRoot!, 'feedback-runs/cohort-run-000001/human-review.md'),
        observablePayloadHash: fixture.preflight.observablePayloadHash,
        experimentRootHash: fixture.preflight.experimentRootHash,
      }),
      runImprovementHypothesis: async options => {
        const hypothesisDir = await writeValidHypothesisArtifact(options.outRoot!);
        return {
          runRef: options.runRef,
          feedbackInvocationRef: 'feedback-000001',
          hypothesisInvocationRef: 'hypothesis-000001',
          hypothesisDir,
          humanReportPath: join(hypothesisDir, 'human-review.md'),
          experimentRootHash: fixture.preflight.experimentRootHash,
          observablePayloadHash: fixture.preflight.observablePayloadHash,
          feedbackHash: 'feedback-hash',
        };
      },
      runSolutionAgent,
      runSolutionReviewer: async input => {
        reviewerCalls += 1;
        return {
          ok: true,
          review: {
            schemaVersion: 'solution-review-v1',
            problemId,
            decision: 'ACCEPT_OPTION',
            acceptedOptionId: 'option-000001',
            scopeAssessment: 'config_only',
            assessment: 'The option fits the bounded configuration boundary.',
            repoRefs: [],
            artifactRefs: [],
            concerns: [],
          },
          invocationPath: join(input.destinationRoot, 'invocation.json'),
          rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
          reviewPath: join(input.destinationRoot, 'review.json'),
        };
      },
    },
  });
  assert.equal(result.status, 'completed');
  assert.equal(result.actualParticipantJobs, 4);
  assert.equal(reviewerCalls, 1);
  const decision = JSON.parse(await readFile(result.decisionPath!, 'utf8'));
  assert.equal(decision.inputs.budget.actualParticipantJobs, 4);
  assert.equal(decision.inputs.budget.retryCount, 0);
  const solutionInvocation = JSON.parse(await readFile(join(fixture.experimentRoot, 'solution-agent/invocation.json'), 'utf8'));
  assert.equal(solutionInvocation.jobNumber, 3);
  assert.equal(await readFile(join(fixture.experimentRoot, 'solution-agent/terminal-attempt-1.txt'), 'utf8'), JSON.stringify(solutionPayload));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  Promise.all([
    runMissingFixedSourceBindingTests(),
    runMissingWorkspaceAgentBindingTests(),
    runManifestAuthoritativeSourceBindingTests(),
    runProblemAgnosticAgentSolutionLoopTests(),
    runSuccessfulOptionsReviewerOrchestrationTests(),
    runAuthorityRefPreflightTests(),
    runLocalParticipantModeInsufficientEvidenceTests(),
    runInsufficientEvidenceDoesNotMaterializeReviewerWorkspaceTests(),
    runParticipantFailureOrchestrationTests(),
    runSolutionAndReviewerFailureOrchestrationTests(),
    runSolutionRecoveryParticipantJobAccountingTests(),
  ])
    .then(() => console.log('problemAgnosticAgentSolutionLoop.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
