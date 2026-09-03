import assert from 'node:assert/strict';
import { lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { emptyMatchingPlayerSurfaceArtifacts } from '../../scripts/evolution/causalAttribution/emptyMatchingPlayerSurfaceArtifacts';
import {
  captureAuthoritativeFingerprint,
} from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import {
  runProblemAgnosticAgentSolutionLoop,
  type FixedSourcePreflight,
} from '../../scripts/evolution/runProblemAgnosticAgentSolutionLoop';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import type { SolutionAgentRunResult } from '../../scripts/evolution/problemAgnosticSolution/runSolutionAgent';
import type { SolutionReviewerRunResult } from '../../scripts/evolution/problemAgnosticSolution/runSolutionReviewer';
import type { HumanFollowupWorkItemV1 } from '../../src/evolution/humanFollowupWorkItemContract';
import { validateSolutionReview, type SolutionReviewV1 } from '../../src/evolution/solutionReviewContract';
import { validateSolutionWork, type SolutionWorkV1 } from '../../src/evolution/solutionWorkContract';
import { sha256Hex } from '../../scripts/evolution/phase0/provenance';

const sourceRunRef = 'cohort-run-000001';
const authorityRefs = [
  'docs/product/player-model.md',
  'docs/product/auto-evolution-model.md',
  'docs/governance/project-convergence.md',
  'docs/governance/product-decisions.md',
  'docs/governance/current-product-stage.md',
  'docs/governance/ai-collaboration-workflow.md',
];

const fakeParticipant: WorkspaceAgentParticipantOptions = {
  executable: 'fake-workspace-agent',
  buildArgs: () => [],
};

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
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

async function createFixture(): Promise<{
  root: string;
  sourceRoot: string;
  experimentRoot: string;
  preflight: FixedSourcePreflight;
}> {
  const root = await mkdtemp(join(tmpdir(), 'human-followup-loop-integration-'));
  for (const reference of authorityRefs) {
    await mkdir(dirname(join(root, reference)), { recursive: true });
    await writeFile(join(root, reference), `authority fixture: ${reference}\n`);
  }
  const sourceRoot = join(root, 'sealed-source');
  const experimentRoot = join(root, '.tmp/evolution/problem-agnostic-agent-solution-loop');
  const matching = emptyMatchingPlayerSurfaceArtifacts();
  await writeJson(join(sourceRoot, 'internal/player-surface-source.json'), matching.surface);
  await mkdir(dirname(join(sourceRoot, 'reviewer-input/observable-payload.json')), { recursive: true });
  await writeFile(join(sourceRoot, 'reviewer-input/observable-payload.json'), matching.observableBytes);
  return {
    root,
    sourceRoot,
    experimentRoot,
    preflight: {
      sourceRunRef,
      sourceRoot,
      experimentRootHash: 'a'.repeat(64),
      observablePayloadHash: sha256Hex(matching.observableBytes),
      sourceFingerprintSha256: 'c'.repeat(64),
    },
  };
}

function solutionFor(status: 'ESCALATE' | 'OPTIONS' | 'NO_PROPOSAL' | 'INSUFFICIENT_EVIDENCE'): SolutionWorkV1 {
  return validateSolutionWork(status === 'OPTIONS'
    ? {
      schemaVersion: 'solution-work-v1',
      status,
      problemId: 'problem-hypothesis-000001',
      options: [{
        optionId: 'option-000001',
        proposedChange: 'A bounded candidate change.',
        rationale: 'The evidence supports a reviewable candidate.',
        repoRefs: [],
        artifactRefs: [],
        changeScope: 'program',
        expectedPlayerObservableDifference: 'A player-observable difference.',
        risks: [],
        unknowns: [],
      }],
      recommendedOptionId: 'option-000001',
      summary: 'One reviewable option.',
      repoRefs: [],
      artifactRefs: [],
    }
    : {
      schemaVersion: 'solution-work-v1',
      status,
      problemId: 'problem-hypothesis-000001',
      options: [],
      summary: `Solution status: ${status}.`,
      repoRefs: [],
      artifactRefs: [],
    });
}

function reviewFor(decision: SolutionReviewV1['decision']): SolutionReviewV1 {
  return validateSolutionReview(decision === 'ACCEPT_OPTION'
    ? {
      schemaVersion: 'solution-review-v1',
      problemId: 'problem-hypothesis-000001',
      decision,
      acceptedOptionId: 'option-000001',
      scopeAssessment: 'code_required',
      assessment: 'The option is reviewable within the requested boundary.',
      repoRefs: [],
      artifactRefs: [],
      concerns: [],
    }
    : {
      schemaVersion: 'solution-review-v1',
      problemId: 'problem-hypothesis-000001',
      decision,
      assessment: `Reviewer decision: ${decision}.`,
      repoRefs: [],
      artifactRefs: [],
      concerns: [],
    });
}

async function runCase(input: {
  solutionStatus: 'ESCALATE' | 'OPTIONS' | 'NO_PROPOSAL' | 'INSUFFICIENT_EVIDENCE';
  reviewerDecision?: SolutionReviewV1['decision'];
  solutionScope?: 'configuration' | 'program';
  reviewScope?: 'config_only' | 'code_required';
  writeSolutionArtifact?: boolean;
}): Promise<{
  fixture: Awaited<ReturnType<typeof createFixture>>;
  result: Awaited<ReturnType<typeof runProblemAgnosticAgentSolutionLoop>>;
  solutionCalls: number;
  reviewerCalls: number;
  authoritativeFingerprintBefore: string;
}> {
  const fixture = await createFixture();
  const authoritativeFingerprintBefore = await captureAuthoritativeFingerprint(fixture.root);
  let solutionCalls = 0;
  let reviewerCalls = 0;
  const solution = solutionFor(input.solutionStatus);
  if (input.solutionScope) {
    solution.options[0]!.changeScope = input.solutionScope;
  }
  const result = await runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: fixture.root,
    experimentRoot: fixture.experimentRoot,
    fixedSourceRoot: fixture.sourceRoot,
    apiKey: 'test-key',
    workspaceAgentParticipant: fakeParticipant,
    authorityRefs,
    dependencies: {
      preflightFixedSource: async () => fixture.preflight,
      runExternalFeedback: async options => {
        await writeJson(join(options.outRoot!, `feedback-runs/${sourceRunRef}/feedback.json`), {
          overallImpression: 'A retained external feedback result.',
        });
        return {
          runRef: options.runRef,
          invocationRef: 'feedback-000001',
          phase0RunPath: fixture.sourceRoot,
          feedbackDir: join(options.outRoot!, `feedback-runs/${sourceRunRef}`),
          humanReportPath: join(options.outRoot!, `feedback-runs/${sourceRunRef}/human-review.md`),
          observablePayloadHash: fixture.preflight.observablePayloadHash,
          experimentRootHash: fixture.preflight.experimentRootHash,
        };
      },
      runImprovementHypothesis: async options => {
        await writeJson(join(options.outRoot!, `hypothesis-runs/${sourceRunRef}/hypotheses.json`), {
          hypotheses: [{
            hypothesis: 'A generic observed problem.',
            observedBasis: 'Observed in the fixed source.',
            feedbackRefs: ['overallImpression'],
            evidenceRefs: [],
            unknowns: ['Cause remains unknown.'],
            productSignificance: 'It may affect the player experience.',
          }],
        });
        return {
          runRef: options.runRef,
          feedbackInvocationRef: 'feedback-000001',
          hypothesisInvocationRef: 'hypothesis-000001',
          hypothesisDir: join(options.outRoot!, `hypothesis-runs/${sourceRunRef}`),
          humanReportPath: join(options.outRoot!, `hypothesis-runs/${sourceRunRef}/human-review.md`),
          experimentRootHash: fixture.preflight.experimentRootHash,
          observablePayloadHash: fixture.preflight.observablePayloadHash,
          feedbackHash: 'd'.repeat(64),
        };
      },
      runSolutionAgent: async job => {
        solutionCalls += 1;
        if (input.writeSolutionArtifact !== false) await writeJson(join(job.destinationRoot, 'result.json'), solution);
        return {
          ok: true,
          result: solution,
          invocationPath: join(job.destinationRoot, 'invocation.json'),
          rawOutputPath: join(job.destinationRoot, 'raw-output.txt'),
          resultPath: join(job.destinationRoot, 'result.json'),
        } satisfies SolutionAgentRunResult;
      },
      runSolutionReviewer: async job => {
        reviewerCalls += 1;
        const review = reviewFor(input.reviewerDecision ?? 'ACCEPT_OPTION');
        if (input.solutionScope) {
          review.scopeAssessment = input.reviewScope ?? 'code_required';
        }
        await writeJson(join(job.destinationRoot, 'review.json'), review);
        return {
          ok: true,
          review,
          invocationPath: join(job.destinationRoot, 'invocation.json'),
          rawOutputPath: join(job.destinationRoot, 'raw-output.txt'),
          reviewPath: join(job.destinationRoot, 'review.json'),
        } satisfies SolutionReviewerRunResult;
      },
    },
  });
  return { fixture, result, solutionCalls, reviewerCalls, authoritativeFingerprintBefore };
}

