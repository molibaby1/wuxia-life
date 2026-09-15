import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runMultiCandidateSessionSlice } from '../../scripts/evolution/runMultiCandidateSessionSlice';
import { PHASE0_REQUIRED_SEALED_ARTIFACTS, sealPhase0Run } from '../../scripts/evolution/phase0/provenance';
import { parseCandidatePoolV1 } from '../../scripts/evolution/candidatePoolContract';
import { readDurableMultiCandidateSessionManifest } from '../../scripts/evolution/candidateSessionStore';
import type { CompletedSourceCandidateAnalysisResult } from '../../scripts/evolution/runSourceCandidateAnalysis';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { buildMultiCandidateOperationalRunReport } from '../../scripts/evolution/reporting/buildMultiCandidateOperationalRunReport';
import { validateSolutionDecision } from '../../src/evolution/solutionDecisionContract';

const participant: WorkspaceAgentParticipantOptions = { executable: 'test-participant', buildArgs: () => [] };
const hypotheses = [1, 2, 3].map(index => ({ hypothesisId: `hypothesis-${String(index).padStart(6, '0')}`, hypothesis: `H${index}`, observedBasis: 'Observed.', feedbackRefs: ['overallImpression'], evidenceRefs: [], unknowns: ['Unknown.'], productSignificance: 'Significant.' }));

export async function runMultiCandidateSessionSliceTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'candidate-session-slice-'));
  const sourceRoot = join(root, 'sealed-source');
  await mkdir(sourceRoot, { recursive: true });
  for (const artifact of PHASE0_REQUIRED_SEALED_ARTIFACTS) { await mkdir(join(sourceRoot, artifact, '..'), { recursive: true }); await writeFile(join(sourceRoot, artifact), '{}'); }
  const sealed = await sealPhase0Run(sourceRoot, 'cohort-run-000001');
  const analysis: CompletedSourceCandidateAnalysisResult = { status: 'completed', sourceRunRef: 'cohort-run-000001', sourceRoot, analysisRoot: join(root, 'analysis'), sourceExperimentRootHash: sealed.experimentRootHash, sourceFingerprintSha256: 'b'.repeat(64), authoritativeFingerprintSha256: 'c'.repeat(64), observablePayloadRef: 'source/observable-payload.json', externalFeedbackRef: 'feedback-runs/cohort-run-000001/feedback.json', improvementHypothesisRef: 'hypothesis-runs/cohort-run-000001/hypotheses.json', feedbackInvocationRef: 'feedback-000001', hypothesisInvocationRef: 'hypothesis-000001', hypotheses, noProblemAssessment: null, actualParticipantJobs: 2 };
  const calls: string[] = [];
  const humanFollowupRefs: string[] = [];
  const base = { repositoryRoot: root, logicalSessionId: 'logical-session-000001', participantBindingId: 'CODEX_CURRENT', participant, repositoryBaseline: { branch: 'dev', headSha: 'd'.repeat(40), workingTreeFingerprint: 'e'.repeat(64) }, initialSourceRoot: sourceRoot, dependencies: { now: () => '2026-09-15T00:00:00.000Z', runSourceAnalysis: async () => analysis, runCandidateLane: async ({ candidate, laneRoot }: { candidate: { candidateRef: string; hypothesisId: string; sourceIndex: number }; laneRoot: string }) => { calls.push(candidate.hypothesisId); const decision = validateSolutionDecision({ schemaVersion: 'solution-decision-v1', problemId: `problem-${candidate.hypothesisId}`, route: 'SKIP', reasonCode: 'NO_PROPOSAL', inputs: { solutionStatus: 'NO_PROPOSAL', reviewerDecision: null, solutionScope: null, reviewScope: null, permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } } }); await mkdir(laneRoot, { recursive: true }); await writeFile(join(laneRoot, 'decision.json'), JSON.stringify(decision)); return { status: 'completed' as const, candidateRef: candidate.candidateRef, hypothesisId: candidate.hypothesisId, sourceIndex: candidate.sourceIndex, candidateActivationPath: 'candidate-activation.json', problemPackagePath: 'problem-package.json', causalAttributionPath: 'diagnostic/causal-attribution.json', decisionPath: 'decision.json', baseDecisionPath: 'decision.json', humanReviewPackagePath: 'human-review-package.md', actualParticipantJobs: 1 as const, decision, solutionInvocationRef: 'solution', reviewerInvocationRef: null, problemPackage: {} as never }; } } };
  const first = await runMultiCandidateSessionSlice({ ...base, mode: 'START_NEW_SESSION', hostSliceId: 'host-slice-000001' });
  assert.equal(first.sessionState, 'COMPLETED');
  assert.deepEqual(calls, ['hypothesis-000001', 'hypothesis-000002', 'hypothesis-000003']);
  const pool = parseCandidatePoolV1(JSON.parse(await readFile(join(root, 'artifacts/evolution/sessions/logical-session-000001/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(pool.status, 'EXHAUSTED');

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
  const continuation = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: continuationRoot,
    logicalSessionId: 'logical-session-000004',
    initialSourceRoot: sourceRoot,
    hostSliceId: 'host-slice-000001',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => ({ ...analysis, hypotheses: [hypotheses[0]!] }),
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
        actualParticipantJobs: 1 as const,
        decision: continuationBaseDecision,
        solutionInvocationRef: 'solution', reviewerInvocationRef: 'reviewer',
        problemPackage: {} as never,
      }),
      runCandidateContinuation: async ({ laneRoot }) => {
        candidateContinuationCalls += 1;
        await mkdir(join(laneRoot, 'review-continuation-000001'), { recursive: true });
        await writeFile(join(laneRoot, 'review-continuation-000001/decision.json'), JSON.stringify(continuationEscalationDecision));
        return {
          status: 'completed' as const,
          participantJobs: 1 as const,
          continuationRef: 'review-continuation-000001' as const,
          effectiveDecisionPath: 'review-continuation-000001/decision.json',
          effectiveDecision: continuationEscalationDecision,
        };
      },
      retainHumanFollowup: async input => {
        candidateAwareHumanFollowupRetentionCalls += 1;
        candidateProvenanceMode = input.candidateProvenance?.mode ?? null;
        return { itemPath: join(continuationRoot, 'candidate-hfl-item.json'), item: {} as never, created: true };
      },
    },
  });
  assert.equal(continuation.sessionState, 'COMPLETED');
  assert.equal(candidateContinuationCalls, 1);
  assert.equal(candidateAwareHumanFollowupRetentionCalls, 1);
  assert.equal(candidateProvenanceMode, 'candidate-activation-v1');
  const continuationPool = parseCandidatePoolV1(JSON.parse(await readFile(join(continuationRoot, 'artifacts/evolution/sessions/logical-session-000004/source-epochs/source-epoch-000001/candidate-pool.json'), 'utf8')));
  assert.equal(continuationPool.candidates[0]!.humanFollowupRef, 'candidate-hfl-item.json');

  let resumeAnalysisLoads = 0;
  const resumed = await runMultiCandidateSessionSlice({
    ...base,
    mode: 'RESUME_SESSION',
    hostSliceId: 'host-slice-000002',
    dependencies: {
      ...base.dependencies,
      loadSourceAnalysis: async () => { resumeAnalysisLoads += 1; return analysis; },
      runSourceAnalysis: async () => { throw new Error('resume must not rerun source analysis'); },
    },
  });
  assert.equal(resumed.sessionState, 'COMPLETED');
  assert.equal(resumeAnalysisLoads, 1);
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
        actualParticipantJobs: 1 as const,
        decision: validateSolutionDecision({ schemaVersion: 'solution-decision-v1', problemId: `problem-${candidate.hypothesisId}`, route: 'READY_FOR_CONFIG_EXECUTION', reasonCode: 'ACCEPTED_CONFIGURATION_SCOPE', inputs: { solutionStatus: 'OPTIONS', reviewerDecision: 'ACCEPT_OPTION', solutionScope: 'configuration', reviewScope: 'config_only', permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } } }),
        solutionInvocationRef: 'solution',
        reviewerInvocationRef: 'reviewer',
        problemPackage: {} as never,
      }),
      runSourceTransition: async () => ({ status: 'succeeded' as const, participantJobs: 1 as const, executionRef: 'execution-000001', resultingRunRef: 'cohort-run-000004', resultingSourceRoot: transitionSourceB, executionEvidenceRef: 'execution.json' }),
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
  const resumedSourceB = await runMultiCandidateSessionSlice({
    ...base,
    repositoryRoot: transitionRoot,
    logicalSessionId: 'logical-session-000003',
    mode: 'RESUME_SESSION',
    hostSliceId: 'host-slice-000002',
    dependencies: {
      ...base.dependencies,
      runSourceAnalysis: async () => {
        sourceBRunAnalysisCalls += 1;
        return sourceBAnalysis;
      },
      loadSourceAnalysis: async () => {
        sourceBLoadAnalysisCalls += 1;
        throw new Error('fresh Source B must not load non-existent retained analysis');
      },
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
        actualParticipantJobs: 1 as const,
        decision: validateSolutionDecision({
          schemaVersion: 'solution-decision-v1',
          problemId: `problem-${candidate.hypothesisId}`,
          route: 'SKIP',
          reasonCode: 'NO_PROPOSAL',
          inputs: {
            solutionStatus: 'NO_PROPOSAL', reviewerDecision: null,
            solutionScope: null, reviewScope: null,
            permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
            budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 },
          },
        }),
        solutionInvocationRef: 'solution', reviewerInvocationRef: null,
        problemPackage: {} as never,
      }),
    },
  });
  assert.equal(sourceBRunAnalysisCalls, 1);
  assert.equal(sourceBLoadAnalysisCalls, 0);
  assert.equal(resumedSourceB.currentSourceEpochRef, 'source-epoch-000002');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMultiCandidateSessionSliceTests().then(() => console.log('multiCandidateSessionSlice.test.ts: ok')).catch(error => { console.error(error); process.exit(1); });
}
