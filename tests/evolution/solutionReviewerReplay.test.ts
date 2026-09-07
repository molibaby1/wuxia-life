import assert from 'node:assert/strict';
import { lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  captureAuthoritativeFingerprint,
  prepareAgentWorkspace,
} from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import {
  runSolutionReviewerReplay,
  runSolutionReviewerReplayCli,
} from '../../scripts/evolution/replay/runSolutionReviewerReplay';
import { runSolutionReviewer } from '../../scripts/evolution/problemAgnosticSolution/runSolutionReviewer';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { sha256Hex } from '../../scripts/evolution/phase0/provenance';
import type { ProblemPackageV1 } from '../../src/evolution/problemPackageContract';
import { parseSolutionReview, validateSolutionReview } from '../../src/evolution/solutionReviewContract';
import type { SolutionWorkV1 } from '../../src/evolution/solutionWorkContract';

const problemPackage: ProblemPackageV1 = {
  schemaVersion: 'problem-package-v1',
  problemId: 'problem-replay-000001',
  source: {
    runRef: 'cohort-run-replay-000001',
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: 'feedback-runs/feedback.json',
    improvementHypothesisRef: 'hypothesis-runs/hypotheses.json',
  },
  problem: {
    hypothesisId: 'hypothesis-replay-000001',
    statement: 'A bounded replay fixture problem.',
    observedBasis: 'A bounded replay fixture observation.',
    feedbackRefs: ['observations[0]'],
    evidenceRefs: ['entry-replay-000001'],
    unknowns: ['A bounded replay fixture unknown.'],
    productSignificance: 'It exercises the isolated Reviewer replay path.',
  },
  authorityRefs: ['docs/product/auto-evolution-model.md'],
  productSourceFingerprintSha256: 'a'.repeat(64),
  permissions: {
    authoritativeProductWrite: false,
    sandboxWrite: true,
    productExecution: false,
    codeExecution: false,
  },
};

const solutionWork: SolutionWorkV1 = {
  schemaVersion: 'solution-work-v1',
  status: 'OPTIONS',
  problemId: problemPackage.problemId,
  options: [{
    optionId: 'option-000001',
    proposedChange: 'A bounded replay fixture change.',
    rationale: 'It is supported by the fixture evidence.',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
    changeScope: 'configuration',
    expectedPlayerObservableDifference: 'A bounded fixture difference.',
    risks: [],
    unknowns: [],
  }],
  recommendedOptionId: 'option-000001',
  summary: 'One bounded replay fixture option.',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
};

const review = {
  schemaVersion: 'solution-review-v1',
  problemId: problemPackage.problemId,
  decision: 'ACCEPT_OPTION',
  acceptedOptionId: 'option-000001',
  scopeAssessment: 'config_only',
  assessment: 'The replay fixture is independently reviewed.',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
  concerns: [],
} as const;

const historicalSkillContent = 'historical reviewer skill bytes\n';
const historicalSkillAssignment = {
  identity: 'historical-reviewer-skill',
  version: '2026-09-01',
  canonicalPath: 'skills/historical-reviewer/SKILL.md',
  expectedContentSha256: sha256Hex(historicalSkillContent),
} as const;

interface Fixture {
  root: string;
  experimentRoot: string;
  packagePath: string;
  solutionPath: string;
  artifactRoot: string;
  sourceWorkspace: string;
  sourceInvocationPath: string;
  sourceBaseline: string;
}

interface ParticipantState {
  calls: number;
  workspaceRoots: string[];
}