async function runParticipantFailureCase(): Promise<{
  fixture: Awaited<ReturnType<typeof createFixture>>;
  result: Awaited<ReturnType<typeof runProblemAgnosticAgentSolutionLoop>>;
}> {
  const fixture = await createFixture();
  const result = await runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: fixture.root,
    experimentRoot: fixture.experimentRoot,
    fixedSourceRoot: fixture.sourceRoot,
    participantMode: 'local-subagent',
    workspaceAgentParticipant: fakeParticipant,
    authorityRefs,
    dependencies: {
      preflightFixedSource: async () => fixture.preflight,
      runExternalFeedback: async options => {
        const path = join(options.outRoot!, `feedback-runs/${sourceRunRef}`);
        await writeJson(join(path, 'invocation.json'), {
          schemaVersion: 'minimal-external-feedback-invocation-v1',
          runRef: sourceRunRef,
          invocationRef: `${sourceRunRef}-local-player-feedback-001`,
          participant: { provider: 'codex-local-subagent' },
          status: 'failed',
          errorKind: 'process',
        });
        await writeFile(join(path, 'human-review.md'), 'failure evidence');
        throw new Error('simulated Participant failure');
      },
    },
  });
  return { fixture, result };
}

async function runStandaloneEscalationWithoutInstanceRef(
  fixture: Awaited<ReturnType<typeof createFixture>>,
): Promise<Awaited<ReturnType<typeof runProblemAgnosticAgentSolutionLoop>>> {
  const solution = solutionFor('ESCALATE');
  return runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: fixture.root,
    experimentRoot: fixture.experimentRoot,
    fixedSourceRoot: fixture.sourceRoot,
    apiKey: 'test-key',
    workspaceAgentParticipant: fakeParticipant,
    authorityRefs,
    dependencies: {
      preflightFixedSource: async () => fixture.preflight,
      runExternalFeedback: async options => {
        await writeJson(join(options.outRoot!, `feedback-runs/${sourceRunRef}/feedback.json`), {
          overallImpression: 'A retained external feedback result.',
        });
        return {
          runRef: options.runRef,
          invocationRef: 'feedback-000001',
          phase0RunPath: fixture.sourceRoot,
          feedbackDir: join(options.outRoot!, `feedback-runs/${sourceRunRef}`),
          humanReportPath: join(options.outRoot!, `feedback-runs/${sourceRunRef}/human-review.md`),
          observablePayloadHash: fixture.preflight.observablePayloadHash,
          experimentRootHash: fixture.preflight.experimentRootHash,
        };
      },
      runImprovementHypothesis: async options => {
        await writeJson(join(options.outRoot!, `hypothesis-runs/${sourceRunRef}/hypotheses.json`), {
          hypotheses: [{
            hypothesis: 'A generic observed problem.',
            observedBasis: 'Observed in the fixed source.',
            feedbackRefs: ['overallImpression'],
            evidenceRefs: [],
            unknowns: ['Cause remains unknown.'],
            productSignificance: 'It may affect the player experience.',
          }],
        });
        return {
          runRef: options.runRef,
          feedbackInvocationRef: 'feedback-000001',
          hypothesisInvocationRef: 'hypothesis-000001',
          hypothesisDir: join(options.outRoot!, `hypothesis-runs/${sourceRunRef}`),
          humanReportPath: join(options.outRoot!, `hypothesis-runs/${sourceRunRef}/human-review.md`),
          experimentRootHash: fixture.preflight.experimentRootHash,
          observablePayloadHash: fixture.preflight.observablePayloadHash,
          feedbackHash: 'd'.repeat(64),
        };
      },
      runSolutionAgent: async job => {
        await writeJson(join(job.destinationRoot, 'result.json'), solution);
        return {
          ok: true,
          result: solution,
          invocationPath: join(job.destinationRoot, 'invocation.json'),
          rawOutputPath: join(job.destinationRoot, 'raw-output.txt'),
          resultPath: join(job.destinationRoot, 'result.json'),
        } satisfies SolutionAgentRunResult;
      },
      runSolutionReviewer: async () => {
        throw new Error('reviewer must not run for explicit escalation');
      },
    },
  });
}

