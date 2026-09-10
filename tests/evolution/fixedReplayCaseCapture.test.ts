import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { promisify } from 'node:util';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  readdir,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  captureAuthoritativeFingerprint,
  prepareAgentWorkspace,
} from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import {
  captureFixedReplayCase,
  runFixedReplayCaseCli,
} from '../../scripts/evolution/replay/captureFixedReplayCase';
import { sha256Hex } from '../../scripts/evolution/phase0/provenance';
import type { ProblemPackageV2 } from '../../src/evolution/problemPackageContract';
import type { SolutionWorkV1 } from '../../src/evolution/solutionWorkContract';

const execFileAsync = promisify(execFile);

const workflowIdentity = 'problem-agnostic-agent-solution-loop-instance-000001/round-1';
const sessionId = 'ordinary-run-replay-fixture-000001';
const packageArtifactRefs = [
  'source/observable-payload.json',
  'diagnostic/causal-attribution.json',
  'feedback-runs/ordinary-run-replay-fixture-000001/feedback.json',
  'hypothesis-runs/ordinary-run-replay-fixture-000001/hypotheses.json',
] as const;
const solutionOnlyArtifactRef = 'solution-only/solution-note.json';
const allArtifactRefs = [...packageArtifactRefs, solutionOnlyArtifactRef] as const;

const historicalSkillContent = 'historical repository-grounded skill bytes\n';
const historicalSkillAssignment = {
  identity: 'repository-grounded-investigation',
  version: '1',
  canonicalPath: 'skills/repository-grounded-investigation/SKILL.md',
  expectedContentSha256: sha256Hex(historicalSkillContent),
} as const;

const problemPackage: ProblemPackageV2 = {
  schemaVersion: 'problem-package-v2',
  problemId: 'problem-replay-fixture-000001',
  source: {
    runRef: sessionId,
    observablePayloadRef: packageArtifactRefs[0],
    externalFeedbackRef: packageArtifactRefs[2],
    improvementHypothesisRef: packageArtifactRefs[3],
    diagnosticEvidenceRefs: [packageArtifactRefs[1]],
  },
  problem: {
    hypothesisId: 'hypothesis-replay-fixture-000001',
    statement: 'A bounded durable replay capture fixture problem.',
    observedBasis: 'A bounded durable replay capture fixture observation.',
    feedbackRefs: ['observations[0]'],
    evidenceRefs: ['entry-replay-fixture-000001'],
    unknowns: ['A bounded durable replay capture fixture unknown.'],
    productSignificance: 'It exercises durable replay provenance capture.',
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
    proposedChange: 'A bounded durable replay capture fixture change.',
    rationale: 'It is supported by the fixture evidence.',
    repoRefs: ['src/example.ts'],
    artifactRefs: [solutionOnlyArtifactRef],
    changeScope: 'configuration',
    expectedPlayerObservableDifference: 'A bounded fixture difference.',
    risks: [],
    unknowns: [],
  }],
  recommendedOptionId: 'option-000001',
  summary: 'One bounded durable replay capture fixture option.',
  repoRefs: ['src/example.ts'],
  artifactRefs: [packageArtifactRefs[0]],
};

interface Fixture {
  root: string;
  sourceRoot: string;
  workflowRoot: string;
  reportPath: string;
  outputPath: string;
  packagePath: string;
  solutionWorkspace: string;
  reviewerWorkspace: string;
  solutionInvocationPath: string;
  reviewerInvocationPath: string;
  solutionResultPath: string;
  reviewerResultPath: string;
  decisionPath: string;
  sourceBaseline: string;
  reviewerBaseline: string;
  artifactPaths: Record<string, string>;
}

interface WorkspaceManifestEntry {
  path: string;
  objectKind: 'regular_file' | 'symlink';
  sha256: string;
}

async function writeJson(path: string, value: unknown): Promise<Buffer> {
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, bytes);
  return bytes;
}