async function createFixture(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), 'solution-reviewer-replay-'));
  const authoritativeRoot = join(root, 'authoritative');
  const experimentRoot = join(root, 'experiment');
  const artifactRoot = experimentRoot;
  await mkdir(join(authoritativeRoot, 'src'), { recursive: true });
  await mkdir(join(authoritativeRoot, 'skills/historical-reviewer'), { recursive: true });
  await mkdir(join(experimentRoot, 'source'), { recursive: true });
  await mkdir(join(experimentRoot, 'feedback-runs'), { recursive: true });
  await mkdir(join(experimentRoot, 'hypothesis-runs'), { recursive: true });
  await writeFile(join(authoritativeRoot, 'src/example.ts'), 'export const example = true;\n');
  await writeFile(join(authoritativeRoot, historicalSkillAssignment.canonicalPath), historicalSkillContent);
  await writeFile(join(artifactRoot, 'source/observable-payload.json'), '{}\n');
  await writeFile(join(artifactRoot, 'feedback-runs/feedback.json'), 'feedback run artifact\n');
  await writeFile(join(artifactRoot, 'hypothesis-runs/hypotheses.json'), '{}\n');

  const packagePath = join(experimentRoot, 'problem-package.json');
  const packageBytes = `${JSON.stringify(problemPackage)}\n`;
  await writeFile(packagePath, packageBytes);
  const solutionPath = join(experimentRoot, 'solution-agent/result.json');
  await mkdir(join(experimentRoot, 'solution-agent'), { recursive: true });
  await writeFile(solutionPath, `${JSON.stringify(solutionWork)}\n`);

  const prepared = await prepareAgentWorkspace({
    authoritativeRoot,
    destinationRoot: join(experimentRoot, 'agent-workspaces'),
    jobKind: 'reviewer',
    artifactSourceRoot: artifactRoot,
    artifactRelativePaths: ['source/observable-payload.json'],
  });
  const sourceInvocationPath = join(experimentRoot, 'reviewer-agent/invocation.json');
  await mkdir(join(experimentRoot, 'reviewer-agent'), { recursive: true });
  await writeFile(sourceInvocationPath, `${JSON.stringify({
    schemaVersion: 'solution-reviewer-invocation-v2',
    invocationRef: 'historical-reviewer-000001',
    jobNumber: 17,
    role: 'reviewer',
    workspaceBaselineFingerprintSha256: prepared.workspaceBaselineFingerprintSha256,
    problemPackageSha256: sha256Hex(packageBytes),
    participant: 'workspace-capable-agent',
    skillAssignments: [historicalSkillAssignment],
    deliveredSkills: [{
      ...historicalSkillAssignment,
      contentSha256: historicalSkillAssignment.expectedContentSha256,
    }],
    status: 'completed',
  })}\n`);

  return {
    root,
    experimentRoot,
    packagePath,
    solutionPath,
    artifactRoot,
    sourceWorkspace: prepared.workspaceRoot,
    sourceInvocationPath,
    sourceBaseline: prepared.workspaceBaselineFingerprintSha256,
  };
}

function createParticipant(
  output: string,
  state: ParticipantState,
  mutateClone = false,
): WorkspaceAgentParticipantOptions {
  return {
    executable: process.execPath,
    buildArgs: input => {
      state.calls += 1;
      state.workspaceRoots.push(input.workspaceRoot);
      const mutation = mutateClone
        ? "require('node:fs').writeFileSync('src/participant-write.txt', 'clone-only');"
        : '';
      return ['-e', `${mutation}process.stdout.write(process.argv[1]);`, output];
    },
  };
}

function createTopologyParticipant(
  state: ParticipantState,
  requireUndeclaredArtifactAbsent: boolean,
): WorkspaceAgentParticipantOptions {
  return {
    executable: process.execPath,
    buildArgs: input => {
      state.calls += 1;
      state.workspaceRoots.push(input.workspaceRoot);
      return ['-e', [
        "const fs = require('node:fs');",
        "const feedback = fs.readFileSync('../../feedback-runs/feedback.json', 'utf8');",
        "if (feedback !== 'feedback run artifact\\n') throw new Error('feedback topology mismatch');",
        ...(requireUndeclaredArtifactAbsent
          ? ["if (fs.existsSync('../../undeclared-artifact.json')) throw new Error('undeclared artifact copied');"]
          : []),
        `process.stdout.write(${JSON.stringify(JSON.stringify(review))});`,
      ].join('')];
    },
  };
}

function replayInput(fixture: Fixture, participant: WorkspaceAgentParticipantOptions, outputName: string) {
  return {
    problemPackagePath: fixture.packagePath,
    solutionPath: fixture.solutionPath,
    workspacePath: fixture.sourceWorkspace,
    artifactRoot: fixture.artifactRoot,
    sourceInvocationPath: fixture.sourceInvocationPath,
    outputPath: join(fixture.root, outputName),
    participant,
  };
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

async function readSourceInvocation(fixture: Fixture): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(fixture.sourceInvocationPath, 'utf8')) as Record<string, unknown>;
}