async function loadRetainedItems(repositoryRoot: string): Promise<HumanFollowupWorkItemV1[]> {
  const itemsRoot = join(repositoryRoot, 'artifacts/evolution/human-follow-up/items');
  const itemIds = (await readdir(itemsRoot)).sort();
  return Promise.all(itemIds.map(async itemId =>
    JSON.parse(await readFile(join(itemsRoot, itemId, 'item.json'), 'utf8')) as HumanFollowupWorkItemV1));
}

async function runSamePathIndependentExecutionRegression(): Promise<void> {
  const fixture = await createFixture();

  const first = await runStandaloneEscalationWithoutInstanceRef(fixture);
  assert.equal(first.status, 'completed');
  assert.equal(first.decision.route, 'ESCALATE_HUMAN');
  const firstDecisionBytes = await readFile(first.decisionPath);

  await rm(fixture.experimentRoot, { recursive: true, force: true });

  const second = await runStandaloneEscalationWithoutInstanceRef(fixture);
  assert.equal(second.status, 'completed');
  assert.equal(second.decision.route, 'ESCALATE_HUMAN');
  const secondDecisionBytes = await readFile(second.decisionPath);
  assert.equal(Buffer.compare(firstDecisionBytes, secondDecisionBytes), 0);

  const items = await loadRetainedItems(fixture.root);
  assert.equal(items.length, 2);
  const [itemA, itemB] = items;
  assert.notEqual(itemA!.provenance.workflowInstanceRef, itemB!.provenance.workflowInstanceRef);
  assert.equal(itemA!.provenance.sourceRunRef, sourceRunRef);
  assert.equal(itemB!.provenance.sourceRunRef, sourceRunRef);
  assert.equal(itemA!.provenance.decisionSha256, itemB!.provenance.decisionSha256);
  assert.notEqual(itemA!.itemId, itemB!.itemId);
}