async function createFixture(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), 'fixed-replay-case-capture-'));
  const sourceRoot = join(root, 'source', sessionId);
  const workflowRoot = join(sourceRoot, workflowIdentity);
  const reportPath = join(root, 'report.json');
  const outputPath = join(root, 'fixed-case');
  const packagePath = join(workflowRoot, 'problem-package.json');
  const solutionWorkspace = join(workflowRoot, 'agent-workspaces/solution');
  const reviewerWorkspace = join(workflowRoot, 'agent-workspaces/reviewer');
  const solutionInvocationPath = join(workflowRoot, 'solution-agent/invocation.json');
  const reviewerInvocationPath = join(workflowRoot, 'reviewer-agent/invocation.json');
  const solutionResultPath = join(workflowRoot, 'solution-agent/result.json');
  const reviewerResultPath = join(workflowRoot, 'reviewer-agent/review.json');
  const decisionPath = join(workflowRoot, 'decision.json');
  const authoritativeRoot = join(root, 'authoritative');

  await mkdir(join(authoritativeRoot, 'src'), { recursive: true });
  await mkdir(join(authoritativeRoot, 'skills/repository-grounded-investigation'), { recursive: true });
  await writeFile(join(authoritativeRoot, 'src/example.ts'), 'export const example = true;\n');
  await writeFile(
    join(authoritativeRoot, historicalSkillAssignment.canonicalPath),
    historicalSkillContent,
  );
  await symlink('example.ts', join(authoritativeRoot, 'src/example-link.ts'));

  const artifactPaths = Object.fromEntries(
    allArtifactRefs.map(relativePath => [relativePath, join(workflowRoot, relativePath)]),
  ) as Record<string, string>;
  for (const [relativePath, path] of Object.entries(artifactPaths)) {
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, `${relativePath}\n`);
  }

  const packageBytes = await writeJson(packagePath, problemPackage);
  const preparedSolution = await prepareAgentWorkspace({
    authoritativeRoot,
    destinationRoot: join(workflowRoot, 'agent-workspaces'),
    jobKind: 'solution',
    artifactSourceRoot: workflowRoot,
    artifactRelativePaths: [...allArtifactRefs],
  });
  const preparedReviewer = await prepareAgentWorkspace({
    authoritativeRoot,
    destinationRoot: join(workflowRoot, 'agent-workspaces'),
    jobKind: 'reviewer',
    artifactSourceRoot: workflowRoot,
    artifactRelativePaths: [...allArtifactRefs],
  });

  const invocationCommon = {
    participant: 'workspace-capable-agent',
    problemPackageSha256: sha256Hex(packageBytes),
    skillAssignments: [historicalSkillAssignment],
    deliveredSkills: [{
      ...historicalSkillAssignment,
      contentSha256: historicalSkillAssignment.expectedContentSha256,
    }],
    status: 'completed',
  };
  await writeJson(solutionInvocationPath, {
    schemaVersion: 'solution-agent-invocation-v2',
    invocationRef: 'solution-agent-replay-fixture-000001',
    jobNumber: 3,
    role: 'solution',
    workspaceBaselineFingerprintSha256: preparedSolution.workspaceBaselineFingerprintSha256,
    ...invocationCommon,
  });
  await writeJson(reviewerInvocationPath, {
    schemaVersion: 'solution-reviewer-invocation-v2',
    invocationRef: 'solution-reviewer-replay-fixture-000001',
    jobNumber: 4,
    role: 'reviewer',
    workspaceBaselineFingerprintSha256: preparedReviewer.workspaceBaselineFingerprintSha256,
    ...invocationCommon,
  });
  await writeJson(solutionResultPath, solutionWork);
  await writeJson(reviewerResultPath, {
    schemaVersion: 'solution-review-v1',
    problemId: problemPackage.problemId,
    decision: 'REQUEST_MORE_WORK',
    assessment: 'A bounded fixture review.',
    repoRefs: ['src/example.ts'],
    artifactRefs: [packageArtifactRefs[0]],
    concerns: [],
  });
  await writeJson(decisionPath, {
    schemaVersion: 'solution-decision-v1',
    problemId: problemPackage.problemId,
    route: 'DEFER_MORE_WORK_REQUESTED',
    reasonCode: 'REVIEW_REQUEST_MORE_WORK',
    inputs: {
      solutionStatus: 'OPTIONS',
      reviewerDecision: 'REQUEST_MORE_WORK',
      solutionScope: 'configuration',
      reviewScope: null,
      permissions: problemPackage.permissions,
      budget: { actualParticipantJobs: 4, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
  await writeJson(reportPath, {
    schemaVersion: 'auto-evolution-operational-run-report-v4',
    reportId: 'ae-report-replay-fixture-000001',
    createdAt: '2026-09-10T00:00:00.000Z',
    sourceRoot,
    workflows: [{
      identity: workflowIdentity,
      sourceRunRef: sessionId,
      status: 'DEFER_MORE_WORK_REQUESTED',
      solutionStatus: 'OPTIONS',
      reviewerDecision: 'REQUEST_MORE_WORK',
    }],
  });

  return {
    root,
    sourceRoot,
    workflowRoot,
    reportPath,
    outputPath,
    packagePath,
    solutionWorkspace,
    reviewerWorkspace,
    solutionInvocationPath,
    reviewerInvocationPath,
    solutionResultPath,
    reviewerResultPath,
    decisionPath,
    sourceBaseline: preparedSolution.workspaceBaselineFingerprintSha256,
    reviewerBaseline: preparedReviewer.workspaceBaselineFingerprintSha256,
    artifactPaths,
  };
}

async function pathExists(path: string): Promise<boolean> {
  return lstat(path).then(() => true, () => false);
}

async function expectRejected(action: () => Promise<unknown>, pattern: RegExp): Promise<void> {
  await assert.rejects(action, pattern);
}

async function withFixture(run: (fixture: Fixture) => Promise<void>): Promise<void> {
  const fixture = await createFixture();
  try {
    await run(fixture);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
}

async function rewriteProblemPackage(fixture: Fixture, mutate: (value: ProblemPackageV2) => void): Promise<void> {
  const value = JSON.parse(await readFile(fixture.packagePath, 'utf8')) as ProblemPackageV2;
  mutate(value);
  const bytes = await writeJson(fixture.packagePath, value);
  for (const path of [fixture.solutionInvocationPath, fixture.reviewerInvocationPath]) {
    const invocation = JSON.parse(await readFile(path, 'utf8')) as { problemPackageSha256: string };
    invocation.problemPackageSha256 = sha256Hex(bytes);
    await writeJson(path, invocation);
  }
}

async function readWorkspaceManifest(path: string): Promise<{
  workspaceBaselineFingerprintSha256: string;
  entries: WorkspaceManifestEntry[];
}> {
  return JSON.parse(await readFile(join(path, '.agent-workspace-manifest.json'), 'utf8')) as {
    workspaceBaselineFingerprintSha256: string;
    entries: WorkspaceManifestEntry[];
  };
}

async function hashWorkspaceObject(path: string, objectKind: WorkspaceManifestEntry['objectKind']): Promise<string> {
  if (objectKind === 'regular_file') return sha256Hex(await readFile(path));
  return sha256Hex(await readlink(path, { encoding: 'buffer' }));
}

async function testValidCaptureAndCopiedWorkspace(): Promise<void> {
  await withFixture(async fixture => {
    const sourceFingerprint = await captureAuthoritativeFingerprint(fixture.solutionWorkspace);
    const reviewerFingerprint = await captureAuthoritativeFingerprint(fixture.reviewerWorkspace);
    const result = await captureFixedReplayCase({
      reportPath: fixture.reportPath,
      workflowIdentity,
      outputPath: fixture.outputPath,
    });

    assert.equal(result.manifest.caseId, 'fixed-case');
    assert.equal(result.manifest.problemPackage.sha256, sha256Hex(await readFile(fixture.packagePath)));
    assert.deepEqual(
      new Set(result.manifest.declaredArtifacts.map(artifact => artifact.ref)),
      new Set([...packageArtifactRefs, solutionOnlyArtifactRef]),
    );
    assert.equal(result.manifest.solution.workspaceBaselineFingerprintSha256, sourceFingerprint);
    assert.equal(result.manifest.reviewer.workspaceBaselineFingerprintSha256, reviewerFingerprint);
    assert.equal(await captureAuthoritativeFingerprint(join(fixture.outputPath, 'workspaces/solution')), sourceFingerprint);
    assert.equal(await captureAuthoritativeFingerprint(join(fixture.outputPath, 'workspaces/reviewer')), reviewerFingerprint);
    assert.equal(await captureAuthoritativeFingerprint(fixture.solutionWorkspace), sourceFingerprint);
    assert.equal(await captureAuthoritativeFingerprint(fixture.reviewerWorkspace), reviewerFingerprint);

    const solutionManifest = await readWorkspaceManifest(fixture.solutionWorkspace);
    const copiedManifest = await readWorkspaceManifest(join(fixture.outputPath, 'workspaces/solution'));
    assert.deepEqual(copiedManifest, solutionManifest);
    for (const entry of solutionManifest.entries) {
      const sourcePath = join(fixture.solutionWorkspace, entry.path);
      const copiedPath = join(fixture.outputPath, 'workspaces/solution', entry.path);
      assert.equal((await lstat(copiedPath)).isFile() || (await lstat(copiedPath)).isSymbolicLink(), true);
      assert.equal(await hashWorkspaceObject(copiedPath, entry.objectKind), entry.sha256);
      assert.equal(await hashWorkspaceObject(sourcePath, entry.objectKind), entry.sha256);
    }

    const caseManifest = JSON.parse(await readFile(join(fixture.outputPath, 'case.json'), 'utf8')) as Record<string, unknown>;
    for (const forbidden of ['expectedRoute', 'expectedSolutionStatus', 'expectedReviewerDecision', 'qualityScore', 'goldAnswer']) {
      assert.equal(forbidden in caseManifest, false, `case manifest must not contain ${forbidden}`);
    }
    assert.equal(await pathExists(join(fixture.outputPath, 'historical/source-report.json')), true);
    assert.equal(await pathExists(join(fixture.outputPath, 'historical/solution-invocation.json')), true);
    assert.equal(await pathExists(join(fixture.outputPath, 'historical/solution-result.json')), true);
    assert.equal(await pathExists(join(fixture.outputPath, 'historical/reviewer-invocation.json')), true);
    assert.equal(await pathExists(join(fixture.outputPath, 'historical/reviewer-result.json')), true);
    assert.equal(await pathExists(join(fixture.outputPath, 'historical/decision.json')), true);
    assert.equal(await pathExists(join(fixture.outputPath, 'input/problem-package.json')), true);
    assert.equal(await pathExists(join(fixture.outputPath, `input/artifacts/${solutionOnlyArtifactRef}`)), true);
  });
}

async function testOutputAlreadyExists(): Promise<void> {
  await withFixture(async fixture => {
    await mkdir(fixture.outputPath, { recursive: true });
    await writeFile(join(fixture.outputPath, 'sentinel.txt'), 'keep me\n');
    await expectRejected(
      () => captureFixedReplayCase({ reportPath: fixture.reportPath, workflowIdentity, outputPath: fixture.outputPath }),
      /fixed replay case output already exists/,
    );
    assert.equal(await readFile(join(fixture.outputPath, 'sentinel.txt'), 'utf8'), 'keep me\n');
  });
}

async function testSourceProvenanceFailures(): Promise<void> {
  await withFixture(async fixture => {
    const invocation = JSON.parse(await readFile(fixture.solutionInvocationPath, 'utf8')) as Record<string, unknown>;
    invocation.problemPackageSha256 = 'b'.repeat(64);
    await writeJson(fixture.solutionInvocationPath, invocation);
    await expectRejected(
      () => captureFixedReplayCase({ reportPath: fixture.reportPath, workflowIdentity, outputPath: fixture.outputPath }),
      /problem-package bytes hash does not match historical solution invocation/,
    );
    assert.equal(await pathExists(fixture.outputPath), false);
  });

  await withFixture(async fixture => {
    await writeFile(join(fixture.solutionWorkspace, 'src/mutated.ts'), 'mutated\n');
    await expectRejected(
      () => captureFixedReplayCase({ reportPath: fixture.reportPath, workflowIdentity, outputPath: fixture.outputPath }),
      /Solution workspace fingerprint mismatch/,
    );
    assert.equal(await pathExists(fixture.outputPath), false);
  });

  await withFixture(async fixture => {
    await writeFile(join(fixture.reviewerWorkspace, 'src/mutated.ts'), 'mutated\n');
    await expectRejected(
      () => captureFixedReplayCase({ reportPath: fixture.reportPath, workflowIdentity, outputPath: fixture.outputPath }),
      /Reviewer workspace fingerprint mismatch/,
    );
    assert.equal(await pathExists(fixture.outputPath), false);
  });
}

async function testManifestSkillAndArtifactFailures(): Promise<void> {
  await withFixture(async fixture => {
    const manifest = JSON.parse(await readFile(join(fixture.solutionWorkspace, '.agent-workspace-manifest.json'), 'utf8')) as Record<string, unknown>;
    manifest.jobKind = 'reviewer';
    await writeJson(join(fixture.solutionWorkspace, '.agent-workspace-manifest.json'), manifest);
    await expectRejected(
      () => captureFixedReplayCase({ reportPath: fixture.reportPath, workflowIdentity, outputPath: fixture.outputPath }),
      /Solution workspace manifest jobKind must be solution/,
    );
    assert.equal(await pathExists(fixture.outputPath), false);
  });

  await withFixture(async fixture => {
    const manifest = JSON.parse(await readFile(join(fixture.reviewerWorkspace, '.agent-workspace-manifest.json'), 'utf8')) as Record<string, unknown>;
    manifest.jobKind = 'solution';
    await writeJson(join(fixture.reviewerWorkspace, '.agent-workspace-manifest.json'), manifest);
    await expectRejected(
      () => captureFixedReplayCase({ reportPath: fixture.reportPath, workflowIdentity, outputPath: fixture.outputPath }),
      /Reviewer workspace manifest jobKind must be reviewer/,
    );
    assert.equal(await pathExists(fixture.outputPath), false);
  });

  await withFixture(async fixture => {
    await writeFile(join(fixture.solutionWorkspace, historicalSkillAssignment.canonicalPath), 'not historical skill\n');
    await expectRejected(
      () => captureFixedReplayCase({ reportPath: fixture.reportPath, workflowIdentity, outputPath: fixture.outputPath }),
      /Solution workspace fingerprint mismatch|historical Solution Skill hash mismatch/,
    );
    assert.equal(await pathExists(fixture.outputPath), false);
  });

  await withFixture(async fixture => {
    await unlink(fixture.artifactPaths[packageArtifactRefs[0]]);
    await expectRejected(
      () => captureFixedReplayCase({ reportPath: fixture.reportPath, workflowIdentity, outputPath: fixture.outputPath }),
      /declared artifact does not exist/,
    );
    assert.equal(await pathExists(fixture.outputPath), false);
  });

  await withFixture(async fixture => {
    await writeFile(fixture.artifactPaths[packageArtifactRefs[0]], 'changed artifact\n');
    await expectRejected(
      () => captureFixedReplayCase({ reportPath: fixture.reportPath, workflowIdentity, outputPath: fixture.outputPath }),
      /Solution sealed artifact hash mismatch|Reviewer sealed artifact hash mismatch|declared artifact hash mismatch/,
    );
    assert.equal(await pathExists(fixture.outputPath), false);
  });
}

async function testUnsafeInputsAndNoPartialFinalCase(): Promise<void> {
  await withFixture(async fixture => {
    await rewriteProblemPackage(fixture, value => {
      value.source.observablePayloadRef = '../outside.json';
    });
    await expectRejected(
      () => captureFixedReplayCase({ reportPath: fixture.reportPath, workflowIdentity, outputPath: fixture.outputPath }),
      /declared artifact .* escapes source workflow root/,
    );
    assert.equal(await pathExists(fixture.outputPath), false);
  });

  await withFixture(async fixture => {
    const link = join(fixture.solutionWorkspace, 'src/example-link.ts');
    await unlink(link);
    await symlink('/tmp/outside-fixed-replay-case', link);
    await expectRejected(
      () => captureFixedReplayCase({ reportPath: fixture.reportPath, workflowIdentity, outputPath: fixture.outputPath }),
      /absolute symlink is not allowed|symlink escapes workspace/,
    );
    assert.equal(await pathExists(fixture.outputPath), false);
  });

  await withFixture(async fixture => {
    await execFileAsync('mkfifo', [join(fixture.reviewerWorkspace, 'unsupported-object')]);
    await expectRejected(
      () => captureFixedReplayCase({ reportPath: fixture.reportPath, workflowIdentity, outputPath: fixture.outputPath }),
      /unsupported source object/,
    );
    assert.equal(await pathExists(fixture.outputPath), false);
    const siblings = await readdir(fixture.root);
    assert.equal(siblings.some(name => name.includes('fixed-case.capture-')), false);
  });
}

async function testCliArguments(): Promise<void> {
  await withFixture(async fixture => {
    await expectRejected(
      () => runFixedReplayCaseCli(['--report', fixture.reportPath, '--workflow', workflowIdentity]),
      /missing required argument: --output/,
    );
    await expectRejected(
      () => runFixedReplayCaseCli(['--report', fixture.reportPath, '--workflow', workflowIdentity, '--output', fixture.outputPath, '--unknown', 'x']),
      /unknown argument: --unknown/,
    );
    await expectRejected(
      () => runFixedReplayCaseCli(['--report', fixture.reportPath, '--report', fixture.reportPath, '--workflow', workflowIdentity, '--output', fixture.outputPath]),
      /duplicate argument: --report/,
    );
  });
}

export async function runFixedReplayCaseCaptureTests(): Promise<void> {
  await testValidCaptureAndCopiedWorkspace();
  await testOutputAlreadyExists();
  await testSourceProvenanceFailures();
  await testManifestSkillAndArtifactFailures();
  await testUnsafeInputsAndNoPartialFinalCase();
  await testCliArguments();
}

runFixedReplayCaseCaptureTests()
  .then(() => console.log('fixedReplayCaseCapture.test.ts: ok'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