async function runWithFixture<T>(callback: (fixture: Fixture) => Promise<T>): Promise<T> {
  const fixture = await createFixture();
  try {
    return await callback(fixture);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
}

export async function runSolutionReviewerReplayTests(): Promise<void> {
  await runWithFixture(async fixture => {
    const productionState: ParticipantState = { calls: 0, workspaceRoots: [] };
    const production = await runSolutionReviewer({
      problemPackage,
      problemPackagePath: fixture.packagePath,
      solutionWork,
      workspaceRoot: fixture.sourceWorkspace,
      artifactRoot: fixture.artifactRoot,
      workspaceBaselineFingerprintSha256: fixture.sourceBaseline,
      invocationRef: 'production-topology-000001',
      jobNumber: 17,
      destinationRoot: join(fixture.root, 'production-topology'),
      skillAssignments: [historicalSkillAssignment],
      participant: createTopologyParticipant(productionState, false),
    });
    assert.equal(production.ok, true, production.ok ? undefined : production.message);
    assert.equal(productionState.calls, 1);

    await writeFile(join(fixture.experimentRoot, 'undeclared-artifact.json'), 'must not be replayed\n');
    const replayState: ParticipantState = { calls: 0, workspaceRoots: [] };
    const replay = await runSolutionReviewerReplay(
      replayInput(fixture, createTopologyParticipant(replayState, true), 'replay-topology'),
    );
    assert.equal(replay.ok, true, replay.ok ? undefined : replay.message);
    assert.equal(replayState.calls, 1);
    assert.match(replayState.workspaceRoots[0] ?? '', /agent-workspaces[\\/]reviewer$/);
  });

  await runWithFixture(async fixture => {
    await rm(join(fixture.artifactRoot, problemPackage.source.externalFeedbackRef));
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionReviewerReplay(replayInput(fixture, createParticipant(JSON.stringify(review), state), 'replay-missing-artifact')),
      /declared replay artifact.*does not exist/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    await writeFile(join(fixture.artifactRoot, problemPackage.source.observablePayloadRef), 'mutated artifact bytes\n');
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionReviewerReplay(replayInput(fixture, createParticipant(JSON.stringify(review), state), 'replay-artifact-mismatch')),
      /artifact hash mismatch/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    const sourceBefore = await captureAuthoritativeFingerprint(fixture.sourceWorkspace);
    const result = await runSolutionReviewerReplay(
      replayInput(fixture, createParticipant(JSON.stringify(review), state, true), 'replay-success'),
    );
    assert.equal(result.ok, true, result.ok ? undefined : result.message);
    assert.equal(state.calls, 1);
    assert.notEqual(state.workspaceRoots[0], fixture.sourceWorkspace);
    assert.equal(await pathExists(state.workspaceRoots[0] ?? ''), false);
    assert.equal(await captureAuthoritativeFingerprint(fixture.sourceWorkspace), sourceBefore);
    assert.equal(await pathExists(join(fixture.sourceWorkspace, 'src/participant-write.txt')), false);

    const outputRoot = join(fixture.root, 'replay-success');
    const persistedReview = JSON.parse(await readFile(join(outputRoot, 'review.json'), 'utf8')) as unknown;
    assert.deepEqual(validateSolutionReview(persistedReview), persistedReview);
    assert.equal(await pathExists(join(outputRoot, 'invocation.json')), true);
    assert.equal(await pathExists(join(outputRoot, 'raw-output.txt')), true);
    const replayInvocation = JSON.parse(await readFile(join(outputRoot, 'invocation.json'), 'utf8')) as Record<string, unknown>;
    assert.equal(replayInvocation.invocationRef, 'historical-reviewer-000001-replay');
    assert.equal(replayInvocation.jobNumber, 17);
    assert.equal(replayInvocation.workspaceBaselineFingerprintSha256, fixture.sourceBaseline);
    assert.deepEqual(replayInvocation.skillAssignments, [historicalSkillAssignment]);
    assert.match(await readFile(join(outputRoot, 'raw-output.txt'), 'utf8'), /option-000001/);
  });

  await runWithFixture(async fixture => {
    await writeFile(join(fixture.sourceWorkspace, 'src/example.ts'), 'mutated historical workspace\n');
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionReviewerReplay(replayInput(fixture, createParticipant(JSON.stringify(review), state), 'replay-mutated')),
      /historical frozen Reviewer input is no longer pristine/i,
    );
    assert.equal(state.calls, 0);
    assert.equal(await pathExists(join(fixture.root, 'replay-mutated')), false);
  });

  await runWithFixture(async fixture => {
    const invocation = await readSourceInvocation(fixture);
    invocation.workspaceBaselineFingerprintSha256 = 'b'.repeat(64);
    await writeFile(fixture.sourceInvocationPath, `${JSON.stringify(invocation)}\n`);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionReviewerReplay(replayInput(fixture, createParticipant(JSON.stringify(review), state), 'replay-baseline')),
      /workspace baseline fingerprint mismatch/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    const manifestPath = join(fixture.sourceWorkspace, '.agent-workspace-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
    manifest.jobKind = 'solution';
    await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionReviewerReplay(replayInput(fixture, createParticipant(JSON.stringify(review), state), 'replay-job-kind')),
      /jobKind.*reviewer/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    const manifestPath = join(fixture.sourceWorkspace, '.agent-workspace-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
    manifest.authoritativeFingerprintSha256 = 'not-a-sha256';
    await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionReviewerReplay(replayInput(fixture, createParticipant(JSON.stringify(review), state), 'replay-manifest-authority-hash')),
      /authoritativeFingerprintSha256.*SHA-256/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    const invocation = await readSourceInvocation(fixture);
    invocation.problemPackageSha256 = 'c'.repeat(64);
    await writeFile(fixture.sourceInvocationPath, `${JSON.stringify(invocation)}\n`);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionReviewerReplay(replayInput(fixture, createParticipant(JSON.stringify(review), state), 'replay-package-hash')),
      /problem-package.*hash/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    const invalidSolution = { ...solutionWork, status: 'NO_PROPOSAL', options: [], recommendedOptionId: undefined };
    await writeFile(fixture.solutionPath, `${JSON.stringify(invalidSolution)}\n`);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionReviewerReplay(replayInput(fixture, createParticipant(JSON.stringify(review), state), 'replay-invalid-status')),
      /status.*OPTIONS|Reviewer input/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    const mismatchedSolution = { ...solutionWork, problemId: 'different-problem' };
    await writeFile(fixture.solutionPath, `${JSON.stringify(mismatchedSolution)}\n`);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionReviewerReplay(replayInput(fixture, createParticipant(JSON.stringify(review), state), 'replay-invalid-problem')),
      /problemId/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    const outputPath = join(fixture.root, 'replay-existing');
    await mkdir(outputPath);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionReviewerReplay(replayInput(fixture, createParticipant(JSON.stringify(review), state), 'replay-existing')),
      /output.*already exists/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    const invocation = await readSourceInvocation(fixture);
    const currentSkillAssignment = {
      identity: 'current-constant-must-not-be-used',
      version: 'current',
      canonicalPath: 'skills/current/SKILL.md',
    };
    invocation.skillAssignments = [historicalSkillAssignment];
    await writeFile(fixture.sourceInvocationPath, `${JSON.stringify(invocation)}\n`);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    let prompt = '';
    const participant = createParticipant(JSON.stringify(review), state);
    const originalBuildArgs = participant.buildArgs;
    participant.buildArgs = input => {
      prompt = input.prompt;
      return originalBuildArgs(input);
    };
    assert.notDeepEqual(invocation.skillAssignments, [currentSkillAssignment]);
    const result = await runSolutionReviewerReplay(replayInput(fixture, participant, 'replay-historical-skill'));
    assert.equal(result.ok, true, result.ok ? undefined : result.message);
    assert.match(prompt, /historical-reviewer-skill/);
    assert.match(prompt, /historical reviewer skill bytes/);
    assert.doesNotMatch(prompt, /current-constant-must-not-be-used/);
  });

  await runWithFixture(async fixture => {
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    const result = await runSolutionReviewerReplay(
      replayInput(fixture, createParticipant('not-a-solution-review', state), 'replay-invalid-output'),
    );
    assert.equal(result.ok, false);
    assert.equal(state.calls, 1);
    assert.equal(result.ok ? undefined : result.errorKind, 'invalid_output');
    const failure = JSON.parse(await readFile(join(fixture.root, 'replay-invalid-output/failure.json'), 'utf8')) as Record<string, unknown>;
    assert.equal(failure.errorKind, 'invalid_output');
    assert.equal(await readFile(join(fixture.root, 'replay-invalid-output/raw-output.txt'), 'utf8'), 'not-a-solution-review');
  });

  await assert.rejects(
    () => runSolutionReviewerReplayCli([]),
    /missing required argument: --problem-package/i,
  );
  await assert.rejects(
    () => runSolutionReviewerReplayCli(['--problem-package', 'package.json', '--unexpected', 'value']),
    /unknown argument/i,
  );
  await assert.rejects(
    () => runSolutionReviewerReplayCli(['--problem-package', 'package.json', '--problem-package', 'other.json']),
    /duplicate argument/i,
  );
  await assert.rejects(
    () => runSolutionReviewerReplayCli([
      '--problem-package', 'missing-package.json',
      '--solution', 'missing-solution.json',
      '--workspace', 'missing-workspace',
      '--artifact-root', 'missing-artifacts',
      '--source-invocation', 'missing-invocation.json',
      '--output', 'new-output',
      '--participant-binding', 'UNSUPPORTED',
    ]),
    /unsupported binding|PARTICIPANT_BINDING_UNAVAILABLE/i,
  );

  await runWithFixture(async fixture => {
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionReviewerReplay({
        ...replayInput(fixture, createParticipant(JSON.stringify(review), state), 'replay-missing-input'),
        problemPackagePath: join(fixture.root, 'missing-package.json'),
      }),
      /does not exist/i,
    );
    assert.equal(state.calls, 0);
  });

  assert.equal(parseSolutionReview(JSON.stringify(review)).problemId, problemPackage.problemId);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSolutionReviewerReplayTests()
    .then(() => console.log('solutionReviewerReplay.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