export async function runHumanFollowupSolutionLoopIntegrationTests(): Promise<void> {
  const explicit = await runCase({ solutionStatus: 'ESCALATE' });
  assert.equal(explicit.result.status, 'completed');
  assert.equal(explicit.result.decision.route, 'ESCALATE_HUMAN');
  assert.equal(explicit.solutionCalls, 1);
  assert.equal(explicit.reviewerCalls, 0);
  const explicitItems = await readdir(join(explicit.fixture.root, 'artifacts/evolution/human-follow-up/items'));
  assert.equal(explicitItems.length, 1);
  assert.equal(JSON.parse(await readFile(join(explicit.fixture.root, 'artifacts/evolution/human-follow-up/items', explicitItems[0]!, 'item.json'), 'utf8')).status, 'OPEN');
  assert.equal(await captureAuthoritativeFingerprint(explicit.fixture.root), explicit.authoritativeFingerprintBefore);

  const outOfScope = await runCase({
    solutionStatus: 'OPTIONS',
    reviewerDecision: 'ACCEPT_OPTION',
    solutionScope: 'program',
    reviewScope: 'code_required',
  });
  assert.equal(outOfScope.result.decision.reasonCode, 'ACCEPTED_OUT_OF_SCOPE');
  assert.equal((await readdir(join(outOfScope.fixture.root, 'artifacts/evolution/human-follow-up/items'))).length, 1);

  for (const input of [
    { solutionStatus: 'NO_PROPOSAL' as const },
    { solutionStatus: 'INSUFFICIENT_EVIDENCE' as const },
    { solutionStatus: 'OPTIONS' as const, reviewerDecision: 'REQUEST_MORE_WORK' as const },
    { solutionStatus: 'OPTIONS' as const, reviewerDecision: 'ACCEPT_OPTION' as const, solutionScope: 'configuration' as const, reviewScope: 'config_only' as const },
  ]) {
    const nonEscalation = await runCase(input);
    assert.notEqual(nonEscalation.result.decision.route, 'ESCALATE_HUMAN');
    assert.equal(await pathExists(join(nonEscalation.fixture.root, 'artifacts/evolution/human-follow-up/items')), false);
  }

  const failure = await runParticipantFailureCase();
  assert.equal(failure.result.status, 'participant_failure');
  assert.equal(failure.result.outcome.route, 'DEFER');
  assert.equal(failure.result.decisionPath, null);
  assert.equal(await pathExists(join(failure.fixture.experimentRoot, 'decision.json')), false);
  assert.equal(await pathExists(join(failure.fixture.root, 'artifacts/evolution/human-follow-up/items')), false);

  await assert.rejects(
    () => runCase({ solutionStatus: 'ESCALATE', writeSolutionArtifact: false }),
    /required evidence|solution-agent\/result\.json/i,
  );

  await runSamePathIndependentExecutionRegression();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHumanFollowupSolutionLoopIntegrationTests()
    .then(() => console.log('humanFollowupSolutionLoopIntegration.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
