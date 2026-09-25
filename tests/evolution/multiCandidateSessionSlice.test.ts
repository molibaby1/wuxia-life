import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { runMultiCandidateSessionSlice } from '../../scripts/evolution/runMultiCandidateSessionSlice';
import { PHASE0_REQUIRED_SEALED_ARTIFACTS, canonicalJson, sealPhase0Run, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import { buildProblemPackage } from '../../scripts/evolution/problemAgnosticSolution/buildProblemPackage';
import { retainHumanFollowupWorkItem } from '../../scripts/evolution/humanFollowup/retainHumanFollowupWorkItem';
import { buildCandidatePoolV1, parseCandidatePoolV1 } from '../../scripts/evolution/candidatePoolContract';
import { activateCandidate } from '../../scripts/evolution/candidatePoolState';
import { retainCandidateLaneArtifacts, retainSourceAnalysisArtifacts, retainSourceEpochAnchor } from '../../scripts/evolution/candidateSessionStore';
import { readDurableMultiCandidateSessionManifest, writeMultiCandidateSessionManifestAtomic } from '../../scripts/evolution/candidateSessionStore';
import type { CompletedSourceCandidateAnalysisResult, SourceCandidateAnalysisFailureResult } from '../../scripts/evolution/runSourceCandidateAnalysis';
import { buildMultiCandidateSessionManifestV1 } from '../../scripts/evolution/multiCandidateSessionManifestContract';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { buildMultiCandidateOperationalRunReport } from '../../scripts/evolution/reporting/buildMultiCandidateOperationalRunReport';
import { archiveMultiCandidateSessionReport } from '../../scripts/evolution/reporting/archiveMultiCandidateSessionReport';
import { retainMultiCandidateSessionEvidence } from '../../scripts/evolution/evidence/retainMultiCandidateSessionEvidence';
import { buildCandidateLaneFailureV2 } from '../../scripts/evolution/candidateLaneFailureContract';
import { validateSolutionDecision } from '../../src/evolution/solutionDecisionContract';
import { buildPreschoolAutonomousAuthoringContractPacket } from '../../scripts/evolution/autonomousAuthoring/buildPreschoolContractPacket';

const participant: WorkspaceAgentParticipantOptions = { executable: 'test-participant', buildArgs: () => [] };
const hypotheses = [1, 2, 3].map(index => ({ hypothesisId: `hypothesis-${String(index).padStart(6, '0')}`, hypothesis: `H${index}`, observedBasis: 'Observed.', feedbackRefs: ['overallImpression'], evidenceRefs: [], unknowns: ['Unknown.'], productSignificance: 'Significant.' }));

type CandidateIdentity = { candidateRef: string; hypothesisId: string; sourceIndex: number };

function localLaneFailure(candidate: CandidateIdentity, actualParticipantJobs: 1 | 2 = 1, stage: 'SOLUTION' | 'REVIEWER' = 'SOLUTION') {
  const failure = buildCandidateLaneFailureV2({
    candidateRef: candidate.candidateRef,
    hypothesisId: candidate.hypothesisId,
    sourceIndex: candidate.sourceIndex,
    stage,
    actualParticipantJobs,
    failureOrigin: 'OUTPUT_REFERENCE',
    failureReason: 'MISSING_TARGET',
    participantErrorKind: 'invalid_output',
    message: 'candidate-local output reference is missing',
  });
  return {
    status: 'participant_failure' as const,
    candidateRef: candidate.candidateRef,
    hypothesisId: candidate.hypothesisId,
    sourceIndex: candidate.sourceIndex,
    workflowOutcomeRef: 'workflow-outcome.json',
    actualParticipantJobs,
    failureStage: stage,
    failure,
  };
}

function failClosedLaneFailure(candidate: CandidateIdentity, actualParticipantJobs: 1 | 2 = 1) {
  const failure = buildCandidateLaneFailureV2({
    candidateRef: candidate.candidateRef,
    hypothesisId: candidate.hypothesisId,
    sourceIndex: candidate.sourceIndex,
    stage: 'SOLUTION',
    actualParticipantJobs,
    failureOrigin: 'PARTICIPANT_RUNTIME',
    failureReason: 'TIMEOUT',
    participantErrorKind: 'timeout',
    message: 'participant timed out',
  });
  return {
    status: 'participant_failure' as const,
    candidateRef: candidate.candidateRef,
    hypothesisId: candidate.hypothesisId,
    sourceIndex: candidate.sourceIndex,
    workflowOutcomeRef: 'workflow-outcome.json',
    actualParticipantJobs,
    failureStage: 'SOLUTION' as const,
    failure,
  };
}

function localContinuationFailure(candidate: CandidateIdentity, actualParticipantJobs: 1 | 2 = 1) {
  const failure = buildCandidateLaneFailureV2({
    candidateRef: candidate.candidateRef,
    hypothesisId: candidate.hypothesisId,
    sourceIndex: candidate.sourceIndex,
    stage: 'SOLUTION_REVISION',
    actualParticipantJobs,
    failureOrigin: 'OUTPUT_REFERENCE',
    failureReason: 'MISSING_TARGET',
    participantErrorKind: 'invalid_output',
    message: 'candidate-local continuation output reference is missing',
  });
  return {
    status: 'participant_failure' as const,
    participantJobs: actualParticipantJobs,
    continuationRef: 'review-continuation-000001' as const,
    failureRef: 'review-continuation-000001/continuation.json',
    workflowOutcomeRef: 'workflow-outcome.json' as const,
    failure,
  };
}

function buildContinuationBaseDecision(hypothesisId: string) {
  return validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId: `problem-${hypothesisId}`,
    route: 'DEFER_MORE_WORK_REQUESTED',
    reasonCode: 'REVIEW_REQUEST_MORE_WORK',
    inputs: {
      solutionStatus: 'OPTIONS', reviewerDecision: 'REQUEST_MORE_WORK',
      solutionScope: 'configuration', reviewScope: 'config_only',
      permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
      budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
}

function failClosedContinuationFailure(candidate: CandidateIdentity, actualParticipantJobs: 1 | 2 = 1) {
  const failure = buildCandidateLaneFailureV2({
    candidateRef: candidate.candidateRef,
    hypothesisId: candidate.hypothesisId,
    sourceIndex: candidate.sourceIndex,
    stage: 'SOLUTION_REVISION',
    actualParticipantJobs,
    failureOrigin: 'PARTICIPANT_RUNTIME',
    failureReason: 'TIMEOUT',
    participantErrorKind: 'timeout',
    message: 'continuation participant timed out',
  });
  return {
    status: 'participant_failure' as const,
    participantJobs: actualParticipantJobs,
    continuationRef: 'review-continuation-000001' as const,
    failureRef: 'review-continuation-000001/continuation.json',
    workflowOutcomeRef: 'workflow-outcome.json' as const,
    failure,
  };
}

function skipDecision(hypothesisId: string) {
  return validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId: `problem-${hypothesisId}`,
    route: 'SKIP',
    reasonCode: 'NO_PROPOSAL',
    inputs: {
      solutionStatus: 'NO_PROPOSAL', reviewerDecision: null,
      solutionScope: null, reviewScope: null,
      permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
      budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
}

export async function runMultiCandidateSessionSliceTests(): Promise<void> {
  const autonomousAuthoringContractPacket = await buildPreschoolAutonomousAuthoringContractPacket({
    repositoryRoot: process.cwd(),
  });
  const root = await mkdtemp(join(tmpdir(), 'candidate-session-slice-'));
  const sourceRoot = join(root, 'sealed-source');
  await mkdir(sourceRoot, { recursive: true });
  for (const artifact of PHASE0_REQUIRED_SEALED_ARTIFACTS) { await mkdir(join(sourceRoot, artifact, '..'), { recursive: true }); await writeFile(join(sourceRoot, artifact), '{}'); }
  const sealed = await sealPhase0Run(sourceRoot, 'cohort-run-000001');
  const analysis: CompletedSourceCandidateAnalysisResult = { status: 'completed', sourceRunRef: 'cohort-run-000001', sourceRoot, analysisRoot: join(root, 'analysis'), sourceExperimentRootHash: sealed.experimentRootHash, sourceFingerprintSha256: 'b'.repeat(64), authoritativeFingerprintSha256: 'c'.repeat(64), observablePayloadRef: 'source/observable-payload.json', externalFeedbackRef: 'feedback-runs/cohort-run-000001/feedback.json', improvementHypothesisRef: 'hypothesis-runs/cohort-run-000001/hypotheses.json', feedbackInvocationRef: 'feedback-000001', hypothesisInvocationRef: 'hypothesis-000001', hypotheses, noProblemAssessment: null, actualParticipantJobs: 2 };
  const calls: string[] = [];
  const humanFollowupRefs: string[] = [];
  const scopedAnalysis = (repositoryRoot: string, overrides: Partial<CompletedSourceCandidateAnalysisResult> = {}): CompletedSourceCandidateAnalysisResult => ({
    ...analysis,
    ...overrides,
    analysisRoot: join(repositoryRoot, 'analysis'),
  });
  const base = { repositoryRoot: root, logicalSessionId: 'logical-session-000001', participantBindingId: 'CODEX_CURRENT', participant, repositoryBaseline: { branch: 'dev', headSha: 'd'.repeat(40), workingTreeFingerprint: 'e'.repeat(64) }, initialSourceRoot: sourceRoot, dependencies: { now: () => '2026-09-15T00:00:00.000Z', runSourceAnalysis: async () => analysis, runCandidateLane: async ({ candidate, laneRoot }: { candidate: { candidateRef: string; hypothesisId: string; sourceIndex: number }; laneRoot: string }) => { calls.push(candidate.hypothesisId); const decision = validateSolutionDecision({ schemaVersion: 'solution-decision-v1', problemId: `problem-${candidate.hypothesisId}`, route: 'SKIP', reasonCode: 'NO_PROPOSAL', inputs: { solutionStatus: 'NO_PROPOSAL', reviewerDecision: null, solutionScope: null, reviewScope: null, permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } } }); await mkdir(laneRoot, { recursive: true }); await writeFile(join(laneRoot, 'decision.json'), JSON.stringify(decision)); return { status: 'completed' as const, candidateRef: candidate.candidateRef, hypothesisId: candidate.hypothesisId, sourceIndex: candidate.sourceIndex, candidateActivationPath: 'candidate-activation.json', problemPackagePath: 'problem-package.json', causalAttributionPath: 'diagnostic/causal-attribution.json', decisionPath: 'decision.json', baseDecisionPath: 'decision.json', humanReviewPackagePath: 'human-review-package.md', actualParticipantJobs: 1 as const, decision, solutionInvocationRef: 'solution', reviewerInvocationRef: null, problemPackage: {} as never }; } } };

  function shadowDecisionFor(candidate: CandidateIdentity) {
    return validateSolutionDecision({
      schemaVersion: 'solution-decision-v1',
      problemId: `problem-${candidate.hypothesisId}`,
      route: 'READY_FOR_SHADOW_AUTHORING',
      reasonCode: 'ACCEPTED_AUTONOMOUS_AUTHORING_SCOPE',
      inputs: {
        solutionStatus: 'OPTIONS',
        reviewerDecision: 'ACCEPT_OPTION',
        solutionScope: 'program',
        reviewScope: 'code_required',
        executionAuthorityAssessment: 'WITHIN_CURRENT_AUTHORITY',
        autonomousAuthoringRequested: true,
        autonomousAuthoringAdmissionStatus: 'ELIGIBLE',
        permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
        budget: { actualParticipantJobs: 2, maxParticipantJobs: 4, retryCount: 0 },
      },
    });
  }

  async function shadowLaneResult(candidate: CandidateIdentity, laneRoot: string) {
    const decision = shadowDecisionFor(candidate);
    await mkdir(laneRoot, { recursive: true });
    await writeFile(join(laneRoot, 'decision.json'), JSON.stringify(decision));
    await writeFile(join(laneRoot, 'base-solution.json'), JSON.stringify({ marker: 'base-solution' }));
    await writeFile(join(laneRoot, 'base-review.json'), JSON.stringify({ marker: 'base-review' }));
    await writeFile(join(laneRoot, 'effective-solution.json'), JSON.stringify({ marker: 'effective-solution' }));
    await writeFile(join(laneRoot, 'effective-review.json'), JSON.stringify({ marker: 'effective-review' }));
    await writeFile(join(laneRoot, 'effective-admission.json'), JSON.stringify({ marker: 'effective-admission' }));
    return {
      status: 'completed' as const,
      candidateRef: candidate.candidateRef,
      hypothesisId: candidate.hypothesisId,
      sourceIndex: candidate.sourceIndex,
      candidateActivationPath: 'candidate-activation.json',
      problemPackagePath: 'problem-package.json',
      causalAttributionPath: 'diagnostic/causal-attribution.json',
      decisionPath: 'decision.json',
      baseDecisionPath: 'decision.json',
      humanReviewPackagePath: 'human-review-package.md',
      effectiveSolutionPath: 'effective-solution.json',
      effectiveReviewPath: 'effective-review.json',
      autonomousAuthoringAdmissionPath: 'effective-admission.json',
      actualParticipantJobs: 2 as const,
      decision,
      solutionInvocationRef: 'solution',
      reviewerInvocationRef: 'reviewer',
      problemPackage: {} as never,
    };
  }

  function shadowAuthoringStubs(repositoryRoot: string, options: {
    executorStatus?: 'completed' | 'failed';
    executorFailure?: string;
    authoritativeMutation?: boolean;
    verificationFailure?: string;
    verifierThrows?: boolean;
  } = {}) {
    const patch = Buffer.from('exact verified promotion patch\n');
    const calls = { executor: 0, verifier: 0, packageBuilder: 0 };
    return {
      calls,
      dependencies: {
        runShadowAuthoringExecution: async (input: { artifactRoot: string; solution: { marker?: string }; review: { marker?: string }; admission: { marker?: string }; invocationRef: string }) => {
          calls.executor += 1;
          assert.equal(input.solution.marker, 'effective-solution');
          assert.equal(input.review.marker, 'effective-review');
          assert.equal(input.admission.marker, 'effective-admission');
          await mkdir(input.artifactRoot, { recursive: true });
          await writeFile(join(input.artifactRoot, 'invocation.json'), JSON.stringify({ invocationRef: input.invocationRef }));
          await writeFile(join(input.artifactRoot, 'raw-output.txt'), '{"status":"completed"}');
          await writeFile(join(input.artifactRoot, 'participant-binding.json'), '{}');
          await writeFile(join(input.artifactRoot, 'participant-prompt.txt'), 'accepted Cards');
          await writeFile(join(input.artifactRoot, 'execution-trace.json'), '{}');
          await writeFile(join(input.artifactRoot, 'executor-result.json'), JSON.stringify({ status: options.executorStatus ?? 'completed' }));
          return {
            status: options.executorStatus ?? 'completed',
            invocationRef: input.invocationRef,
            artifactRoot: input.artifactRoot,
            preparedWorkspace: { workspaceRoot: join(repositoryRoot, 'shadow-workspace') },
            participantResult: { status: options.executorStatus ?? 'completed' },
            failure: options.executorFailure ?? null,
            rawOutput: '{"status":"completed"}',
            stderr: '',
            executionTrace: {},
            canonicalChanges: [{ path: 'src/data/lines/preschool-passive-spine.json', kind: 'modified' }],
            promotionPatch: patch,
            promotionPatchSha256: sha256Hex(patch),
            authoritativeFingerprintBefore: 'a'.repeat(64),
            authoritativeFingerprintAfter: options.authoritativeMutation ? 'b'.repeat(64) : 'a'.repeat(64),
            proposalSha256: 'c'.repeat(64),
            reviewSha256: 'd'.repeat(64),
            admissionSha256: 'e'.repeat(64),
            participantJobs: 1 as const,
          };
        },
        verifyPreschoolShadowAuthoring: async (input: { candidateBaselineFingerprintSha256: string; authoritativeFingerprintBefore: string }) => {
          calls.verifier += 1;
          assert.equal(input.candidateBaselineFingerprintSha256, 'e'.repeat(64));
          assert.equal(input.authoritativeFingerprintBefore, 'a'.repeat(64));
          if (options.verifierThrows) throw new Error('Host verifier infrastructure unavailable');
          const failed = options.verificationFailure !== undefined;
          return {
            schemaVersion: 'preschool-shadow-authoring-verification-v1',
            status: failed ? 'SHADOW_AUTHORING_FAILED' : 'SHADOW_AUTHORING_VERIFIED',
            checks: {
              authorityIntegrity: 'PASS',
              mechanicalConformance: failed ? 'FAIL' : 'PASS',
              semanticConformance: 'PASS',
              redGreenRegression: 'PASS',
              adjacentRegression: 'PASS',
              evidenceBoundedCompletion: 'PASS',
            },
            failures: failed ? [options.verificationFailure] : [],
            promotionPatch: patch,
            patchSha256: sha256Hex(patch),
          };
        },
        buildShadowAuthoringPromotionPackage: () => {
          calls.packageBuilder += 1;
          return { packageJson: { schemaVersion: 'shadow-authoring-promotion-package-v1' }, markdown: '# Promotion package' };
        },
      },
    };
  }

  function sourceAnalysisFailure(sourceRunRef: string, stage: 'EXTERNAL_FEEDBACK' | 'IMPROVEMENT_HYPOTHESIS', actualParticipantJobs: 1 | 2): SourceCandidateAnalysisFailureResult {
    return { status: 'participant_failure', sourceRunRef, sourceRoot, stage, actualParticipantJobs, error: new Error(`${stage} participant failed`) };
  }

  async function assertSourceAnalysisFailureFinalized(input: {
    caseRoot: string;
    logicalSessionId: string;
    hostSliceId: string;
    sourceRunRef: string;
    failure: SourceCandidateAnalysisFailureResult;
    initialSourceRoot?: string;
    expectedBudgetParticipantJobs: number;
    seedFailureArtifact?: boolean;
  }): Promise<void> {
    let candidateLaneCalls = 0;
    const result = await runMultiCandidateSessionSlice({
      ...base,
      mode: input.initialSourceRoot === undefined ? 'RESUME_SESSION' : 'START_NEW_SESSION',
      repositoryRoot: input.caseRoot,
      logicalSessionId: input.logicalSessionId,
      hostSliceId: input.hostSliceId,
      ...(input.initialSourceRoot === undefined ? {} : { initialSourceRoot: input.initialSourceRoot }),
      dependencies: {
        ...base.dependencies,
        runSourceAnalysis: async ({ analysisRoot }) => {
          if (input.seedFailureArtifact) {
            const failureDir = join(analysisRoot, 'hypothesis-runs', input.sourceRunRef);
            await mkdir(failureDir, { recursive: true });
            await writeFile(join(failureDir, 'invocation.json'), JSON.stringify({ status: 'failed', errorKind: 'invalid_reference' }));
          }
          return input.failure;
        },
        runCandidateLane: async () => { candidateLaneCalls += 1; throw new Error('candidate lane must not run'); },
      },
    });
    assert.equal(result.sessionState, 'FAILED');
    assert.equal(candidateLaneCalls, 0);
    const manifest = await readDurableMultiCandidateSessionManifest(input.caseRoot, input.logicalSessionId);
    assert.equal(manifest.sessionState, 'FAILED');
    assert.equal(manifest.pauseOrStopReason, 'SOURCE_ANALYSIS_PARTICIPANT_FAILURE');
    assert.equal(manifest.hostSlices.at(-1)!.state, 'FAILED');
    assert.notEqual(manifest.hostSlices.at(-1)!.endedAt, null);
    assert.equal(manifest.hostSlices.at(-1)!.participantJobs, input.failure.actualParticipantJobs);
    assert.equal(manifest.budgetAccounting.participantJobs, input.expectedBudgetParticipantJobs);
    assert.ok(manifest.failureRef);
    const failurePath = join(input.caseRoot, 'artifacts/evolution/sessions', input.logicalSessionId, manifest.failureRef!);
    const failureRecord = JSON.parse(await readFile(failurePath, 'utf8')) as { stage?: string; actualParticipantJobs?: number; sourceRunRef?: string; status?: string; errorKind?: string };
    if (input.seedFailureArtifact) {
      assert.equal(manifest.failureRef, `source-epochs/${manifest.currentSourceEpochRef}/source-analysis/hypothesis-runs/${input.sourceRunRef}/invocation.json`);
      assert.equal(failureRecord.status, 'failed');
      assert.equal(failureRecord.errorKind, 'invalid_reference');
    } else {
      assert.equal(failureRecord.stage, input.failure.stage);
      assert.equal(failureRecord.actualParticipantJobs, input.failure.actualParticipantJobs);
      assert.equal(failureRecord.sourceRunRef, input.sourceRunRef);
    }
    const epoch = manifest.sourceEpochs.find(item => item.sourceEpochRef === manifest.currentSourceEpochRef)!;
    assert.equal(epoch.sourceRunRef, input.sourceRunRef);
    assert.equal(epoch.poolRef, null);
    assert.deepEqual(epoch.candidateCounts, { total: 0, pending: 0, active: 0, completed: 0, superseded: 0, interrupted: 0 });
    assert.equal(manifest.limits.semanticRetryCount, 0);
  }

  const improvementHypothesisFailureRoot = await mkdtemp(join(tmpdir(), 'candidate-session-source-analysis-failure-'));
  await assertSourceAnalysisFailureFinalized({
    caseRoot: improvementHypothesisFailureRoot,
    logicalSessionId: 'logical-session-source-analysis-failure',
    hostSliceId: 'host-slice-000001',
    sourceRunRef: 'cohort-run-000001',
    failure: sourceAnalysisFailure('cohort-run-000001', 'IMPROVEMENT_HYPOTHESIS', 2),
    initialSourceRoot: sourceRoot,
    expectedBudgetParticipantJobs: 2,
    seedFailureArtifact: true,
  });

  const externalFeedbackFailureRoot = await mkdtemp(join(tmpdir(), 'candidate-session-external-feedback-failure-'));
  await assertSourceAnalysisFailureFinalized({
    caseRoot: externalFeedbackFailureRoot,
    logicalSessionId: 'logical-session-external-feedback-failure',
    hostSliceId: 'host-slice-000001',
    sourceRunRef: 'cohort-run-000001',
    failure: sourceAnalysisFailure('cohort-run-000001', 'EXTERNAL_FEEDBACK', 1),
    initialSourceRoot: sourceRoot,
    expectedBudgetParticipantJobs: 1,
  });

  const sourceBFailureRoot = await mkdtemp(join(tmpdir(), 'candidate-session-source-b-analysis-failure-'));
  const sourceBRunRef = 'cohort-run-000002';
  const sourceBSeal = sealed;
  await retainSourceEpochAnchor({ repositoryRoot: sourceBFailureRoot, logicalSessionId: 'logical-session-source-b-analysis-failure', sourceEpochRef: 'source-epoch-000002', sourceRoot, sourceRunRef: sourceBRunRef, sourceFingerprintSha256: 'f'.repeat(64), sourceExperimentRootHash: sourceBSeal.experimentRootHash });
  await writeMultiCandidateSessionManifestAtomic(sourceBFailureRoot, buildMultiCandidateSessionManifestV1({
    logicalSessionId: 'logical-session-source-b-analysis-failure',
    sessionState: 'PAUSED',
    pauseOrStopReason: 'SOURCE_B_ANALYSIS_PENDING',
    sourceEpochs: [
      { sourceEpochRef: 'source-epoch-000001', sourceRunRef: 'cohort-run-000001', poolRef: 'source-epochs/source-epoch-000001/candidate-pool.json', poolStatus: 'SUPERSEDED', lifecycle: 'SUPERSEDED', candidateCounts: { total: 0, pending: 0, active: 0, completed: 0, superseded: 0, interrupted: 0 }, dispositionCounts: {} },
      { sourceEpochRef: 'source-epoch-000002', sourceRunRef: sourceBRunRef, poolRef: null, poolStatus: 'PROCESSING', lifecycle: 'ANALYSIS_PENDING', candidateCounts: { total: 0, pending: 0, active: 0, completed: 0, superseded: 0, interrupted: 0 }, dispositionCounts: {} },
    ],
    currentSourceEpochRef: 'source-epoch-000002',
    hostSlices: [{ hostSliceId: 'host-slice-000001', startedAt: '2026-09-15T00:00:00.000Z', endedAt: '2026-09-15T00:01:00.000Z', participantJobs: 2, state: 'PAUSED', reason: 'SOURCE_B_ANALYSIS_PENDING' }],
    sourceTransitionCount: 1,
    failureRef: null,
    repositoryBaseline: base.repositoryBaseline,
    participantBindingId: base.participantBindingId,
  }));
  await assertSourceAnalysisFailureFinalized({
    caseRoot: sourceBFailureRoot,
    logicalSessionId: 'logical-session-source-b-analysis-failure',
    hostSliceId: 'host-slice-000002',
    sourceRunRef: sourceBRunRef,
    failure: sourceAnalysisFailure(sourceBRunRef, 'IMPROVEMENT_HYPOTHESIS', 2),
    expectedBudgetParticipantJobs: 4,
  });
  const first = await runMultiCandidateSessionSlice({ ...base, mode: 'START_NEW_SESSION', hostSliceId: 'host-slice-000001' });
  assert.equal(first.sessionState, 'COMPLETED');
  assert.deepEqual(calls, ['hypothesis-000001', 'hypothesis-000002', 'hypothesis-000003']);
  const pool = parseCandidatePoolV1(JSON.parse(await readFile(join(root, 'artifacts/evolution/sessions/logical-session-000001/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(pool.status, 'EXHAUSTED');

  async function prepareDurableLocalFailureCase(logicalSessionId: string, caseHypotheses: typeof hypotheses, continuation = false): Promise<{ caseRoot: string; caseAnalysis: CompletedSourceCandidateAnalysisResult; activeCandidate: CandidateIdentity }> {
    const caseRoot = await mkdtemp(join(tmpdir(), `candidate-session-reconcile-${logicalSessionId}-`));
    const caseAnalysis = scopedAnalysis(caseRoot, { hypotheses: caseHypotheses });
    await runMultiCandidateSessionSlice({
      ...base,
      mode: 'START_NEW_SESSION',
      repositoryRoot: caseRoot,
      logicalSessionId,
      initialSourceRoot: sourceRoot,
      hostSliceId: 'host-slice-000001',
      dependencies: {
        ...base.dependencies,
        runSourceAnalysis: async () => caseAnalysis,
      },
    });
    await rm(join(caseRoot, 'artifacts/evolution/sessions', logicalSessionId, 'source-epochs/source-epoch-000001/candidates'), { recursive: true, force: true });
    const durablePoolPath = join(caseRoot, 'artifacts/evolution/sessions', logicalSessionId, 'source-epochs/source-epoch-000001/candidate-pool.json');
    const rebuiltPool = buildCandidatePoolV1({
      logicalSessionId,
      sourceEpochId: 'source-epoch-000001',
      sourceRunRef: caseAnalysis.sourceRunRef,
      sourceFingerprintSha256: caseAnalysis.sourceFingerprintSha256,
      sealedSourceRef: 'source-epochs/source-epoch-000001',
      hypothesisSet: { artifactRef: caseAnalysis.improvementHypothesisRef, hypotheses: caseHypotheses },
      baseline: { ...base.repositoryBaseline, participantBinding: base.participantBindingId },
    });
    const activePool = activateCandidate(rebuiltPool, rebuiltPool.candidates[0]!.candidateRef);
    await writeFile(durablePoolPath, canonicalJson(activePool));
    const stagedLane = join(caseRoot, 'staged-local-failure');
    await mkdir(stagedLane, { recursive: true });
    const failure = continuation ? localContinuationFailure(activePool.candidates[0]!) : localLaneFailure(activePool.candidates[0]!);
    await writeFile(join(stagedLane, failure.workflowOutcomeRef), JSON.stringify(failure.failure));
    const retainedPaths = [failure.workflowOutcomeRef];
    if (continuation) {
      await writeFile(join(stagedLane, 'decision.json'), JSON.stringify(buildContinuationBaseDecision(activePool.candidates[0]!.hypothesisId)));
      retainedPaths.push('decision.json');
    }
    await retainCandidateLaneArtifacts({
      repositoryRoot: caseRoot,
      logicalSessionId,
      sourceEpochRef: 'source-epoch-000001',
      sourceRoot: stagedLane,
      candidateRef: activePool.candidates[0]!.candidateRef,
      relativePaths: retainedPaths,
    });
    return { caseRoot, caseAnalysis, activeCandidate: activePool.candidates[0]! };
  }

  const resumeLocalCase = await prepareDurableLocalFailureCase('logical-session-resume-local', hypotheses.slice(0, 2));
  const resumedCalls: string[] = [];
  const resumedLocal = await runMultiCandidateSessionSlice({
    ...base,
    mode: 'RESUME_SESSION',
    repositoryRoot: resumeLocalCase.caseRoot,
    logicalSessionId: 'logical-session-resume-local',
    hostSliceId: 'host-slice-000002',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => { throw new Error('resume must not rerun source analysis'); },
      loadSourceAnalysis: async () => resumeLocalCase.caseAnalysis,
      runCandidateLane: async input => {
        resumedCalls.push(input.candidate.hypothesisId);
        return base.dependencies.runCandidateLane!(input);
      },
    },
  });
  assert.equal(resumedLocal.sessionState, 'COMPLETED');
  assert.deepEqual(resumedCalls, ['hypothesis-000002']);
  const resumedLocalPool = parseCandidatePoolV1(JSON.parse(await readFile(join(resumeLocalCase.caseRoot, 'artifacts/evolution/sessions/logical-session-resume-local/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(resumedLocalPool.status, 'EXHAUSTED');
  assert.deepEqual(resumedLocalPool.candidates.map(candidate => candidate.processingState), ['INTERRUPTED', 'COMPLETED']);

  const resumeExhaustedCase = await prepareDurableLocalFailureCase('logical-session-resume-exhausted', hypotheses.slice(0, 1));
  let exhaustedResumeCalls = 0;
  const resumedExhausted = await runMultiCandidateSessionSlice({
    ...base,
    mode: 'RESUME_SESSION',
    repositoryRoot: resumeExhaustedCase.caseRoot,
    logicalSessionId: 'logical-session-resume-exhausted',
    hostSliceId: 'host-slice-000002',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => { throw new Error('resume must not rerun source analysis'); },
      loadSourceAnalysis: async () => resumeExhaustedCase.caseAnalysis,
      runCandidateLane: async () => {
        exhaustedResumeCalls += 1;
        throw new Error('exhausted local failure must not admit another candidate');
      },
    },
  });
  assert.equal(resumedExhausted.sessionState, 'COMPLETED');
  assert.equal(exhaustedResumeCalls, 0);
  const resumedExhaustedPool = parseCandidatePoolV1(JSON.parse(await readFile(join(resumeExhaustedCase.caseRoot, 'artifacts/evolution/sessions/logical-session-resume-exhausted/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(resumedExhaustedPool.status, 'EXHAUSTED');
  assert.equal(resumedExhaustedPool.candidates[0]!.processingState, 'INTERRUPTED');

  const resumeContinuationCase = await prepareDurableLocalFailureCase('logical-session-resume-continuation', hypotheses.slice(0, 2), true);
  const resumedContinuationCalls: string[] = [];
  const resumedContinuation = await runMultiCandidateSessionSlice({
    ...base,
    mode: 'RESUME_SESSION',
    repositoryRoot: resumeContinuationCase.caseRoot,
    logicalSessionId: 'logical-session-resume-continuation',
    hostSliceId: 'host-slice-000002',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => { throw new Error('resume must not rerun source analysis'); },
      loadSourceAnalysis: async () => resumeContinuationCase.caseAnalysis,
      runCandidateLane: async input => {
        resumedContinuationCalls.push(input.candidate.hypothesisId);
        return base.dependencies.runCandidateLane!(input);
      },
    },
  });
  assert.equal(resumedContinuation.sessionState, 'COMPLETED');
  assert.deepEqual(resumedContinuationCalls, ['hypothesis-000002']);
  const resumedContinuationPool = parseCandidatePoolV1(JSON.parse(await readFile(join(resumeContinuationCase.caseRoot, 'artifacts/evolution/sessions/logical-session-resume-continuation/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(resumedContinuationPool.status, 'EXHAUSTED');
  assert.deepEqual(resumedContinuationPool.candidates.map(candidate => candidate.processingState), ['INTERRUPTED', 'COMPLETED']);

  const localFirstRoot = await mkdtemp(join(tmpdir(), 'candidate-session-local-first-'));
  let localFirstHflCalls = 0;
  const localFirst = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: localFirstRoot,
    logicalSessionId: 'logical-session-local-first',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => scopedAnalysis(localFirstRoot, { hypotheses: hypotheses.slice(0, 2) }),
      runCandidateLane: async ({ candidate, laneRoot }: CandidateIdentity & { laneRoot: string }) => {
        if (candidate.sourceIndex === 0) {
          await mkdir(laneRoot, { recursive: true });
          const failure = localLaneFailure(candidate);
          await writeFile(join(laneRoot, failure.workflowOutcomeRef), JSON.stringify(failure.failure));
          return failure;
        }
        return base.dependencies.runCandidateLane!({ candidate, laneRoot });
      },
      retainHumanFollowup: async () => {
        localFirstHflCalls += 1;
        return { itemPath: join(localFirstRoot, 'unexpected-hfl-item.json'), item: {} as never, created: true };
      },
    },
  });
  assert.equal(localFirst.sessionState, 'COMPLETED');
  const localFirstPool = parseCandidatePoolV1(JSON.parse(await readFile(join(localFirstRoot, 'artifacts/evolution/sessions/logical-session-local-first/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(localFirstPool.status, 'EXHAUSTED');
  assert.deepEqual(localFirstPool.candidates.map(candidate => candidate.processingState), ['INTERRUPTED', 'COMPLETED']);
  assert.equal(localFirstPool.candidates[0]!.interruptionRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/workflow-outcome.json');
  assert.equal(await readFile(join(localFirstRoot, 'artifacts/evolution/sessions/logical-session-local-first/source-epochs/source-epoch-000001/candidates/hypothesis-000001/workflow-outcome.json'), 'utf8').then(() => true), true);
  assert.equal(localFirstHflCalls, 0);

  const lastLocalRoot = await mkdtemp(join(tmpdir(), 'candidate-session-last-local-'));
  const lastLocal = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: lastLocalRoot,
    logicalSessionId: 'logical-session-last-local',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => scopedAnalysis(lastLocalRoot, { hypotheses: [hypotheses[0]!] }),
      runCandidateLane: async ({ candidate, laneRoot }: CandidateIdentity & { laneRoot: string }) => {
        await mkdir(laneRoot, { recursive: true });
        const failure = localLaneFailure(candidate);
        await writeFile(join(laneRoot, failure.workflowOutcomeRef), JSON.stringify(failure.failure));
        return failure;
      },
    },
  });
  assert.equal(lastLocal.sessionState, 'COMPLETED');
  const lastLocalPool = parseCandidatePoolV1(JSON.parse(await readFile(join(lastLocalRoot, 'artifacts/evolution/sessions/logical-session-last-local/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(lastLocalPool.status, 'EXHAUSTED');
  assert.equal(lastLocalPool.candidates[0]!.processingState, 'INTERRUPTED');

  const allLocalRoot = await mkdtemp(join(tmpdir(), 'candidate-session-all-local-'));
  const allLocal = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: allLocalRoot,
    logicalSessionId: 'logical-session-all-local',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => scopedAnalysis(allLocalRoot, { hypotheses }),
      runCandidateLane: async ({ candidate, laneRoot }: CandidateIdentity & { laneRoot: string }) => {
        await mkdir(laneRoot, { recursive: true });
        const failure = localLaneFailure(candidate);
        await writeFile(join(laneRoot, failure.workflowOutcomeRef), JSON.stringify(failure.failure));
        return failure;
      },
    },
  });
  assert.equal(allLocal.sessionState, 'COMPLETED');
  const allLocalPool = parseCandidatePoolV1(JSON.parse(await readFile(join(allLocalRoot, 'artifacts/evolution/sessions/logical-session-all-local/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(allLocalPool.status, 'EXHAUSTED');
  assert.equal(allLocalPool.candidates.filter(candidate => candidate.processingState === 'INTERRUPTED').length, 3);

  const failClosedRoot = await mkdtemp(join(tmpdir(), 'candidate-session-fail-closed-'));
  const failClosed = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: failClosedRoot,
    logicalSessionId: 'logical-session-fail-closed',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => scopedAnalysis(failClosedRoot, { hypotheses: hypotheses.slice(0, 2) }),
      runCandidateLane: async ({ candidate, laneRoot }: CandidateIdentity & { laneRoot: string }) => {
        await mkdir(laneRoot, { recursive: true });
        const failure = failClosedLaneFailure(candidate);
        await writeFile(join(laneRoot, failure.workflowOutcomeRef), JSON.stringify(failure.failure));
        return failure;
      },
    },
  });
  assert.equal(failClosed.sessionState, 'FAILED');
  assert.equal(failClosed.reason, 'PARTICIPANT_FAILURE');
  const failClosedPool = parseCandidatePoolV1(JSON.parse(await readFile(join(failClosedRoot, 'artifacts/evolution/sessions/logical-session-fail-closed/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(failClosedPool.status, 'INTERRUPTED');
  assert.equal(failClosedPool.candidates[0]!.processingState, 'INTERRUPTED');
  assert.equal(failClosedPool.candidates[0]!.interruptionRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/workflow-outcome.json');

  const escalationRoot = await mkdtemp(join(tmpdir(), 'candidate-session-hfl-'));
  const escalationSourceRoot = join(escalationRoot, 'sealed-source');
  await mkdir(escalationSourceRoot, { recursive: true });
  for (const artifact of PHASE0_REQUIRED_SEALED_ARTIFACTS) { await mkdir(join(escalationSourceRoot, artifact, '..'), { recursive: true }); await writeFile(join(escalationSourceRoot, artifact), '{}'); }
  const escalationSealed = await sealPhase0Run(escalationSourceRoot, 'cohort-run-000002');
  const escalationAnalysis: CompletedSourceCandidateAnalysisResult = { ...analysis, sourceRunRef: 'cohort-run-000002', sourceRoot: escalationSourceRoot, sourceExperimentRootHash: escalationSealed.experimentRootHash, hypotheses: [hypotheses[0]!] };
  const escalation = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: escalationRoot,
    logicalSessionId: 'logical-session-000002',
    initialSourceRoot: escalationSourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => escalationAnalysis,
      runCandidateLane: async ({ candidate, laneRoot }: { candidate: { candidateRef: string; hypothesisId: string; sourceIndex: number }; laneRoot: string }) => {
        await mkdir(laneRoot, { recursive: true });
        await writeFile(join(laneRoot, 'candidate-activation.json'), '{}');
        await writeFile(join(laneRoot, 'problem-package.json'), '{}');
        await writeFile(join(laneRoot, 'human-review-package.md'), 'candidate');
        const decision = validateSolutionDecision({ schemaVersion: 'solution-decision-v1', problemId: `problem-${candidate.hypothesisId}`, route: 'ESCALATE_HUMAN', reasonCode: 'EXPLICIT_ESCALATION', inputs: { solutionStatus: 'OPTIONS', reviewerDecision: 'ESCALATE', solutionScope: 'configuration', reviewScope: 'config_only', permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } } });
        await writeFile(join(laneRoot, 'decision.json'), JSON.stringify(decision));
        return {
          status: 'completed' as const,
          candidateRef: candidate.candidateRef,
          hypothesisId: candidate.hypothesisId,
          sourceIndex: candidate.sourceIndex,
          candidateActivationPath: join(laneRoot, 'candidate-activation.json'),
          problemPackagePath: join(laneRoot, 'problem-package.json'),
          causalAttributionPath: join(laneRoot, 'diagnostic/causal-attribution.json'),
          decisionPath: join(laneRoot, 'decision.json'),
          baseDecisionPath: join(laneRoot, 'decision.json'),
          humanReviewPackagePath: join(laneRoot, 'human-review-package.md'),
          actualParticipantJobs: 1 as const,
          decision,
          solutionInvocationRef: 'solution',
          reviewerInvocationRef: null,
          problemPackage: {} as never,
        };
      },
      retainHumanFollowup: async ({ workflowRoot }) => {
        humanFollowupRefs.push(workflowRoot);
        return { itemPath: join(escalationRoot, 'hfl-item.json'), item: {} as never, created: true };
      },
    },
  });
  assert.equal(escalation.sessionState, 'COMPLETED');
  assert.equal(humanFollowupRefs.length, 1);
  const escalationPool = parseCandidatePoolV1(JSON.parse(await readFile(join(escalationRoot, 'artifacts/evolution/sessions/logical-session-000002/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  const escalationRecord = escalationPool.candidates[0]!;
  assert.equal(escalationRecord.laneRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000001');
  assert.equal(escalationRecord.baseDecisionRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/decision.json');
  assert.equal(escalationRecord.effectiveDecisionRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/decision.json');
  assert.equal(escalationRecord.baseDecisionRef?.includes('.tmp/evolution'), false);
  assert.equal(escalationRecord.effectiveDecisionRef?.includes('.tmp/evolution'), false);
  assert.equal(escalationPool.candidates[0]!.humanFollowupRef, 'hfl-item.json');
  assert.equal(await readFile(join(escalationRoot, 'artifacts/evolution/sessions/logical-session-000002/source-epochs/source-epoch-000001/candidates', hypotheses[0]!.hypothesisId, 'candidate-activation.json'), 'utf8'), '{}');
  const escalationReport = await buildMultiCandidateOperationalRunReport({ repositoryRoot: escalationRoot, logicalSessionId: 'logical-session-000002', hostSliceId: 'host-slice-000001' });
  assert.equal(escalationReport.candidates[0]!.effectiveRoute, 'ESCALATE_HUMAN');

  const authorityEscalationRoot = await mkdtemp(join(tmpdir(), 'candidate-session-authority-escalation-'));
  const authorityEscalationCalls: string[] = [];
  let authorityEscalationSourceTransitionCalls = 0;
  const authorityEscalation = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: authorityEscalationRoot,
    logicalSessionId: 'logical-session-000002-authority',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => scopedAnalysis(authorityEscalationRoot, { hypotheses: hypotheses.slice(0, 2) }),
      runSourceTransition: async () => {
        authorityEscalationSourceTransitionCalls += 1;
        throw new Error('source transition must not run for Human-authority-required candidate');
      },
      runCandidateLane: async ({ candidate, laneRoot }: { candidate: CandidateIdentity; laneRoot: string }) => {
        authorityEscalationCalls.push(candidate.hypothesisId);
        await mkdir(laneRoot, { recursive: true });
        const decision = candidate.sourceIndex === 0
          ? validateSolutionDecision({
            schemaVersion: 'solution-decision-v1',
            problemId: `problem-${candidate.hypothesisId}`,
            route: 'ESCALATE_HUMAN',
            reasonCode: 'ACCEPTED_REQUIRES_HUMAN_AUTHORITY',
            inputs: {
              solutionStatus: 'OPTIONS',
              reviewerDecision: 'ACCEPT_OPTION',
              solutionScope: 'configuration',
              reviewScope: 'config_only',
              executionAuthorityAssessment: 'HUMAN_AUTHORITY_REQUIRED',
              permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
              budget: { actualParticipantJobs: 2, maxParticipantJobs: 4, retryCount: 0 },
            },
          })
          : skipDecision(candidate.hypothesisId);
        await writeFile(join(laneRoot, 'decision.json'), JSON.stringify(decision));
        return {
          status: 'completed' as const,
          candidateRef: candidate.candidateRef,
          hypothesisId: candidate.hypothesisId,
          sourceIndex: candidate.sourceIndex,
          candidateActivationPath: 'candidate-activation.json',
          problemPackagePath: 'problem-package.json',
          causalAttributionPath: 'diagnostic/causal-attribution.json',
          decisionPath: 'decision.json',
          baseDecisionPath: 'decision.json',
          humanReviewPackagePath: 'human-review-package.md',
          actualParticipantJobs: 2 as const,
          decision,
          solutionInvocationRef: 'solution',
          reviewerInvocationRef: 'reviewer',
          problemPackage: {} as never,
        };
      },
      retainHumanFollowup: async ({ workflowRoot }) => {
        humanFollowupRefs.push(workflowRoot);
        return { itemPath: join(authorityEscalationRoot, 'hfl-item.json'), item: {} as never, created: true };
      },
    },
  });
  assert.equal(authorityEscalation.sessionState, 'COMPLETED');
  assert.deepEqual(authorityEscalationCalls, ['hypothesis-000001', 'hypothesis-000002']);
  assert.equal(authorityEscalationSourceTransitionCalls, 0);
  assert.equal(humanFollowupRefs.length, 2);
  const authorityEscalationPool = parseCandidatePoolV1(JSON.parse(await readFile(join(authorityEscalationRoot, 'artifacts/evolution/sessions/logical-session-000002-authority/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  const authorityEscalationReport = await buildMultiCandidateOperationalRunReport({ repositoryRoot: authorityEscalationRoot, logicalSessionId: 'logical-session-000002-authority', hostSliceId: 'host-slice-000001' });
  assert.equal(authorityEscalationReport.candidates[0]!.effectiveRoute, 'ESCALATE_HUMAN');
  assert.equal(authorityEscalationReport.candidates[1]!.effectiveRoute, 'SKIP');
  assert.equal(authorityEscalationPool.candidates[0]!.processingState, 'COMPLETED');
  assert.equal(authorityEscalationPool.candidates[1]!.processingState, 'COMPLETED');

  const continuationRoot = await mkdtemp(join(tmpdir(), 'candidate-session-continuation-'));
  let candidateContinuationCalls = 0;
  let candidateAwareHumanFollowupRetentionCalls = 0;
  let candidateProvenanceMode: string | null = null;
  const continuationBaseDecision = validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId: 'problem-hypothesis-000001',
    route: 'DEFER_MORE_WORK_REQUESTED',
    reasonCode: 'REVIEW_REQUEST_MORE_WORK',
    inputs: {
      solutionStatus: 'OPTIONS', reviewerDecision: 'REQUEST_MORE_WORK',
      solutionScope: 'configuration', reviewScope: 'config_only',
      permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
      budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
  const continuationEscalationDecision = validateSolutionDecision({
    ...continuationBaseDecision,
    route: 'ESCALATE_HUMAN',
    reasonCode: 'EXPLICIT_ESCALATION',
    inputs: { ...continuationBaseDecision.inputs, reviewerDecision: 'ESCALATE' },
  });
  let retainedFollowup: Awaited<ReturnType<typeof retainHumanFollowupWorkItem>> | null = null;
  const continuation = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: continuationRoot,
    logicalSessionId: 'logical-session-000004',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => scopedAnalysis(continuationRoot, { hypotheses: [hypotheses[0]!] }),
      runCandidateLane: async ({ candidate, laneRoot, pool }) => {
        const hypothesis = hypotheses[0]!;
        for (const relativePath of [
          'source/observable-payload.json',
          'feedback-runs/cohort-run-000001/feedback.json',
          'diagnostic/causal-attribution.json',
          'solution-agent/result.json',
          'reviewer-agent/review.json',
        ]) {
          await mkdir(join(laneRoot, relativePath, '..'), { recursive: true });
          await writeFile(join(laneRoot, relativePath), '{}\n');
        }
        await mkdir(join(laneRoot, 'hypothesis-runs/cohort-run-000001'), { recursive: true });
        await writeFile(join(laneRoot, 'hypothesis-runs/cohort-run-000001/hypotheses.json'), `${canonicalJson({ hypotheses: [hypothesis] })}\n`);
        await writeFile(join(laneRoot, 'candidate-activation.json'), `${canonicalJson({
          schemaVersion: 'candidate-activation-v1',
          candidateRef: candidate.candidateRef,
          poolId: pool.poolId,
          hypothesisId: candidate.hypothesisId,
          sourceIndex: candidate.sourceIndex,
          hypothesisSha256: candidate.hypothesisSha256,
          hypothesisSetRef: pool.hypothesisSet.artifactRef,
          hypothesisSetSha256: pool.hypothesisSet.sha256,
          sourceRunRef: pool.source.sourceRunRef,
        })}\n`);
        await writeFile(
          join(laneRoot, 'autonomous-authoring-contract-packet.json'),
          `${canonicalJson(autonomousAuthoringContractPacket)}\n`,
        );
        await writeFile(join(laneRoot, 'decision.json'), `${canonicalJson(continuationBaseDecision)}\n`);
        const problemPackagePath = join(laneRoot, 'problem-package.json');
        await buildProblemPackage({
          activeCandidate: hypothesis,
          activeCandidateRef: candidate.candidateRef,
          activeCandidateSourceIndex: candidate.sourceIndex,
          runRef: 'cohort-run-000001',
          observablePayloadRef: 'source/observable-payload.json',
          externalFeedbackRef: 'feedback-runs/cohort-run-000001/feedback.json',
          improvementHypothesisRef: 'hypothesis-runs/cohort-run-000001/hypotheses.json',
          diagnosticEvidenceRefs: ['diagnostic/causal-attribution.json'],
          authorityRefs: ['docs/product/auto-evolution-model.md'],
          productSourceFingerprintSha256: 'c'.repeat(64),
          destinationPath: problemPackagePath,
        });
        const decisionPath = join(laneRoot, 'decision.json');
        return {
          status: 'completed' as const,
          candidateRef: candidate.candidateRef,
          hypothesisId: candidate.hypothesisId,
          sourceIndex: candidate.sourceIndex,
          candidateActivationPath: 'candidate-activation.json',
          problemPackagePath,
          causalAttributionPath: 'diagnostic/causal-attribution.json',
          decisionPath,
          baseDecisionPath: decisionPath,
          humanReviewPackagePath: 'human-review-package.md',
          actualParticipantJobs: 1 as const,
          decision: continuationBaseDecision,
          solutionInvocationRef: 'solution', reviewerInvocationRef: 'reviewer',
          problemPackage: {} as never,
        };
      },
      runCandidateContinuation: async continuationInput => {
        const { laneRoot } = continuationInput;
        candidateContinuationCalls += 1;
        assert.deepEqual(
          continuationInput.autonomousAuthoringContractPacket,
          autonomousAuthoringContractPacket,
        );
        const continuationDecisionPath = join(laneRoot, 'review-continuation-000001/decision.json');
        for (const relativePath of [
          'review-continuation-000001/revision-request.json',
          'review-continuation-000001/solution-revision/result.json',
          'review-continuation-000001/reviewer-agent/review.json',
          'review-continuation-000001/continuation.json',
        ]) {
          await mkdir(join(laneRoot, relativePath, '..'), { recursive: true });
          await writeFile(join(laneRoot, relativePath), '{}\n');
        }
        await writeFile(continuationDecisionPath, `${canonicalJson(continuationEscalationDecision)}\n`);
        return {
          status: 'completed' as const,
          participantJobs: 1 as const,
          continuationRef: 'review-continuation-000001' as const,
          effectiveDecisionPath: continuationDecisionPath,
          effectiveDecision: continuationEscalationDecision,
        };
      },
      retainHumanFollowup: async input => {
        candidateAwareHumanFollowupRetentionCalls += 1;
        candidateProvenanceMode = input.candidateProvenance?.mode ?? null;
        retainedFollowup = await retainHumanFollowupWorkItem(input);
        return retainedFollowup;
      },
    },
  });
  assert.equal(continuation.sessionState, 'COMPLETED');
  assert.equal(candidateContinuationCalls, 1);
  assert.equal(candidateAwareHumanFollowupRetentionCalls, 1);
  assert.equal(candidateProvenanceMode, 'candidate-activation-v1');
  assert.equal(retainedFollowup?.created, true);
  assert.equal(retainedFollowup?.item.trigger.route, 'ESCALATE_HUMAN');
  assert.equal(retainedFollowup?.item.provenance.decisionSha256, sha256Hex(canonicalJson(continuationEscalationDecision)));
  const continuationEvidencePaths = retainedFollowup?.item.evidence.map(entry => entry.relativePath) ?? [];
  for (const relativePath of [
    'candidate-activation.json',
    'hypothesis-runs/cohort-run-000001/hypotheses.json',
    'problem-package.json',
    'diagnostic/causal-attribution.json',
    'solution-agent/result.json',
    'reviewer-agent/review.json',
    'decision.json',
    'review-continuation-000001/revision-request.json',
    'review-continuation-000001/solution-revision/result.json',
    'review-continuation-000001/reviewer-agent/review.json',
    'review-continuation-000001/decision.json',
    'review-continuation-000001/continuation.json',
  ]) assert.equal(continuationEvidencePaths.includes(relativePath), true, relativePath);
  assert.equal(continuationEvidencePaths.includes('selection/selected-hypothesis.json'), false);
  const continuationPool = parseCandidatePoolV1(JSON.parse(await readFile(join(continuationRoot, 'artifacts/evolution/sessions/logical-session-000004/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(continuationPool.candidates[0]!.humanFollowupRef, relative(continuationRoot, retainedFollowup!.itemPath).split('/').join('/'));

  const deferredDecisionFor = (candidate: CandidateIdentity) => validateSolutionDecision({
    ...continuationBaseDecision,
    problemId: `problem-${candidate.hypothesisId}`,
  });
  const continuationFailureLane = async ({ candidate, laneRoot }: CandidateIdentity & { laneRoot: string }) => {
    const decision = deferredDecisionFor(candidate);
    await mkdir(laneRoot, { recursive: true });
    await writeFile(join(laneRoot, 'decision.json'), JSON.stringify(decision));
    return {
      status: 'completed' as const,
      candidateRef: candidate.candidateRef,
      hypothesisId: candidate.hypothesisId,
      sourceIndex: candidate.sourceIndex,
      candidateActivationPath: 'candidate-activation.json',
      problemPackagePath: 'problem-package.json',
      causalAttributionPath: 'diagnostic/causal-attribution.json',
      decisionPath: 'decision.json',
      baseDecisionPath: 'decision.json',
      humanReviewPackagePath: 'human-review-package.md',
      actualParticipantJobs: 2 as const,
      decision,
      solutionInvocationRef: 'solution',
      reviewerInvocationRef: 'reviewer',
      problemPackage: {} as never,
    };
  };

  const continuationLocalRoot = await mkdtemp(join(tmpdir(), 'candidate-session-continuation-local-'));
  let continuationLocalHflCalls = 0;
  const continuationLocal = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: continuationLocalRoot,
    logicalSessionId: 'logical-session-continuation-local',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => scopedAnalysis(continuationLocalRoot, { hypotheses: [hypotheses[0]!] }),
      runCandidateLane: continuationFailureLane,
      runCandidateContinuation: async ({ candidate, laneRoot }: CandidateIdentity & { laneRoot: string }) => {
        await mkdir(join(laneRoot, 'review-continuation-000001'), { recursive: true });
        const failure = localContinuationFailure(candidate);
        await writeFile(join(laneRoot, failure.failureRef), '{}');
        await writeFile(join(laneRoot, failure.workflowOutcomeRef), JSON.stringify(failure.failure));
        return failure;
      },
      retainHumanFollowup: async () => {
        continuationLocalHflCalls += 1;
        return { itemPath: join(continuationLocalRoot, 'unexpected-hfl-item.json'), item: {} as never, created: true };
      },
    },
  });
  assert.equal(continuationLocal.sessionState, 'COMPLETED');
  const continuationLocalPool = parseCandidatePoolV1(JSON.parse(await readFile(join(continuationLocalRoot, 'artifacts/evolution/sessions/logical-session-continuation-local/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(continuationLocalPool.status, 'EXHAUSTED');
  assert.equal(continuationLocalPool.candidates[0]!.processingState, 'INTERRUPTED');
  assert.equal(continuationLocalPool.candidates[0]!.interruptionRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/workflow-outcome.json');
  assert.equal(await readFile(join(continuationLocalRoot, 'artifacts/evolution/sessions/logical-session-continuation-local/source-epochs/source-epoch-000001/candidates/hypothesis-000001/review-continuation-000001/continuation.json'), 'utf8').then(() => true), true);
  assert.equal(continuationLocalHflCalls, 0);

  const budgetRoot = await mkdtemp(join(tmpdir(), 'candidate-session-local-budget-'));
  const budgetRun = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: budgetRoot,
    logicalSessionId: 'logical-session-local-budget',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => scopedAnalysis(budgetRoot, { hypotheses }),
      runCandidateLane: continuationFailureLane,
      runCandidateContinuation: async ({ candidate, laneRoot }: CandidateIdentity & { laneRoot: string }) => {
        await mkdir(join(laneRoot, 'review-continuation-000001'), { recursive: true });
        if (candidate.sourceIndex === 0) {
          const failure = localContinuationFailure(candidate, 2);
          await writeFile(join(laneRoot, failure.failureRef), '{}');
          await writeFile(join(laneRoot, failure.workflowOutcomeRef), JSON.stringify(failure.failure));
          return failure;
        }
        const decision = skipDecision(candidate.hypothesisId);
        await writeFile(join(laneRoot, 'review-continuation-000001/decision.json'), JSON.stringify(decision));
        return {
          status: 'completed' as const,
          participantJobs: 2 as const,
          continuationRef: 'review-continuation-000001' as const,
          effectiveDecisionPath: 'review-continuation-000001/decision.json',
          effectiveDecision: decision,
        };
      },
    },
  });
  assert.equal(budgetRun.sessionState, 'PAUSED');
  assert.equal(budgetRun.reason, 'HOST_SLICE_BUDGET');
  assert.equal(budgetRun.participantJobs, 10);
  const budgetPool = parseCandidatePoolV1(JSON.parse(await readFile(join(budgetRoot, 'artifacts/evolution/sessions/logical-session-local-budget/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(budgetPool.status, 'PROCESSING');
  assert.deepEqual(budgetPool.candidates.map(candidate => candidate.processingState), ['INTERRUPTED', 'COMPLETED', 'PENDING']);
  assert.equal(await readFile(join(budgetRoot, 'artifacts/evolution/sessions/logical-session-local-budget/source-epochs/source-epoch-000001/candidates/hypothesis-000001/review-continuation-000001/continuation.json'), 'utf8').then(() => true), true);

  const continuationFailClosedRoot = await mkdtemp(join(tmpdir(), 'candidate-session-continuation-fail-closed-'));
  const continuationFailClosed = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: continuationFailClosedRoot,
    logicalSessionId: 'logical-session-continuation-fail-closed',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => scopedAnalysis(continuationFailClosedRoot, { hypotheses: [hypotheses[0]!] }),
      runCandidateLane: continuationFailureLane,
      runCandidateContinuation: async ({ candidate, laneRoot }: CandidateIdentity & { laneRoot: string }) => {
        await mkdir(join(laneRoot, 'review-continuation-000001'), { recursive: true });
        const failure = failClosedContinuationFailure(candidate);
        await writeFile(join(laneRoot, failure.failureRef), '{}');
        await writeFile(join(laneRoot, failure.workflowOutcomeRef), JSON.stringify(failure.failure));
        return failure;
      },
    },
  });
  assert.equal(continuationFailClosed.sessionState, 'FAILED');
  assert.equal(continuationFailClosed.reason, 'PARTICIPANT_FAILURE');
  const continuationFailClosedPool = parseCandidatePoolV1(JSON.parse(await readFile(join(continuationFailClosedRoot, 'artifacts/evolution/sessions/logical-session-continuation-fail-closed/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(continuationFailClosedPool.status, 'INTERRUPTED');
  assert.equal(continuationFailClosedPool.candidates[0]!.processingState, 'INTERRUPTED');
  assert.equal(continuationFailClosedPool.candidates[0]!.interruptionRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/workflow-outcome.json');
  assert.equal(await readFile(join(continuationFailClosedRoot, 'artifacts/evolution/sessions/logical-session-continuation-fail-closed/source-epochs/source-epoch-000001/candidates/hypothesis-000001/review-continuation-000001/continuation.json'), 'utf8').then(() => true), true);

  const hostFailureRoot = await mkdtemp(join(tmpdir(), 'candidate-session-continuation-host-failure-'));
  let hostFailureContinuationCalls = 0;
  const hostFailure = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: hostFailureRoot,
    logicalSessionId: 'logical-session-000006',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => ({ ...analysis, hypotheses: hypotheses.slice(0, 2) }),
      runCandidateLane: async ({ candidate, laneRoot }: { candidate: { candidateRef: string; hypothesisId: string; sourceIndex: number }; laneRoot: string }) => {
        await mkdir(laneRoot, { recursive: true });
        const decision = validateSolutionDecision({
          ...continuationBaseDecision,
          problemId: `problem-${candidate.hypothesisId}`,
        });
        await writeFile(join(laneRoot, 'decision.json'), JSON.stringify(decision));
        return {
          status: 'completed' as const,
          candidateRef: candidate.candidateRef,
          hypothesisId: candidate.hypothesisId,
          sourceIndex: candidate.sourceIndex,
          candidateActivationPath: 'candidate-activation.json',
          problemPackagePath: 'problem-package.json',
          causalAttributionPath: 'diagnostic/causal-attribution.json',
          decisionPath: join(laneRoot, 'decision.json'),
          baseDecisionPath: join(laneRoot, 'decision.json'),
          humanReviewPackagePath: 'human-review-package.md',
          actualParticipantJobs: 1 as const,
          decision,
          solutionInvocationRef: 'solution',
          reviewerInvocationRef: 'reviewer',
          problemPackage: {} as never,
        };
      },
      runCandidateContinuation: async () => {
        hostFailureContinuationCalls += 1;
        throw new Error('sealed source provenance unavailable');
      },
    },
  });
  assert.equal(hostFailure.sessionState, 'FAILED');
  assert.match(hostFailure.reason ?? '', /^HOST_FAILURE:/);
  assert.equal(hostFailureContinuationCalls, 1);
  const hostFailurePool = parseCandidatePoolV1(JSON.parse(await readFile(join(hostFailureRoot, 'artifacts/evolution/sessions/logical-session-000006/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(hostFailurePool.status, 'INTERRUPTED');
  assert.equal(hostFailurePool.candidates[0]!.processingState, 'INTERRUPTED');
  assert.equal(hostFailurePool.candidates[1]!.processingState, 'PENDING');
  const hostFailureManifest = await readDurableMultiCandidateSessionManifest(hostFailureRoot, 'logical-session-000006');
  assert.equal(hostFailureManifest.sessionState, 'FAILED');
  assert.equal(hostFailureManifest.hostSlices[0]!.state, 'FAILED');
  assert.equal(hostFailureManifest.failureRef, 'host-failure.json');
  assert.equal(await readFile(join(hostFailureRoot, 'artifacts/evolution/sessions/logical-session-000006/host-failure.json'), 'utf8').then(value => value.includes('sealed source provenance unavailable')), true);
  const hostFailureEvidence = await retainMultiCandidateSessionEvidence({ repositoryRoot: hostFailureRoot, logicalSessionId: 'logical-session-000006', createdAt: '2026-09-15T00:01:00.000Z' });
  assert.equal(hostFailureEvidence.status, 'PUBLISHED');
  assert.ok(hostFailureEvidence.capsuleRoot);
  const hostFailureReport = await archiveMultiCandidateSessionReport({
    repositoryRoot: hostFailureRoot,
    logicalSessionId: 'logical-session-000006',
    hostSliceId: 'host-slice-000001',
    terminalForensicEvidenceRef: relative(hostFailureRoot, hostFailureEvidence.capsuleRoot!).split('/').join('/'),
    createdAt: '2026-09-15T00:01:00.000Z',
  });
  const hostFailureReportJson = JSON.parse(await readFile(hostFailureReport.reportJsonPath, 'utf8')) as { sessionStateAtSnapshot: string; candidates: Array<{ processingState: string; interruptionRef: string | null }>; terminalForensicEvidenceRef: string | null };
  assert.equal(hostFailureReportJson.sessionStateAtSnapshot, 'FAILED');
  assert.equal(hostFailureReportJson.candidates[0]!.processingState, 'INTERRUPTED');
  assert.equal(hostFailureReportJson.candidates[0]!.interruptionRef, 'host-failure.json');
  assert.equal(hostFailureReportJson.terminalForensicEvidenceRef, relative(hostFailureRoot, hostFailureEvidence.capsuleRoot!).split('/').join('/'));

  const retainedAnalysisRoot = join(root, 'analysis');
  const retainedFeedbackRoot = join(retainedAnalysisRoot, 'feedback-runs', analysis.sourceRunRef);
  const retainedHypothesisRoot = join(retainedAnalysisRoot, 'hypothesis-runs', analysis.sourceRunRef);
  await mkdir(retainedFeedbackRoot, { recursive: true });
  await mkdir(retainedHypothesisRoot, { recursive: true });
  await writeFile(join(retainedFeedbackRoot, 'feedback.json'), JSON.stringify({ overallImpression: 'A retained source analysis.', observations: [] }));
  await writeFile(join(retainedFeedbackRoot, 'invocation.json'), JSON.stringify({ invocationRef: 'feedback-000001' }));
  await writeFile(join(retainedHypothesisRoot, 'hypotheses.json'), JSON.stringify({ schemaVersion: 'improvement-hypothesis-set-v2', hypotheses, noProblemAssessment: null }));
  await writeFile(join(retainedHypothesisRoot, 'invocation.json'), JSON.stringify({ hypothesisInvocationRef: 'hypothesis-000001' }));
  await retainSourceAnalysisArtifacts({
    repositoryRoot: root,
    logicalSessionId: 'logical-session-000001',
    sourceEpochRef: 'source-epoch-000001',
    sourceRoot: retainedAnalysisRoot,
    relativePaths: [
      `feedback-runs/${analysis.sourceRunRef}/feedback.json`,
      `feedback-runs/${analysis.sourceRunRef}/invocation.json`,
      `hypothesis-runs/${analysis.sourceRunRef}/hypotheses.json`,
      `hypothesis-runs/${analysis.sourceRunRef}/invocation.json`,
    ],
  });

  const resumed = await runMultiCandidateSessionSlice({
    ...base,
    mode: 'RESUME_SESSION',
    hostSliceId: 'host-slice-000002',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => { throw new Error('resume must not rerun source analysis'); },
    },
  });
  assert.equal(resumed.sessionState, 'COMPLETED');
  const resumedSourceRoot = join(root, '.tmp/evolution', 'logical-session-000001', 'host-slice-000002', 'source-epoch-000001', 'source');
  const resumedAnalysisRoot = join(root, '.tmp/evolution', 'logical-session-000001', 'host-slice-000002', 'source-epoch-000001', 'analysis');
  assert.ok(await readFile(join(resumedSourceRoot, 'experiment-root.json'), 'utf8'));
  assert.ok(await readFile(join(resumedAnalysisRoot, 'game-runs', analysis.sourceRunRef, 'experiment-root.json'), 'utf8'));
  assert.ok(relative(resumedSourceRoot, resumedAnalysisRoot).startsWith('..'));
  assert.ok(relative(resumedAnalysisRoot, resumedSourceRoot).startsWith('..'));
  const resumedManifest = await readDurableMultiCandidateSessionManifest(root, 'logical-session-000001');
  assert.equal(resumedManifest.budgetAccounting.hostSliceCount, 2);
  assert.equal(resumedManifest.budgetAccounting.participantJobs, resumedManifest.hostSlices.reduce((sum, item) => sum + item.participantJobs, 0));

  const dispositionRoot = await mkdtemp(join(tmpdir(), 'candidate-session-dispositions-'));
  const dispositionRoutes = ['SKIP', 'DEFER', 'ESCALATE_HUMAN'] as const;
  const disposition = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: dispositionRoot,
    logicalSessionId: 'logical-session-000005',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runCandidateLane: async ({ candidate, laneRoot }: { candidate: { candidateRef: string; hypothesisId: string; sourceIndex: number }; laneRoot: string }) => {
        const route = dispositionRoutes[candidate.sourceIndex]!;
        const decision = validateSolutionDecision({
          schemaVersion: 'solution-decision-v1',
          problemId: `problem-${candidate.hypothesisId}`,
          route,
          reasonCode: route === 'SKIP' ? 'NO_PROPOSAL' : route === 'DEFER' ? 'INSUFFICIENT_EVIDENCE' : 'EXPLICIT_ESCALATION',
          inputs: {
            solutionStatus: route === 'SKIP' || route === 'DEFER' ? 'NO_PROPOSAL' : 'OPTIONS',
            reviewerDecision: route === 'ESCALATE_HUMAN' ? 'ESCALATE' : null,
            solutionScope: route === 'ESCALATE_HUMAN' ? 'configuration' : null,
            reviewScope: route === 'ESCALATE_HUMAN' ? 'config_only' : null,
            permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
            budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 },
          },
        });
        await mkdir(laneRoot, { recursive: true });
        await writeFile(join(laneRoot, 'decision.json'), JSON.stringify(decision));
        return {
          status: 'completed' as const,
          candidateRef: candidate.candidateRef,
          hypothesisId: candidate.hypothesisId,
          sourceIndex: candidate.sourceIndex,
          candidateActivationPath: 'candidate-activation.json',
          problemPackagePath: 'problem-package.json',
          causalAttributionPath: 'diagnostic/causal-attribution.json',
          decisionPath: 'decision.json',
          baseDecisionPath: 'decision.json',
          humanReviewPackagePath: 'human-review-package.md',
          actualParticipantJobs: 1 as const,
          decision,
          solutionInvocationRef: 'solution', reviewerInvocationRef: null,
          problemPackage: {} as never,
        };
      },
      retainHumanFollowup: async () => ({ itemPath: join(dispositionRoot, 'hfl-item.json'), item: {} as never, created: true }),
    },
  });
  assert.equal(disposition.sessionState, 'COMPLETED');
  const dispositionManifest = await readDurableMultiCandidateSessionManifest(dispositionRoot, 'logical-session-000005');
  assert.deepEqual(dispositionManifest.sourceEpochs[0]!.dispositionCounts, { SKIP: 1, DEFER: 1, ESCALATE_HUMAN: 1 });

  const transitionRoot = await mkdtemp(join(tmpdir(), 'candidate-session-transition-'));
  const transitionSourceA = join(transitionRoot, 'source-a');
  const transitionSourceB = join(transitionRoot, 'source-b');
  for (const source of [transitionSourceA, transitionSourceB]) {
    await mkdir(source, { recursive: true });
    for (const artifact of PHASE0_REQUIRED_SEALED_ARTIFACTS) { await mkdir(join(source, artifact, '..'), { recursive: true }); await writeFile(join(source, artifact), '{}'); }
  }
  const transitionSealA = await sealPhase0Run(transitionSourceA, 'cohort-run-000003');
  const transitionSealB = await sealPhase0Run(transitionSourceB, 'cohort-run-000004');
  const transitionAnalysis: CompletedSourceCandidateAnalysisResult = { ...analysis, sourceRunRef: 'cohort-run-000003', sourceRoot: transitionSourceA, sourceExperimentRootHash: transitionSealA.experimentRootHash, hypotheses: hypotheses.slice(0, 2) };
  const transition = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: transitionRoot,
    logicalSessionId: 'logical-session-000003',
    initialSourceRoot: transitionSourceA,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => transitionAnalysis,
      runCandidateLane: async ({ candidate }: { candidate: { candidateRef: string; hypothesisId: string; sourceIndex: number } }) => ({
        status: 'completed' as const,
        candidateRef: candidate.candidateRef,
        hypothesisId: candidate.hypothesisId,
        sourceIndex: candidate.sourceIndex,
        candidateActivationPath: 'candidate-activation.json',
        problemPackagePath: 'problem-package.json',
        causalAttributionPath: 'diagnostic/causal-attribution.json',
        decisionPath: 'decision.json',
        baseDecisionPath: 'decision.json',
        humanReviewPackagePath: 'human-review-package.md',
        effectiveSolutionPath: 'exact-solution-artifact.json',
        effectiveReviewPath: 'exact-review-artifact.json',
        autonomousAuthoringAdmissionPath: null,
        actualParticipantJobs: 1 as const,
        decision: validateSolutionDecision({ schemaVersion: 'solution-decision-v1', problemId: `problem-${candidate.hypothesisId}`, route: 'READY_FOR_CONFIG_EXECUTION', reasonCode: 'ACCEPTED_CONFIGURATION_SCOPE', inputs: { solutionStatus: 'OPTIONS', reviewerDecision: 'ACCEPT_OPTION', solutionScope: 'configuration', reviewScope: 'config_only', permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } } }),
        solutionInvocationRef: 'solution',
        reviewerInvocationRef: 'reviewer',
        problemPackage: {} as never,
      }),
      runSourceTransition: async input => {
        assert.equal(input.effectiveSolutionPath, 'exact-solution-artifact.json');
        assert.equal(input.effectiveReviewPath, 'exact-review-artifact.json');
        assert.equal(input.autonomousAuthoringAdmissionPath, null);
        return { status: 'succeeded' as const, participantJobs: 1 as const, executionRef: 'execution-000001', resultingRunRef: 'cohort-run-000004', resultingSourceRoot: transitionSourceB, executionEvidenceRef: 'execution.json' };
      },
    },
  });
  assert.equal(transition.sessionState, 'PAUSED');
  assert.equal(transition.reason, 'SOURCE_B_ANALYSIS_PENDING');
  assert.equal(await readFile(join(transitionRoot, 'artifacts/evolution/sessions/logical-session-000003/source-epochs/source-epoch-000002/source-anchor.json'), 'utf8').then(() => true), true);
  const transitionPool = parseCandidatePoolV1(JSON.parse(await readFile(join(transitionRoot, 'artifacts/evolution/sessions/logical-session-000003/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(transitionPool.status, 'SUPERSEDED');
  assert.equal(transitionPool.candidates[0]!.sourceTransitionRef, 'source-transitions/hypothesis-000001');
  assert.equal(transitionPool.candidates[1]!.processingState, 'SUPERSEDED');

  let sourceBRunAnalysisCalls = 0;
  let sourceBLoadAnalysisCalls = 0;
  const sourceBAnalysis: CompletedSourceCandidateAnalysisResult = {
    ...analysis,
    sourceRunRef: 'cohort-run-000004',
    sourceRoot: transitionSourceB,
    sourceExperimentRootHash: transitionSealB.experimentRootHash,
    hypotheses: [hypotheses[0]!],
  };
  const sourceBShadow = shadowAuthoringStubs(transitionRoot);
  let sourceBSourceTransitionCalls = 0;
  let sourceBHumanFollowupCalls = 0;
  const resumedSourceB = await runMultiCandidateSessionSlice({
    ...base,
    initialSourceRoot: undefined,
    repositoryRoot: transitionRoot,
    logicalSessionId: 'logical-session-000003',
    mode: 'RESUME_SESSION',
    hostSliceId: 'host-slice-000002',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async ({ sourceRoot: materializedSourceRoot, analysisRoot }) => {
        sourceBRunAnalysisCalls += 1;
        const expectedEpochRoot = join(transitionRoot, '.tmp/evolution', 'logical-session-000003', 'host-slice-000002', 'source-epoch-000002');
        assert.equal(materializedSourceRoot, join(expectedEpochRoot, 'source'));
        assert.equal(analysisRoot, join(expectedEpochRoot, 'analysis'));
        assert.ok(relative(materializedSourceRoot, analysisRoot).startsWith('..'));
        assert.ok(relative(analysisRoot, materializedSourceRoot).startsWith('..'));
        assert.ok(await readFile(join(materializedSourceRoot, 'experiment-root.json'), 'utf8'));
        return sourceBAnalysis;
      },
      loadSourceAnalysis: async () => {
        sourceBLoadAnalysisCalls += 1;
        throw new Error('fresh Source B must not load non-existent retained analysis');
      },
      runCandidateLane: async ({ candidate, laneRoot }: { candidate: CandidateIdentity; laneRoot: string }) => shadowLaneResult(candidate, laneRoot),
      ...sourceBShadow.dependencies,
      runSourceTransition: async () => { sourceBSourceTransitionCalls += 1; throw new Error('shadow authoring must not run a source transition'); },
      retainHumanFollowup: async () => { sourceBHumanFollowupCalls += 1; return { itemPath: join(transitionRoot, 'unexpected-hfl-item.json'), item: {} as never, created: true }; },
    },
  });
  assert.equal(sourceBRunAnalysisCalls, 1);
  assert.equal(sourceBLoadAnalysisCalls, 0);
  assert.equal(resumedSourceB.currentSourceEpochRef, 'source-epoch-000002');
  assert.equal(resumedSourceB.sessionState, 'COMPLETED');
  assert.equal(resumedSourceB.sourceTransitionCount, 1);
  assert.equal(resumedSourceB.participantJobs, 5);
  assert.deepEqual(sourceBShadow.calls, { executor: 1, verifier: 1, packageBuilder: 1 });
  assert.equal(sourceBSourceTransitionCalls, 0);
  assert.equal(sourceBHumanFollowupCalls, 0);

  const shadowSuccessRoot = await mkdtemp(join(tmpdir(), 'candidate-session-shadow-success-'));
  const shadowSuccess = shadowAuthoringStubs(shadowSuccessRoot);
  const shadowSuccessLaneCalls: string[] = [];
  let shadowSuccessSourceTransitionCalls = 0;
  let shadowSuccessHumanFollowupCalls = 0;
  const shadowSuccessResult = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: shadowSuccessRoot,
    logicalSessionId: 'logical-session-shadow-success',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => scopedAnalysis(shadowSuccessRoot, { hypotheses: hypotheses.slice(0, 2) }),
      runCandidateLane: async input => {
        shadowSuccessLaneCalls.push(input.candidate.hypothesisId);
        return input.candidate.sourceIndex === 0
          ? shadowLaneResult(input.candidate, input.laneRoot)
          : base.dependencies.runCandidateLane!(input);
      },
      ...shadowSuccess.dependencies,
      runSourceTransition: async () => { shadowSuccessSourceTransitionCalls += 1; throw new Error('shadow authoring must not run a source transition'); },
      retainHumanFollowup: async () => { shadowSuccessHumanFollowupCalls += 1; return { itemPath: join(shadowSuccessRoot, 'unexpected-hfl-item.json'), item: {} as never, created: true }; },
    },
  });
  assert.equal(shadowSuccessResult.sessionState, 'COMPLETED');
  assert.equal(shadowSuccessResult.participantJobs, 6);
  assert.equal(shadowSuccessResult.sourceTransitionCount, 0);
  assert.deepEqual(shadowSuccessLaneCalls, ['hypothesis-000001', 'hypothesis-000002']);
  assert.deepEqual(shadowSuccess.calls, { executor: 1, verifier: 1, packageBuilder: 1 });
  assert.equal(shadowSuccessSourceTransitionCalls, 0);
  assert.equal(shadowSuccessHumanFollowupCalls, 0);
  const shadowSuccessPool = parseCandidatePoolV1(JSON.parse(await readFile(join(shadowSuccessRoot, 'artifacts/evolution/sessions/logical-session-shadow-success/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(shadowSuccessPool.status, 'EXHAUSTED');
  assert.deepEqual(shadowSuccessPool.candidates.map(candidate => candidate.processingState), ['COMPLETED', 'COMPLETED']);
  assert.equal(shadowSuccessPool.candidates[0]!.sourceTransitionRef, null);
  assert.equal(shadowSuccessPool.candidates[0]!.humanFollowupRef, null);
  const retainedShadowRoot = join(shadowSuccessRoot, 'artifacts/evolution/sessions/logical-session-shadow-success/source-epochs/source-epoch-000001/candidates/hypothesis-000001/shadow-authoring');
  for (const path of [
    'invocation.json', 'raw-output.txt', 'participant-binding.json', 'participant-prompt.txt', 'execution-trace.json',
    'executor-result.json', 'change-set.json', 'verification.json', 'promotion.patch', 'promotion-package.json',
    'promotion-package.md', 'result.json',
  ]) assert.equal(await readFile(join(retainedShadowRoot, path), 'utf8').then(() => true), true, path);
  const retainedShadowResult = JSON.parse(await readFile(join(retainedShadowRoot, 'result.json'), 'utf8')) as { status?: string };
  const retainedShadowPackage = JSON.parse(await readFile(join(retainedShadowRoot, 'promotion-package.json'), 'utf8')) as { schemaVersion?: string };
  assert.equal(retainedShadowResult.status, 'SHADOW_AUTHORING_VERIFIED');
  assert.equal(retainedShadowPackage.schemaVersion, 'shadow-authoring-promotion-package-v1');

  const shadowFailureCases = [
    { name: 'executor-runtime', options: { executorStatus: 'failed' as const, executorFailure: 'Shadow Executor runtime failed' } },
    { name: 'scope-verification', options: { verificationFailure: 'mechanical scope verification failed' } },
    { name: 'authoritative-fingerprint', options: { authoritativeMutation: true } },
    { name: 'host-verifier-infrastructure', options: { verifierThrows: true } },
  ];
  for (const failureCase of shadowFailureCases) {
    const failureRoot = await mkdtemp(join(tmpdir(), `candidate-session-shadow-${failureCase.name}-`));
    const shadowFailure = shadowAuthoringStubs(failureRoot, failureCase.options);
    const failureLaneCalls: string[] = [];
    let failureSourceTransitionCalls = 0;
    let failureHumanFollowupCalls = 0;
    const shadowFailureResult = await runMultiCandidateSessionSlice({
      ...base,
      repositoryRoot: failureRoot,
      logicalSessionId: `logical-session-shadow-${failureCase.name}`,
      initialSourceRoot: sourceRoot,
      hostSliceId: 'host-slice-000001',
      dependencies: {
        ...base.dependencies,
        runSourceAnalysis: async () => scopedAnalysis(failureRoot, { hypotheses: hypotheses.slice(0, 2) }),
        runCandidateLane: async input => {
          failureLaneCalls.push(input.candidate.hypothesisId);
          return input.candidate.sourceIndex === 0
            ? shadowLaneResult(input.candidate, input.laneRoot)
            : base.dependencies.runCandidateLane!(input);
        },
        ...shadowFailure.dependencies,
        runSourceTransition: async () => { failureSourceTransitionCalls += 1; throw new Error('shadow failure must not run a source transition'); },
        retainHumanFollowup: async () => { failureHumanFollowupCalls += 1; return { itemPath: join(failureRoot, 'unexpected-hfl-item.json'), item: {} as never, created: true }; },
      },
    });
    assert.equal(shadowFailureResult.sessionState, 'FAILED', failureCase.name);
    assert.equal(shadowFailureResult.sourceTransitionCount, 0, failureCase.name);
    assert.deepEqual(failureLaneCalls, ['hypothesis-000001'], failureCase.name);
    assert.equal(failureSourceTransitionCalls, 0, failureCase.name);
    assert.equal(failureHumanFollowupCalls, 0, failureCase.name);
    const logicalSessionId = `logical-session-shadow-${failureCase.name}`;
    const failurePool = parseCandidatePoolV1(JSON.parse(await readFile(join(failureRoot, 'artifacts/evolution/sessions', logicalSessionId, 'source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
    assert.equal(failurePool.candidates[0]!.processingState, 'INTERRUPTED', failureCase.name);
    assert.equal(failurePool.candidates[1]!.processingState, 'PENDING', failureCase.name);
    const failureManifest = await readDurableMultiCandidateSessionManifest(failureRoot, logicalSessionId);
    assert.ok(failureManifest.failureRef, failureCase.name);
    const retainedFailureResultPath = join(failureRoot, 'artifacts/evolution/sessions', logicalSessionId, failureManifest.failureRef!);
    const retainedFailureResult = JSON.parse(await readFile(retainedFailureResultPath, 'utf8')) as { status?: string; failure?: string };
    assert.equal(retainedFailureResult.status, 'SHADOW_AUTHORING_FAILED', failureCase.name);
    assert.ok(retainedFailureResult.failure, failureCase.name);
    const retainedFailureShadowRoot = join(failureRoot, 'artifacts/evolution/sessions', logicalSessionId, 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/shadow-authoring');
    assert.equal(await readFile(join(retainedFailureShadowRoot, 'result.json'), 'utf8').then(() => true), true, failureCase.name);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMultiCandidateSessionSliceTests().then(() => console.log('multiCandidateSessionSlice.test.ts: ok')).catch(error => { console.error(error); process.exit(1); });
}
